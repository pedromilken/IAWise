/* Adaptador do laboratório de agentes: IAWISE (Inteligência Computacional GBC073 e Inteligência Artificial GBC063, UFU).
   O núcleo (laboratorio.js) é o mesmo nas cinco ferramentas; este arquivo só diz ao núcleo o que é um item, o que o
   agente "estudou" (notas) e como corrigir.

   O IAWise não tem banco de questões: cada tarefa pede um ESTADO num simulador interativo ("leve a acurácia a 0%").
   Por isso o agente joga os simuladores REAIS (src/sims.js e src/sims2.js), montados sem navegador (jsdom, canvas nulo).
   A cada rodada ele recebe a tarefa, a lista de controles (sliders, seletores, botões, campos) com os valores atuais e o
   texto visível do simulador, e responde com comandos:
       SET <n> <valor>     slider ou campo numérico
       CHOOSE <n> <opção>  seletor
       CLICK <n> [vezes]   botão (até 10 vezes por comando, 20 por rodada)
       TOGGLE <n>          caixa de marcar
       TAP <n> <x> <y>     clique no canvas (o agente recebe o texto desenhado no canvas com as coordenadas)
       CHECK               verificar a tarefa (o botão "Verificar" do jogo)
   Quem corrige é o check() do próprio simulador, o mesmo do jogo. Acerto = a tarefa verificada com sucesso em até
   --turnos rodadas (padrão 6). O primeiro CHECK também é registrado (no jogo, só a primeira verificação falha conta).
   O agente não vê o desenho do canvas, mas recebe o TEXTO desenhado nele (rótulos e valores, com coordenadas) e pode
   tocar nele (TAP): é o que permite, por exemplo, virar as setas da política no rover e editar o kernel da convolução.
   O que só existe como forma ou cor continua fora do alcance (a C1 mede isso).

   Itens: as 4 tarefas de cada uma das 28 fases; ficam de fora as tarefas que já vêm cumpridas ao montar o simulador
   ("gratuitas", testadas com semente fixa: regra decidida antes dos resultados).
   Habilidade = a fase (aula), como no rastreamento do jogo. Com 4 tarefas por fase, as notas chegam depois da 2ª tarefa
   (passo = 2), para haver tarefas antes e depois do degrau.
   Notas = os 3 conceitos teóricos da aula + as dicas das OUTRAS tarefas da mesma fase (como exemplos resolvidos). */
"use strict";
const fs = require("fs"), path = require("path");
module.exports = {
  id: "iawise", nome: "IAWise",
  carregar({ ROOT, LAB, opts }) {
    let JSDOM; try { ({ JSDOM } = require("jsdom")); } catch (e) { throw new Error("O IAWise precisa do jsdom para montar os simuladores sem navegador. Rode uma vez: npm install --prefix tools/agentes"); }
    /* erros dentro dos simuladores (como num navegador) são contados, não impressos */
    const vc = new (require("jsdom").VirtualConsole)(); let simErrors = 0; vc.on("jsdomError", () => simErrors++);
    const dom = new JSDOM("<!doctype html><html><body></body></html>", { runScripts: "outside-only", virtualConsole: vc }), w = dom.window;
    /* canvas nulo que guarda o TEXTO desenhado (fillText) com a posição: o agente não vê o desenho, mas lê os rótulos e
       valores que o simulador escreve nele, e pode tocar no canvas (TAP) nas coordenadas desses rótulos */
    const noop = new Proxy(function () {}, { get: (t, k) => typeof k === "symbol" ? undefined : noop, apply: () => undefined, set: () => true });
    const TXT = new WeakMap();
    w.HTMLCanvasElement.prototype.getContext = function () { const cv = this; if (!TXT.has(cv)) TXT.set(cv, []);
      return new Proxy({}, { set: () => true, get: (t, k) => {
        if (k === "fillText" || k === "strokeText") return (txt, x, y) => { if (k === "fillText") TXT.get(cv).push({ t: String(txt), x: Math.round(x), y: Math.round(y) }); };
        if (k === "clearRect") return (x, y, ww, hh) => { if (x <= 0 && y <= 0 && ww >= (cv.w || cv.width) && hh >= (cv.h || cv.height)) TXT.set(cv, []); };
        if (k === "measureText") return () => ({ width: 10 });
        if (k === "createLinearGradient" || k === "createRadialGradient" || k === "createPattern") return () => ({ addColorStop() {} });
        if (k === "getImageData" || k === "createImageData") return (a, b, c, d) => ({ data: new Uint8ClampedArray(4 * Math.max(1, (c || a || 1) * (d || b || 1))), width: c || a, height: d || b });
        return typeof k === "symbol" ? undefined : noop; } }); };
    w.HTMLCanvasElement.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, x: 0, y: 0, width: this.w || this.width, height: this.h || this.height, right: this.w || this.width, bottom: this.h || this.height }; };
    w.getComputedStyle = () => ({ getPropertyValue: () => "#000" });
    w.devicePixelRatio = 1; let clock = 1700000000000; w.Date.now = () => (clock += 1000);
    /* Tempo virtual: animações com setTimeout (ex.: o rover caminhando) rodam até o fim logo após cada comando, na ordem dos
       prazos, sem depender do relógio real nem da latência do cérebro. Teto de 10 mil disparos por descarga. */
    let tq = [], tid = 0, vnow = 0;
    w.setTimeout = (fn, ms) => { tq.push({ id: ++tid, fn, t: vnow + Math.max(0, +ms || 0) }); return tid; };
    w.setInterval = (fn, ms) => { const id = ++tid, step = Math.max(1, +ms || 1), rep = () => { tq.push({ id, fn: () => { fn(); rep(); }, t: vnow + step }); }; rep(); return id; };
    w.clearTimeout = w.clearInterval = id => { tq = tq.filter(x => x.id !== id); };
    w.requestAnimationFrame = fn => w.setTimeout(() => fn(vnow), 16); w.cancelAnimationFrame = id => w.clearTimeout(id);
    const flush = () => { let n = 0; while (tq.length && n++ < 10000) { tq.sort((a, b) => a.t - b.t || a.id - b.id); const x = tq.shift(); vnow = x.t; try { x.fn(); } catch (e) {} } tq = []; };
    const files = ["data.js", "game.js", "lang-pt.js", "lang-pt2.js", "lang-en.js", "lang-en2.js", "sims.js", "sims2.js"];
    const src = files.map(f => fs.readFileSync(path.join(ROOT, "src", f), "utf8").replace(/^"use strict";/, "")).join("\n");
    w.eval(src.replace(/^const (\w+)\s*=/gm, "var $1 =") + "\n;window.__IA={SIMS,TASKS,LANG,LESSONS,GUESS};");
    const { SIMS, TASKS, LANG, LESSONS, GUESS } = w.__IA;
    const TURNS = Math.max(1, (opts && opts.turnos) || 6);

    /* monta um simulador num contêiner novo, com o sorteio do contexto */
    function mount(lesson, lang, r, keepClock) {
      w.Math.random = r; if (!keepClock) clock = 1700000000000 + Math.floor(r() * 1e9);
      const el = w.document.createElement("div"); w.document.body.append(el);
      tq = []; const h = SIMS[lesson.sim].mount(el, { s: k => ((LANG[lang] || LANG.pt).sims[lesson.sim] || {})[k] || k, refreshTasks() {}, lang }); flush();
      return { el, h, close() { try { h.destroy && h.destroy(); } catch (e) {} el.remove(); } };
    }
    const items = [], byId = {}, freeTasks = [];
    for (const l of LESSONS) { if (!l.sim) continue;
      for (const tk of TASKS[l.sim]) { let free = false; try { const m = mount(l, "pt", LAB.makeRng("gratuita", l.id, tk.id)); free = !!m.h.check(tk.k || tk.id); m.close(); } catch (e) { free = true; }
        if (free) { freeTasks.push(l.id + ":" + tk.id); continue; }
        const it = { id: l.id + ":" + tk.id, skill: l.id, type: l.sim, d: tk.d, c: GUESS, task: tk.id, key: tk.k || tk.id, lesson: l }; items.push(it); byId[it.id] = it; } }
    const L = l => LANG[l] || LANG.pt, X = (l, s) => L(l).lessons[s];
    const skillName = s => X("pt", s).name + " (" + s + ")";
    function notes(lang, skill, exclude) {
      const x = X(lang, skill), others = items.filter(i => i.skill === skill && i.id !== exclude);
      return "## " + x.name + " — " + x.about + "\n" + x.theory.map(([h, p]) => "- " + h + ": " + p).join("\n") +
        "\nWORKED EXAMPLES (other tasks of this lesson and how to solve them):\n" + others.map(i => "* " + x.tasks[i.task].t + " → " + x.tasks[i.task].h).join("\n");
    }
    /* o que o agente "vê": controles numerados e o texto visível do simulador */
    const label = e => { const lb = e.closest("label"); const sp = lb && lb.querySelector("span"); if (sp && sp.textContent.trim()) return sp.textContent.trim();
      if (lb) return lb.textContent.replace(/\s+/g, " ").trim().slice(0, 40); return (e.getAttribute("placeholder") || e.getAttribute("aria-label") || "").trim(); };
    const controls = el => [...el.querySelectorAll("input,select,button"), ...el.querySelectorAll("canvas")];
    function describe(el) {
      const cs = controls(el).map((e, i) => { const n = "[" + (i + 1) + "] ";
        if (e.tagName === "CANVAS") { const tx = (TXT.get(e) || []).slice().sort((a, b) => a.y - b.y || a.x - b.x).slice(0, 80);
          return n + "canvas " + (e.w || e.width) + "×" + (e.h || e.height) + " (TAP " + (i + 1) + " <x> <y> clicks it) · text drawn on it, as text@(x,y): " + (tx.map(z => z.t + "@(" + z.x + "," + z.y + ")").join("  ") || "(none)"); }
        if (e.tagName === "BUTTON") return n + "button \"" + e.textContent.replace(/\s+/g, " ").trim() + "\"" + (e.disabled ? " (disabled)" : "");
        if (e.tagName === "SELECT") return n + "selector \"" + label(e) + "\" = " + (e.options[e.selectedIndex] || {}).textContent + " · options: " + [...e.options].map(o => o.textContent.trim()).join(" | ");
        if (e.type === "checkbox") return n + "checkbox \"" + label(e) + "\" = " + (e.checked ? "on" : "off");
        if (e.type === "range") return n + "slider \"" + label(e) + "\" = " + e.value + " (min " + e.min + ", max " + e.max + ", step " + e.step + ")";
        return n + "number field \"" + label(e) + "\" = " + (e.value === "" ? "(empty)" : e.value); });
      const c = el.cloneNode(true); c.querySelectorAll("select,button,script,style").forEach(x => x.remove());
      const tw = w.document.createTreeWalker(c, 4), parts = []; while (tw.nextNode()) { const v = tw.currentNode.nodeValue.trim(); if (v) parts.push(v); }
      const text = parts.join(" ").replace(/\s+/g, " ").trim();
      return "CONTROLS:\n" + cs.join("\n") + "\nVISIBLE TEXT: " + (text.length > 900 ? text.slice(0, 900) + "…" : text);
    }
    /* aplica os comandos; devolve {checks, valid, junk, log} */
    function apply(el, h, key, reply) {
      const cs = controls(el), out = { checks: [], valid: 0, junk: 0, log: [], clicks: 0, timeout: 0 }, tTurn = Date.now(), ev = (e, t) => e.dispatchEvent(new w.Event(t, { bubbles: true }));
      for (let line of String(reply).split(/\n|;/)) {
        /* leitura tolerante, como o corretor de múltipla escolha: "[4]" vale 4, "SET 2 = 0.5" vale "SET 2 0.5", e o verbo trocado
           (CHOOSE num slider, SET num seletor) é entendido pelo tipo do controle. Isso conta como formato "tolerado", não como erro:
           o que se mede é o conhecimento do domínio, não a obediência à sintaxe. (Na triagem de 08/10, 1/3 das respostas do
           gemma3:12b vinham com colchetes, mais com notas do que sem: sem esta leitura, as notas pareciam piorar o acerto.) */
        line = line.replace(/^[\s>*\-`#]+|[`\s*]+$/g, "").replace(/\[\s*(\d+)\s*\]/g, "$1").replace(/^(\w+)\s*:\s*/, "$1 "); if (!line) continue;
        const m = line.match(/^(SET|CHOOSE|SELECT|CLICK|PRESS|TOGGLE|TAP|CHECK|VERIFY)\b\s*(\d+)?\s*[=:]?\s*(.*)$/i); if (!m) { if (!/^ANSWER/i.test(line)) out.junk++; continue; }
        let cmd = m[1].toUpperCase(); const e = m[2] ? cs[+m[2] - 1] : null; let arg = (m[3] || "").replace(/^(to|para|=)\s+/i, "").trim();
        const canon = { SELECT: "CHOOSE", PRESS: "CLICK", VERIFY: "CHECK" }; if (canon[cmd]) { cmd = canon[cmd]; out.tol = (out.tol || 0) + 1; }
        if (e && cmd === "CHOOSE" && e.tagName === "INPUT" && e.type !== "checkbox" && /-?\d/.test(arg)) { cmd = "SET"; out.tol = (out.tol || 0) + 1; }
        else if (e && cmd === "SET" && e.tagName === "SELECT") { cmd = "CHOOSE"; out.tol = (out.tol || 0) + 1; }
        else if (e && cmd === "SET" && e.type === "checkbox") { cmd = "TOGGLE"; out.tol = (out.tol || 0) + 1; }
        try {
          flush();
          if (cmd === "CHECK") { const ok = !!h.check(key); out.checks.push(ok); out.valid++; out.log.push("CHECK → " + (ok ? "done" : "not yet")); if (ok) break; continue; }
          if (!e) { out.junk++; out.log.push(line + " → no such control"); continue; }
          if (cmd === "SET" && e.tagName === "INPUT" && e.type !== "checkbox") { const v = parseFloat((arg.replace(",", ".").match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/i) || [""])[0]); if (isNaN(v)) { out.junk++; continue; }
            /* como o slider de verdade: limita ao intervalo e encaixa no passo */
            let x = v; if (e.type === "range") { const lo = +e.min, hi = +e.max, st = +e.step || 1; x = Math.min(hi, Math.max(lo, lo + Math.round((v - lo) / st) * st)); x = +x.toFixed(6); }
            e.value = String(x); ev(e, "input"); ev(e, "change"); out.valid++; out.log.push("SET " + m[2] + " = " + e.value); }
          else if (cmd === "CHOOSE" && e.tagName === "SELECT") { const a = arg.toLowerCase().replace(/^["']|["']$/g, ""); const o = [...e.options].find(o => o.value.toLowerCase() === a || o.textContent.trim().toLowerCase() === a) || [...e.options].find(o => o.textContent.toLowerCase().includes(a) && a);
            if (!o) { out.junk++; out.log.push(line + " → no such option"); continue; } e.value = o.value; ev(e, "change"); out.valid++; out.log.push("CHOOSE " + m[2] + " = " + o.textContent.trim()); }
          else if (cmd === "CLICK" && e.tagName === "BUTTON") { /* limites por CONTAGEM (reprodutíveis em qualquer máquina): até 10 cliques por comando e 20 por rodada.
               Só uma trava de segurança usa o relógio (30 s por rodada); se disparar, o log marca "timeout" e a reprodução exata não é garantida */
            const k = Math.min(10, Math.max(1, parseInt(arg) || 1)); let done = 0;
            for (; done < k && out.clicks < 20; done++) { if (Date.now() - tTurn > 30000) { out.timeout = 1; break; } if (!e.disabled) e.click(); out.clicks++; }
            out.valid++; out.log.push("CLICK " + m[2] + " ×" + done + (done < (parseInt(arg) || 1) ? " (limit: 10 clicks per command, 20 per turn)" : "")); }
          else if (cmd === "TAP" && e.tagName === "CANVAS") { const [x, y] = (arg.match(/-?\d+(?:\.\d+)?/g) || []).map(Number); if (x == null || y == null) { out.junk++; continue; }
            e.dispatchEvent(new w.MouseEvent("click", { bubbles: true, clientX: x, clientY: y })); out.valid++; out.log.push("TAP " + m[2] + " at (" + x + "," + y + ")"); }
          else if ((cmd === "TOGGLE" || cmd === "CLICK") && e.type === "checkbox") { e.click(); out.valid++; out.log.push("TOGGLE " + m[2]); }
          else { out.junk++; out.log.push(line + " → wrong command for this control"); }
        } catch (err) { out.valid++; out.log.push(line + " → the simulator raised an error"); }
      }
      flush(); return out;
    }
    const SYS = l => `You are role-playing an adult BEGINNER studying ${l === "en" ? "" : ""}artificial intelligence and neural networks in a game with interactive simulators. The game interface is in ${l === "en" ? "English" : "Portuguese"}. You only know what is written in your NOTES below; if the NOTES do not cover the task, act the way a beginner would try, without using knowledge you are not supposed to have.
Each turn you see the simulator controls and its visible text. Reply ONLY with commands, one per line (at most 6 per turn), with the control number without brackets (e.g. SET 2 0.5):
SET <n> <value> | CHOOSE <n> <option> | CLICK <n> [times, at most 10] | TOGGLE <n> | TAP <n> <x> <y> (canvas) | CHECK
Write CHECK when you believe the task is accomplished. You have ${TURNS} turns.`;
    /* Episódios de várias rodadas: cada um tem o PRÓPRIO gerador (semente tirada de r antes de qualquer espera) e o próprio
       relógio, reinstalados no simulador a cada trecho síncrono. Assim o resultado não depende da ordem em que as respostas
       do cérebro chegam (em série ou com --paralelo), e a mesma rodada refeita dá o mesmo resultado. No máximo LAB_PARALELO
       episódios ficam montados ao mesmo tempo (fila na ordem de chegada). */
    let busy = 0; const waitQ = [], lim = Math.max(1, +(process.env.LAB_PARALELO || 1));
    const gate = () => busy < lim ? (busy++, Promise.resolve()) : new Promise(res => waitQ.push(res));
    const ungate = () => { if (waitQ.length) waitQ.shift()(); else busy--; };
    /* agente ao acaso (linha de base): até 5 comandos sorteados entre os controles visíveis, e CHECK em toda rodada */
    function randomCommands(view, rr) {
      const lines = view.split("\n").filter(l => /^\[\d+\]/.test(l)), out = [];
      for (let k = 0; k < 5 && lines.length; k++) { const l = lines[Math.floor(rr() * lines.length)], i = l.match(/^\[(\d+)\]/)[1];
        if (/ slider /.test(l)) { const mn = +(l.match(/min (-?[\d.]+)/) || [0, 0])[1], mx = +(l.match(/max (-?[\d.]+)/) || [0, 1])[1]; out.push("SET " + i + " " + (mn + rr() * (mx - mn)).toFixed(3)); }
        else if (/ selector /.test(l)) { const op = l.split("options: ")[1].split(" | "); out.push("CHOOSE " + i + " " + op[Math.floor(rr() * op.length)]); }
        else if (/ checkbox /.test(l)) out.push("TOGGLE " + i);
        else if (/ number field /.test(l)) out.push("SET " + i + " " + (rr() * 4 - 1).toFixed(2));
        else if (/ canvas /.test(l)) { const [cw, ch] = l.match(/canvas (\d+)×(\d+)/).slice(1).map(Number); out.push("TAP " + i + " " + Math.floor(rr() * cw) + " " + Math.floor(rr() * ch)); }
        else out.push("CLICK " + i + " " + (1 + Math.floor(rr() * 10))); }
      return out.join("\n") + "\nCHECK";
    }
    async function attempt(brain, lang, it, notesText, r) {
      const seed = Math.floor(r() * 2147483647);
      if (brain.kind === "simulado") { const ok = r() < (notesText ? 0.85 : 0.3); await brain.call([{ role: "system", content: "SIM" }, { role: "user", content: "NOTES:\n" + (notesText || "(none)") + "\nCORRECT_FOR_SIMULATION: CHECK" }], { rng: r }); return { ok, fmt: "pedido", turns: 1, first: ok ? 1 : 0, raw: "(simulado)" }; }
      await gate();
      const ar = LAB.makeRng("episodio", seed); let epClock = 1700000000000 + seed;
      const enter = () => { w.Math.random = ar; clock = epClock; }, leave = () => { epClock = clock; };
      enter(); const x = X(lang, it.skill), m = mount(it.lesson, lang, ar, true), msgs = [{ role: "system", content: SYS(lang) }]; leave();
      let ok = false, first = null, valid = 0, junk = 0, turns = 0, checked = false, last = "", timeout = 0;
      try {
        for (let t = 1; t <= TURNS && !ok; t++) {
          turns = t;
          const head = t === 1 ? "NOTES:\n" + (notesText || "(none)") + "\n\nLESSON: " + x.name + " — " + x.about + "\nTASK: " + x.tasks[it.task].t + "\n\n" : "";
          enter(); const view = describe(m.el); leave();
          msgs.push({ role: "user", content: head + "TURN " + t + " of " + TURNS + "\n" + view + (last ? "\nRESULT OF YOUR LAST COMMANDS: " + last : "") });
          const a = brain.kind === "aleatorio" ? (brain.stats.calls++, randomCommands(view, ar)) : await brain.call(msgs, { temperature: 0.7, max: 140, rng: ar }); msgs.push({ role: "assistant", content: a || "(nothing)" });
          enter(); const res = apply(m.el, m.h, it.key, a); leave();
          valid += res.valid; junk += res.junk + (res.tol || 0); timeout |= res.timeout; last = res.log.join("; ") || "no valid command";
          if (res.checks.length) { checked = true; if (first == null) first = res.checks[0] ? 1 : 0; if (res.checks.some(Boolean)) ok = true; }
        }
        if (!ok && !checked) { enter(); ok = !!m.h.check(it.key); leave(); if (first == null) first = ok ? 1 : 0; }   /* nunca escreveu CHECK: verificação implícita no fim, formato "tolerado" */
      } finally { m.close(); ungate(); }
      return { ok, first, turns, timeout, fmt: !valid ? "ilegivel" : (junk || !checked) ? "tolerado" : "pedido", raw: msgs.filter(z => z.role === "assistant").map(z => z.content).join(" | ").slice(0, 200) };
    }
    return {
      dominioPt: "inteligência artificial e redes neurais (simuladores)", dominioEn: "artificial intelligence and neural networks", idiomas: ["pt", "en"], passo: 2, chamadasPorTentativa: 4,
      padrao: { habilidades: LESSONS.filter(l => l.sim).map(l => l.id), itensPorHabilidade: 4 },
      skills: LESSONS.filter(l => l.sim).map(l => ({ id: l.id, area: l.world })), items, byId, freeTasks,
      area: s => s.slice(0, 2), skillName, langName: l => ({ pt: "Portuguese", en: "English" })[l] || l, notes, attempt,
      tutorTask: (lang, it) => { const x = X(lang, it.skill); return { task: "LESSON: " + x.name + "\nTASK IN THE SIMULATOR: " + x.tasks[it.task].t + "\nTHE STUDENT VERIFIED THE TASK BUT IT IS NOT DONE YET.", correct: "", reference: x.tasks[it.task].h }; },
      preview: (lang, it, notesText, r) => { const m = mount(it.lesson, lang, r); try { return SYS(lang) + "\n\nNOTES:\n" + notesText + "\n\nTASK: " + X(lang, it.skill).tasks[it.task].t + "\n" + describe(m.el); } finally { m.close(); } },
      limites: ["O agente não vê o desenho do canvas, só o texto escrito nele (com coordenadas); tarefas que dependem de formas ou cores ficam mais difíceis (a C1 mostra quais).",
        "Tarefas que já vêm cumpridas ao montar o simulador ficam de fora: " + (freeTasks.join(", ") || "nenhuma") + ".",
        "Cada tentativa custa até " + TURNS + " chamadas (episódio de várias rodadas); o custo por item é o maior dos cinco domínios.",
        "Acerto = verificado com sucesso em até " + TURNS + " rodadas; a coluna first do log guarda só a primeira verificação, como o jogo conta."]
    };
  }
};
