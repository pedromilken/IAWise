/* IAWise - motor do jogo (derivado do DevWise, simplificado para fases com simulador) */
const LS = Object.fromEntries(LESSONS.map(l => [l.id, l]));
const ITEMS = []; for (const sim in TASKS) for (const t of TASKS[sim]) ITEMS.push({ ...t, sim, skill: LESSONS.find(l => l.sim === sim).id });
const IT = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const KEY = "iawise-v1", L0 = 0.15, UNLOCK = 0.6;
const URL_PILOT = (() => { try { const p = new URLSearchParams(location.search).get("piloto"); return p && KT.PILOTS.includes(p) ? p : null; } catch (e) { return null; } })();
const pilot = () => URL_PILOT || "elo";
const master = () => KT.master(pilot());
const today = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
let S, view = "home", cur = null, tab = "story", sim = null, sel = null, resetArmed = false, showJson = false, setMsg = "", msgs = [], hintOn = {}, lensOn = null;

/* ---------- Estado ---------- */
function guessLang() { const n = (navigator.language || "pt").slice(0, 2).toLowerCase(); return LANG[n] ? n : "pt"; }
function fresh() { const skills = {}; LESSONS.forEach(l => skills[l.id] = { L: L0, n: 0, c: 0 });
  return { v: 1, started: false, lang: guessLang(), skills, done: {}, failed: {}, log: [], xp: 0, xpTotal: 0, mode: "normal", inv: { shield: 0, boost: 0, lens: 0, key: 0 }, keyed: {}, boost: 0, titles: [], title: null, streak: 0, best: 0, lastWrong: false, confirm: true, name: "", theme: "auto", opened: {} }; }
function load() { try { const d = JSON.parse(localStorage.getItem(KEY) || "null"); if (d && d.v === 1 && d.skills) { const f = fresh(); for (const k in f) if (d[k] === undefined) d[k] = f[k]; LESSONS.forEach(l => { if (!d.skills[l.id]) d.skills[l.id] = { L: L0, n: 0, c: 0 }; }); if (!MODES[d.mode]) d.mode = "normal"; if (d.inv.key == null) d.inv.key = 0; if (!d.keyed) d.keyed = {}; if (!LANG[d.lang]) d.lang = "pt"; return d; } } catch (e) { } return fresh(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
/* Prior hierárquico: enquanto uma fase não tem nenhuma resposta, seu L0 = (1 − W)·L0_BASE + W·domínio atual do pré-requisito.
   Na primeira resposta contada o prior é congelado (tr.prior). ?prior=fixo na URL volta ao L0 fixo (para experimento).
   Em paralelo, tr.fix guarda um Elo com prior fixo (contrafactual), cujas previsões vão ao log como preds.elo_fixed. */
const PRIOR = { v: "hier-1", base: L0, w: .5, mode: (() => { try { return new URLSearchParams(location.search).get("prior") === "fixo" ? "fixo" : "hier"; } catch (e) { return "hier"; } })() };
function priorFor(id) { const pre = LS[id].pre; if (PRIOR.mode === "fixo" || !pre.length) return PRIOR.base; const m = Math.max(...pre.map(p => trk(p).L)); return (1 - PRIOR.w) * PRIOR.base + PRIOR.w * m; }
function trk(id) { const tr = S.skills[id];
  if (tr.n === 0 && tr.prior == null) { const p = priorFor(id); if (Math.abs(tr.L - p) > 1e-9) { tr.L = p; tr.m = null; } }
  if (!tr.fix) tr.fix = { L: tr.prior != null && PRIOR.mode === "fixo" ? tr.prior : PRIOR.base };
  KT.ensure(tr.fix); return KT.ensure(tr); }

/* ---------- i18n ---------- */
const Lg = () => LANG[S.lang] || LANG.pt;
function t(k, vars) { let s = Lg().ui[k]; if (s == null) s = LANG.pt.ui[k]; if (s == null) return k; if (vars && typeof s === "string") for (const v in vars) s = s.split("{" + v + "}").join(String(vars[v])); return s; }
const lsT = id => Lg().lessons[id] || LANG.pt.lessons[id];
const wT = id => Lg().worlds[id] || LANG.pt.worlds[id];
const gt = () => Lg().game || LANG.pt.game;
const simT = (simId, k) => ((Lg().sims || {})[simId] || {})[k] || (LANG.pt.sims[simId] || {})[k] || k;
const pct = x => Math.round(x * 100) + "%";

/* ---------- Motor adaptativo ---------- */
const mastered = id => trk(id).L >= master();
const confirmed = id => !S.confirm || (trk(id).days || []).length >= 2;
const awaitsConfirm = id => mastered(id) && !confirmed(id);
const allDone = id => !!LS[id].sim && TASKS[LS[id].sim].every(tk => S.done[tk.id]);
const preOk = id => LS[id].pre.every(p => trk(p).L >= UNLOCK || allDone(p));
const nextOf = id => LESSONS.find(l => l.world === LS[id].world && l.n === LS[id].n + 1);
const gateOk = id => S.xpTotal >= (LS[id].gate || 0) || !!S.opened[id];
const unlocked = id => (preOk(id) && gateOk(id)) || !!S.keyed[id];
const built = id => !!LS[id].sim;
function earn(x) { S.xp += x; S.xpTotal += x; }
const roleIdx = () => { let i = 0; ROLE_XP.forEach((x, k) => { if (S.xpTotal >= x) i = k; }); return i; };
const roleName = () => t("roles")[roleIdx()];

function answer(item, ok, usedHint) {
  const tr = trk(item.skill), c = GUESS, was = { L: tr.L, m: mastered(item.skill), r: roleIdx() }, preds = KT.predictAll(tr, item, c);
  const unlockedBefore = LESSONS.filter(l => unlocked(l.id)).map(l => l.id);
  /* Só a PRIMEIRA verificação falha de cada tarefa vira evidência para o modelo: verificar de novo enquanto se ajusta o simulador
     é exploração, não desconhecimento. As demais falhas só custam XP e ficam no log com counted:0. */
  const counted = ok || !S.failed[item.id];
  if (counted && tr.prior == null) tr.prior = +tr.L.toFixed(4);
  preds.elo_fixed = +Math.min(.999, Math.max(.001, KT.MODELS.elo.predict(tr.fix.m.elo, item, c))).toFixed(4);
  if (counted) { KT.updateAll(tr, item, c, ok); KT.MODELS.elo.update(tr.fix.m.elo, item, c, ok); tr.L = KT.mastery(tr, pilot()); tr.n++; if (ok) tr.c++; }
  if (!ok) S.failed[item.id] = (S.failed[item.id] || 0) + 1;
  if (ok) { tr.days = tr.days || []; if (!tr.days.includes(today())) tr.days.push(today()); }
  S.log.push({ ts: Date.now(), item: item.id, skill: item.skill, ok: ok ? 1 : 0, counted: counted ? 1 : 0, keyed: S.keyed[item.skill] ? 1 : 0, prior: tr.prior, priorMode: PRIOR.mode + "/" + PRIOR.v, hint: usedHint ? 1 : 0, lang: S.lang, mode: S.mode, before: +was.L.toFixed(3), after: +tr.L.toFixed(3), preds });
  msgs = [];
  const m = MODES[S.mode];
  if (ok) {
    let xp = Math.round(TASK_XP[item.d] * m.mult * (usedHint && HINT_HALF ? .5 : 1));
    if (S.boost > 0) { xp *= 2; S.boost--; }
    S.streak++; S.best = Math.max(S.best, S.streak);
    if (S.lastWrong) { xp += COMEBACK; msgs.push(t("comeback", { x: COMEBACK })); }
    if (S.streak > 0 && S.streak % 3 === 0) { xp += 5; msgs.push(t("streakMsg", { n: S.streak })); }
    earn(xp); S.done[item.id] = (S.done[item.id] || 0) + 1; S.lastWrong = false;
    msgs.unshift(t("taskOk", { x: xp }));
    if (!was.m && mastered(item.skill)) msgs.push(t("masteredNow", { s: lsT(item.skill).name }));
    LESSONS.filter(l => unlocked(l.id) && !unlockedBefore.includes(l.id)).forEach(l => msgs.push(t("unlockedNow", { s: lsT(l.id).name })));
    if (roleIdx() > was.r) msgs.push(t("promo", { r: roleName() }));
  } else {
    S.streak = 0; S.lastWrong = true;
    const pen = m.pen * item.d;
    if (S.inv.shield > 0) { S.inv.shield--; msgs.push(t("shieldUsed")); } else { S.xp = Math.max(0, S.xp - pen); msgs.push(t("lost", { x: pen })); }
    msgs.unshift(t("taskFail"));
  }
  save();
}

/* ---------- Render ---------- */
const $ = document.getElementById("app");
const el = (tag, attrs = {}, ...kids) => H(tag, attrs, ...kids);
function go(v, id) { view = v; if (id) { cur = id; tab = "story"; } if (v !== "lesson" && sim) { sim.destroy(); sim = null; } hintOn = {}; lensOn = null; msgs = []; render(); window.scrollTo(0, 0); }
function render() {
  document.documentElement.setAttribute("data-theme", S.theme === "auto" ? "" : S.theme); document.documentElement.lang = S.lang === "pt" ? "pt-BR" : "en";
  $.innerHTML = ""; $.append(topbar());
  const body = { home, map, lesson, shop, report, settings }[view] || home; $.append(body());
}
function topbar() {
  const title = S.title ? " · " + gt().shop[S.title][0] : "";
  return el("header", { class: "top" }, el("button", { class: "brand", onclick: () => go("home") }, "IAWise"),
    el("div", { class: "stats" }, el("span", {}, t("role") + ": ", el("b", {}, roleName() + title)), el("span", {}, t("balance") + ": ", el("b", {}, S.xp + " XP")), el("span", {}, t("total") + ": ", el("b", {}, S.xpTotal)), el("span", {}, t("streak") + ": ", el("b", {}, S.streak))),
    el("nav", { class: "nav" }, ...[["home", "navHome"], ["map", "navMap"], ["shop", "navShop"], ["report", "navReport"], ["settings", "navSettings"]].map(([v, k]) => el("button", { onclick: () => go(v), ...(view === v || (v === "map" && view === "lesson") ? { "aria-current": "page" } : {}) }, t(k)))));
}

/* --- início --- */
function home() {
  const builtN = LESSONS.filter(l => l.sim).length, tasksN = ITEMS.length, mst = LESSONS.filter(l => mastered(l.id)).length;
  return el("section", { class: "home" },
    el("div", {}, el("h1", {}, t("homeH")), el("p", { class: "lead" }, t("homeLead")),
      el("div", { class: "qs" }, ...WORLDS.map(w => el("div", { class: "q " + w.id }, el("span", {}, w.icon), el("div", {}, el("b", {}, wT(w.id).name), el("br"), wT(w.id).question)))),
      el("div", { class: "row" }, el("button", { class: "btn", onclick: () => { S.started = true; save(); go("map"); } }, S.started ? t("cont") : t("start"))),
      el("div", { class: "kpis" }, kpi(builtN + "/" + LESSONS.length, t("kPhases")), kpi(tasksN, t("kTasks")), kpi(mst, t("kMastered")))),
    el("div", {}, el("ol", { class: "loop" }, ...t("steps").map(([a, b]) => el("li", {}, el("div", {}, el("strong", {}, a), b)))), el("p", { class: "empty" }, t("homeSrc") + " " + t("homeI18n"))));
}
const kpi = (v, l) => el("div", { class: "kpi" }, el("b", {}, v), el("span", {}, l));

/* --- mapa --- */
function status(id) { if (!unlocked(id)) return ["stL", "locked"]; if (mastered(id) && confirmed(id)) return ["stM", "ok"]; if (awaitsConfirm(id)) return ["stC", "warn"]; if (trk(id).n > 0) return ["stP", "prog"]; return ["stB", ""]; }
function map() {
  const wrap = el("section", {});
  for (const w of WORLDS) {
    const panel = el("div", { class: "panel world " + w.id }, el("div", { class: "whead" }, el("span", { class: "wicon" }, w.icon), el("div", {}, el("h2", {}, wT(w.id).name), el("p", { class: "empty" }, wT(w.id).question))));
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 640 360"); svg.setAttribute("class", "mapsvg");
    const ls = LESSONS.filter(l => l.world === w.id);
    for (const l of ls) for (const p of l.pre) { const a = LS[p], ln = document.createElementNS(svg.namespaceURI, "line"); ln.setAttribute("x1", a.x); ln.setAttribute("y1", a.y); ln.setAttribute("x2", l.x); ln.setAttribute("y2", l.y); ln.setAttribute("class", "edge" + (trk(p).L >= UNLOCK ? " on" : "")); svg.append(ln); }
    for (const l of ls) { const g = document.createElementNS(svg.namespaceURI, "g"); const [st, cls] = status(l.id); g.setAttribute("class", "node " + cls + (built(l.id) ? "" : " soon") + (sel === l.id ? " sel" : "")); g.setAttribute("tabindex", "0"); g.setAttribute("role", "button");
      const c = document.createElementNS(svg.namespaceURI, "circle"); c.setAttribute("cx", l.x); c.setAttribute("cy", l.y); c.setAttribute("r", 26); g.append(c);
      const tx = document.createElementNS(svg.namespaceURI, "text"); tx.setAttribute("x", l.x); tx.setAttribute("y", l.y + 5); tx.setAttribute("text-anchor", "middle"); tx.setAttribute("class", "pct"); tx.textContent = unlocked(l.id) ? pct(trk(l.id).L) : "🔒"; g.append(tx);
      wrapText(l.n + ". " + lsT(l.id).name, 17).forEach((ln, i) => { const lb = document.createElementNS(svg.namespaceURI, "text"); lb.setAttribute("x", l.x); lb.setAttribute("y", l.y + 44 + i * 13); lb.setAttribute("text-anchor", "middle"); lb.setAttribute("class", "lbl"); lb.textContent = ln; g.append(lb); });
      const open = () => { sel = l.id; render(); }; g.addEventListener("click", open); g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }); svg.append(g); }
    if (window.innerWidth < 640) { /* em telas estreitas o grafo vira lista */
      panel.append(el("div", { class: "maplist" }, ...ls.map(l => { const [st, cls] = status(l.id); return el("button", { class: "mapitem " + cls + (built(l.id) ? "" : " soon") + (sel === l.id ? " sel" : ""), onclick: () => { sel = l.id; render(); } }, el("b", {}, unlocked(l.id) ? pct(trk(l.id).L) : "🔒"), el("span", {}, l.n + ". " + lsT(l.id).name), el("i", {}, t(st))); }))); }
    else panel.append(el("div", { class: "mapwrap" }, svg));
    if (sel && LS[sel].world === w.id) panel.append(lessonCard(sel));
    wrap.append(panel);
  }
  wrap.append(el("p", { class: "empty" }, t("mapHint")));
  return wrap;
}
function wrapText(s, n) { const out = []; let cur = ""; for (const w of s.split(" ")) { if ((cur + " " + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim(); } if (cur) out.push(cur); if (out.length > 2) { out.length = 2; out[1] = out[1].slice(0, n - 1) + "…"; } return out; }
function lessonCard(id) {
  const l = LS[id], L = lsT(id), [st] = status(id), tr = trk(id), tasks = l.sim ? TASKS[l.sim] : [], done = tasks.filter(x => S.done[x.id]).length;
  const card = el("div", { class: "skillinfo" }, el("h4", {}, t("lesson") + " " + l.n + " · " + L.name), el("p", {}, L.about), el("div", { class: "meta" }, el("span", { class: "tag " + l.world }, t(st)), el("span", { class: "tag plain" }, t("colMastery") + " " + pct(tr.L)), S.keyed[id] ? el("span", { class: "tag plain" }, "🗝️ " + t("keyedTag")) : null, l.sim ? el("span", { class: "tag plain" }, done + "/" + tasks.length + " " + t("tasksH").toLowerCase()) : el("span", { class: "tag plain" }, t("soon"))));
  if (!unlocked(id)) { const pre = l.pre.filter(p => trk(p).L < UNLOCK).map(p => lsT(p).name).join(t("and")); card.append(el("p", { class: "empty" }, pre && !gateOk(id) ? t("lockedXp", { p: pre, x: l.gate, y: S.xpTotal }) : pre ? t("locked", { p: pre }) : t("lockedXpOnly", { x: l.gate, y: S.xpTotal })), el("div", { class: "row" }, built(id) && S.inv.key > 0 ? el("button", { class: "btn small", onclick: () => { S.inv.key--; S.keyed[id] = true; S.opened[id] = true; save(); msgs = []; go("lesson", id); } }, "🗝️ " + t("useKey", { n: S.inv.key })) : null,
      el("button", { class: "btn ghost small", onclick: () => { view = "lesson"; cur = id; tab = "mat"; render(); window.scrollTo(0, 0); } }, t("tabMat"))), built(id) && !S.inv.key ? el("p", { class: "empty" }, t("keyHint")) : null); }
  else if (!built(id)) card.append(el("p", { class: "empty" }, t("soonP")), el("button", { class: "btn ghost", onclick: () => { S.opened[id] = true; save(); go("lesson", id); tab = "mat"; render(); } }, t("tabMat")));
  else card.append(el("button", { class: "btn", onclick: () => { S.opened[id] = true; save(); go("lesson", id); } }, t("open")));
  return card;
}

/* --- fase --- */
function lesson() {
  const l = LS[cur], L = lsT(cur), w = l.world;
  const head = el("div", { class: "lhead " + w }, el("button", { class: "btn ghost small", onclick: () => go("map") }, "← " + t("back")), el("span", { class: "tag " + w }, WORLDS.find(x => x.id === w).icon + " " + wT(w).name + " · " + t("lesson") + " " + l.n), el("h2", {}, L.name), el("p", { class: "empty" }, L.about));
  const tabList = built(cur) && unlocked(cur) ? [["story", "tabStory"], ["theory", "tabTheory"], ["sim", "tabSim"], ["mat", "tabMat"]] : [["mat", "tabMat"]];
  if (!built(cur) || !unlocked(cur)) tab = "mat";
  const tabs = el("div", { class: "tabs", role: "tablist" }, ...tabList.map(([k, lab]) => el("button", { role: "tab", "aria-selected": tab === k, onclick: () => { tab = k; if (k !== "sim" && sim) { sim.destroy(); sim = null; } render(); } }, t(lab))));
  const body = el("div", { class: "work" });
  if (tab === "mat") body.append(material(l));
  else if (tab === "story") body.append(el("div", { class: "panel" }, el("p", { class: "client" }, t("client") + ": " + L.client), el("h3", {}, L.title), el("p", { class: "story" }, L.story), el("button", { class: "btn", onclick: () => { tab = "theory"; render(); } }, t("tabTheory") + " →")));
  else if (tab === "theory") body.append(el("div", { class: "panel" }, ...L.theory.map(([h, p]) => el("div", { class: "concept" }, el("h3", {}, h), el("p", {}, p))), el("button", { class: "btn", onclick: () => { tab = "sim"; render(); } }, t("goSim"))));
  else body.append(simView(l));
  return el("section", {}, head, tabs, body);
}
function simView(l) {
  const box = el("div", { class: "simbox" }), simEl = el("div", { class: "simarea" }), taskEl = el("div", { class: "tasks" });
  box.append(simEl, taskEl);
  const api = { s: k => simT(l.sim, k), refreshTasks: () => paintTasks(l, taskEl) };
  if (!sim || sim.id !== l.sim) { if (sim) sim.destroy(); sim = SIMS[l.sim].mount(simEl, api); sim.id = l.sim; sim.el = simEl; } else simEl.replaceWith(sim.el);
  paintTasks(l, taskEl);
  box.append(tutorPanel(l));
  return box;
}
/* --- tutor com LLM --- */
let chat = {};   // histórico por fase, só nesta sessão
function tutorPanel(l) {
  const L = lsT(l.id), panel = el("div", { class: "tutor" }, el("h3", {}, "🤖 " + t("tutorH")));
  if (!LLM.ready()) { panel.append(el("p", { class: "empty" }, t("tutorOff")), el("button", { class: "btn small ghost", onclick: () => go("settings") }, t("navSettings"))); return panel; }
  const hist = chat[l.id] = chat[l.id] || [], log = el("div", { class: "chatlog" }), ta = el("textarea", { rows: 2, placeholder: t("tutorPh") }), busy = el("span", { class: "empty" });
  const paint = () => { log.innerHTML = ""; hist.forEach((m, i) => log.append(el("div", { class: "msg " + m.role }, m.content, m.role === "error" && i === hist.length - 1 ? el("div", { class: "row", style: "margin-top:6px" }, btn(t("tutorRetry"), () => { const q = hist[i - 1]; hist.splice(i - 1, 2); ask(q.content, q.hint); }, "btn small")) : null))); log.scrollTop = log.scrollHeight; };
  async function ask(text, isHint) {
    if (!text.trim() || busy.textContent) return; ta.value = ""; hist.push({ role: "user", content: text, hint: isHint }); paint(); busy.textContent = t("tutorThinking");
    if (isHint) TASKS[l.sim].forEach(tk => { if (!S.done[tk.id]) hintOn[tk.id] = true; });
    const state = sim && sim.state ? sim.state() : {};
    const tasks = TASKS[l.sim].map(tk => "- [" + (S.done[tk.id] ? "x" : " ") + "] " + L.tasks[tk.id].t).join("\n");
    const system = t("tutorSys", { lang: Lg().name, lesson: L.name, world: wT(l.world).name }) + "\n\n" + t("tutorTheory") + "\n" + L.theory.map(([h, p]) => h + ": " + p).join("\n") + "\n\n" + t("tutorTasks") + "\n" + tasks + "\n\n" + t("tutorState") + "\n" + JSON.stringify(state) + "\n\n" + t("tutorRules");
    /* só pares pergunta/resposta válidos vão para o modelo: erros e perguntas sem resposta ficam fora do histórico */
    const clean = []; hist.forEach((m, i) => { if (m.role === "assistant" || (m.role === "user" && (i === hist.length - 1 || (hist[i + 1] && hist[i + 1].role === "assistant")))) clean.push({ role: m.role, content: m.content }); });
    const onStatus = s => { busy.textContent = s.wait ? t("tutorBusy", { n: s.attempt }) : t("tutorFallback", { m: s.model }); };
    try { const out = await LLM.chat(system, clean.slice(-8), onStatus); hist.push({ role: "assistant", content: out }); }
    catch (e) { hist.push({ role: "error", content: (e.retry ? t("tutorOverload") : t("tutorErr")) + " (" + (e.message || e) + ")" }); }
    busy.textContent = ""; paint(); if (isHint) { const te = $.querySelector(".tasks"); if (te) paintTasks(l, te); }
  }
  panel.append(el("div", { class: "row" }, btn(t("tutorQ1"), () => ask(t("tutorQ1"), false), "btn small ghost"), btn(t("tutorQ2"), () => ask(t("tutorQ2"), false), "btn small ghost"), btn(t("tutorQ3"), () => ask(t("tutorQ3"), true), "btn small ghost")),
    log, el("div", { class: "row" }, ta, btn(t("tutorSend"), () => ask(ta.value, false)), busy), el("p", { class: "empty" }, t("tutorNote")));
  ta.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(ta.value, false); } });
  paint(); return panel;
}
function paintTasks(l, taskEl) {
  const L = lsT(l.id), tasks = TASKS[l.sim], m = MODES[S.mode];
  taskEl.innerHTML = ""; taskEl.append(el("h3", {}, t("tasksH")));
  if (msgs.length) { const ok = S.log.length && S.log[S.log.length - 1].ok; taskEl.append(el("div", { class: "feedback " + (ok ? "ok" : "bad") }, el("b", {}, (ok ? t("cheers") : t("oops"))[Math.floor(Math.random() * 4)]), el("br"), msgs.join(" "))); }
  for (const tk of tasks) {
    const done = !!S.done[tk.id], tx = L.tasks[tk.id];
    const row = el("div", { class: "task" + (done ? " done" : "") }, el("div", { class: "tmeta" }, el("span", { class: "pts" }, "★".repeat(tk.d)), done ? el("span", { class: "chip" }, "✓ " + t("verified")) : null), el("p", {}, tx.t));
    if (!done) {
      const acts = el("div", { class: "row" }, el("button", { class: "btn small", onclick: () => { const ok = !!(sim && sim.check(tk.id)); answer(IT[tk.id], ok, !!hintOn[tk.id]); paintTasks(l, taskEl); const tb = $.querySelector(".top"); if (tb) tb.replaceWith(topbar()); if (ok) confetti(); } }, t("verify")));
      if (m.hint) { if (hintOn[tk.id]) row.append(el("p", { class: "hint" }, "💡 " + tx.h)); else acts.append(el("button", { class: "btn small ghost", onclick: () => { hintOn[tk.id] = true; paintTasks(l, taskEl); } }, t("hint"))); }
      else acts.append(el("span", { class: "empty" }, t("noHints")));
      if (S.inv.lens > 0 && !hintOn[tk.id] && lensOn !== tk.id) acts.append(el("button", { class: "btn small ghost", onclick: () => { S.inv.lens--; hintOn[tk.id] = true; lensOn = tk.id; save(); paintTasks(l, taskEl); } }, "🔍 " + gt().shop.lens[0] + " (" + S.inv.lens + ")"));
      row.append(acts);
    }
    taskEl.append(row);
  }
  if (tasks.every(tk => S.done[tk.id])) { const nx = nextOf(l.id); taskEl.append(el("div", { class: "feedback ok" }, t("allDone"), el("div", { class: "row", style: "margin-top:8px" },
    nx && unlocked(nx.id) && built(nx.id) ? el("button", { class: "btn small", onclick: () => { S.opened[nx.id] = true; save(); go("lesson", nx.id); } }, t("next") + ": " + nx.n + ". " + lsT(nx.id).name + " →") : null,
    nx && !built(nx.id) ? el("span", { class: "empty" }, t("nextSoon", { s: nx.n + ". " + lsT(nx.id).name })) : null,
    el("button", { class: "btn small ghost", onclick: () => go("map") }, t("back"))))); }
  if (S.boost > 0) taskEl.append(el("p", { class: "empty" }, t("boostOn", { n: S.boost })));
}
function confetti() { const c = el("div", { class: "confetti" }); for (let i = 0; i < 24; i++) { const p = el("i", { style: "left:" + Math.random() * 100 + "%;animation-delay:" + Math.random() * .4 + "s;background:" + ["#F0B73F", "#4CC98F", "#45BDB6", "#A296F5"][i % 4] }); c.append(p); } document.body.append(c); setTimeout(() => c.remove(), 1800); }

/* --- material de apoio --- */
function material(l) {
  const m = MAT[l.id] || {}, w = l.world, gh = GH[w], gp = GP[w], n2 = String(l.n).padStart(2, "0"), box = el("div", { class: "panel" });
  if (!built(l.id)) box.append(el("p", { class: "feedback bad" }, el("b", {}, t("soon")), " · ", t("soonP")));
  const link = (label, url, kind) => el("a", { class: "mlink", href: url, target: "_blank", rel: "noopener" }, el("span", { class: "tag plain" }, kind), " ", label);
  const grp = (h, items) => items.length ? el("div", { class: "mgroup" }, el("h3", {}, h), ...items) : null;
  box.append(grp(t("matSlides"), [link("aula" + n2 + ".pdf", gh + "aula" + n2 + "/aula" + n2 + ".pdf", "PDF")]));
  if (w === "rl") box.append(grp(t("matHandout"), [link("handout-aula" + n2 + ".pdf", gh + "aula" + n2 + "/handout-aula" + n2 + ".pdf", "PDF")]));
  if (m.sim) box.append(grp(t("matSim"), m.sim.map(([lab, path]) => link(lab, gp + path, t("kinds").play))));
  if (m.extras) box.append(grp(t("matExtras"), m.extras.map(([lab, path]) => link(lab, gh + path, "PDF"))));
  if (m.links) box.append(grp(t("matLinks"), m.links.map(x => link(x.title, x.url, t("kinds")[x.kind]))));
  box.append(grp(t("matCommon"), COMMON[w].map(x => link(x.title, x.url, t("kinds")[x.kind]))), el("p", { class: "empty" }, t("matSrc")));
  return box;
}

/* --- loja --- */
function shop() {
  const sec = el("section", { class: "work" }, el("h2", {}, t("shopH")), el("p", {}, t("shopP")));

  const powers = el("div", { class: "panel" }, el("h3", {}, t("powers")), ...SHOP.filter(x => x.kind === "power").map(item));
  const titles = el("div", { class: "panel" }, el("h3", {}, t("titlesH")), ...SHOP.filter(x => x.kind === "title").map(item));
  sec.append(powers, titles); return sec;
  function item(x) { const [n, d] = gt().shop[x.id], own = x.kind === "title" ? S.titles.includes(x.id) : S.inv[x.id] || 0;
    const row = el("div", { class: "shopitem" }, el("span", { class: "sicon" }, x.icon), el("div", {}, el("b", {}, n), el("p", {}, d), x.kind === "power" ? el("span", { class: "empty" }, t("owned", { n: own })) : null));
    if (x.kind === "title" && own) row.append(S.title === x.id ? el("button", { class: "btn small ghost", onclick: () => { S.title = null; save(); render(); } }, t("unequip")) : el("button", { class: "btn small", onclick: () => { S.title = x.id; save(); render(); } }, t("equip")));
    else { const b = el("button", { class: "btn small", onclick: () => { if (S.xp < x.cost) return; S.xp -= x.cost; if (x.kind === "title") { S.titles.push(x.id); S.title = x.id; } else if (x.id === "boost") S.boost += 3; else S.inv[x.id]++; save(); render(); } }, S.xp < x.cost ? t("need", { n: x.cost - S.xp, c: x.cost }) : t("buy", { c: x.cost })); if (S.xp < x.cost) b.disabled = true; row.append(b); }
    return row; }
}

/* --- relatório --- */
function report() {
  const n = S.log.length, hits = S.log.filter(x => x.ok).length, mst = LESSONS.filter(l => mastered(l.id) && confirmed(l.id)).length;
  const doneN = ITEMS.filter(i => S.done[i.id]).length, errN = S.log.filter(x => !x.ok).length;
  const sec = el("section", { class: "work rep" }, el("h2", {}, t("repH")), el("p", { class: "empty" }, t("repSub")), S.name ? el("p", {}, el("b", {}, t("repFor", { n: S.name }))) : null,
    el("div", { class: "kpis" }, kpi(doneN + "/" + ITEMS.length, t("k5")), kpi(n, t("k1")), kpi(n ? pct(hits / n) : "–", t("k2")), kpi(errN, t("k6")), kpi(mst, t("k3")), kpi(S.best, t("k4"))));
  const byW = el("div", { class: "panel" }, el("h3", {}, t("bySkill")), el("p", { class: "empty" }, t("repLegend")));
  const pending = el("div", { class: "panel" }, el("h3", {}, t("pendH")));
  for (const w of WORLDS) { const all = LESSONS.filter(l => l.world === w.id), ls = all.filter(l => built(l.id)), mstW = ls.filter(l => mastered(l.id) && confirmed(l.id)).length, avg = ls.reduce((a, l) => a + trk(l.id).L, 0) / (ls.length || 1);
    const rows = all.map(l => {
      const tr = trk(l.id), [st] = status(l.id), tasks = l.sim ? TASKS[l.sim] : [], done = tasks.filter(x => S.done[x.id]).length;
      const fails = tasks.reduce((a, x) => a + (S.failed[x.id] || 0), 0), cErr = tr.n - tr.c, extra = Math.max(0, fails - cErr);
      if (!built(l.id)) return el("tr", { class: "soonrow" }, el("td", {}, l.n + ". " + lsT(l.id).name), el("td", {}, "–"), el("td", {}, "–"), el("td", {}, "–"), el("td", {}, "–"), el("td", {}, "–"), el("td", {}, t("soon")));
      return el("tr", {}, el("td", {}, l.n + ". " + lsT(l.id).name), el("td", {}, el("span", { class: "bar" }, el("i", { style: "width:" + pct(tr.L) })), " " + pct(tr.L)),
        el("td", {}, done + "/" + tasks.length), el("td", {}, tr.c), el("td", { class: cErr ? "errc" : "" }, cErr), el("td", {}, extra), el("td", {}, t(st)));
    });
    byW.append(el("div", { class: "whead small " + w.id }, el("span", { class: "wicon" }, w.icon), el("div", {}, el("h4", {}, wT(w.id).name + " · " + wT(w.id).course), el("span", { class: "empty" }, t("worldAvg", { p: pct(avg), m: mstW, n: ls.length }) + " · " + t("worldBuilt", { b: ls.length, n: all.length })))),
      el("div", { class: "tblwrap" }, el("table", { class: "tbl" }, el("thead", {}, el("tr", {}, ...["colSkill", "colMastery", "colTasks", "colHits", "colErr", "colExtra", "colStatus"].map(k => el("th", {}, t(k))))), el("tbody", {}, ...rows))));
    /* o que falta fazer: tarefas pendentes das fases liberadas; fases bloqueadas aparecem resumidas */
    const open = ls.filter(l => unlocked(l.id) && TASKS[l.sim].some(x => !S.done[x.id])), locked = ls.filter(l => !unlocked(l.id));
    if (open.length || locked.length) { pending.append(el("h4", { class: "pendw" }, w.icon + " " + wT(w.id).course));
      open.forEach(l => { const L = lsT(l.id); pending.append(el("p", { class: "pendl" }, el("b", {}, l.n + ". " + L.name)), el("ul", { class: "pend" }, ...TASKS[l.sim].filter(x => !S.done[x.id]).map(x => el("li", {}, "★".repeat(x.d) + " " + L.tasks[x.id].t + (S.failed[x.id] ? " — " + t("pendFails", { n: S.failed[x.id] }) : ""))))); });
      if (locked.length) pending.append(el("p", { class: "empty" }, t("pendLocked", { s: locked.map(l => l.n + ". " + lsT(l.id).name).join(", ") }))); } }
  if (!pending.querySelector("h4")) pending.append(el("p", { class: "feedback ok" }, t("pendNone")));
  sec.append(byW, pending);
  const recs = el("div", { class: "panel" }, el("h3", {}, t("recs")));
  if (!n) recs.append(el("p", { class: "empty" }, t("recNone")));
  else { const cand = LESSONS.filter(l => built(l.id) && unlocked(l.id) && !mastered(l.id)).sort((a, b) => trk(a.id).L - trk(b.id).L)[0]; if (cand) recs.append(el("p", {}, t("recPriority", { s: lsT(cand.id).name, p: pct(trk(cand.id).L), c: trk(cand.id).c, n: trk(cand.id).n })));
    const lk = LESSONS.filter(l => built(l.id) && !unlocked(l.id)).map(l => lsT(l.id).name); if (lk.length) recs.append(el("p", { class: "empty" }, t("recLocked", { s: lk.join(", ") }))); }
  sec.append(recs);
  const cmp = el("div", { class: "panel noprint" }, el("h3", {}, t("cmpH")), el("p", { class: "empty" }, t("cmpP") + " " + t("cmpNote")), el("div", { class: "tblwrap" }, el("table", { class: "tbl" }, el("thead", {}, el("tr", {}, el("th", {}, t("colModel")), el("th", {}, "Brier"), el("th", {}, "AUC"), el("th", {}, t("colAcc")))), el("tbody", {}, ...[...KT.IDS, "elo_fixed"].map(k => { const sc = KT.score(S.log, k); return el("tr", {}, el("td", {}, t("models")[k] + (k === pilot() ? " ★" : "")), el("td", {}, sc ? sc.brier.toFixed(3) : t("noData")), el("td", {}, sc && sc.auc != null ? sc.auc.toFixed(3) : "–"), el("td", {}, sc ? pct(sc.acc) : "–")); })))));
  sec.append(cmp, el("div", { class: "panel noprint" }, el("h3", {}, t("how")), el("p", {}, t("howP", { m: pct(master()) }) + " " + t(PRIOR.mode === "hier" ? "howPrior" : "howPriorFix", { b: pct(PRIOR.base), w: pct(PRIOR.w) }))));
  const data = el("div", { class: "panel noprint" }, el("h3", {}, t("dataH")), el("p", { class: "empty" }, t("dataP")), el("div", { class: "row" }, el("button", { class: "btn small", onclick: () => window.print() }, "🖨 " + t("printBtn")), el("button", { class: "btn small ghost", onclick: () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(S.log, null, 1)], { type: "application/json" })); a.download = "iawise-log.json"; a.click(); } }, t("download")), el("button", { class: "btn small ghost", onclick: () => { showJson = !showJson; render(); } }, showJson ? t("hideJson") : t("showJson"))), showJson ? el("pre", { class: "json" }, JSON.stringify(S.log.slice(-40), null, 1)) : null);
  sec.append(data, el("p", { class: "empty printonly" }, t("printedOn", { d: new Date().toLocaleDateString() })));
  return sec;
}

/* --- ajustes --- */
function settings() {
  const sec = el("section", { class: "work" }, el("h2", {}, t("setH")));
  const p = el("div", { class: "panel" },
    el("label", { class: "ctl" }, el("span", {}, t("uiLang")), el("select", { onchange: e => { S.lang = e.target.value; save(); render(); } }, ...Object.keys(LANG).map(k => el("option", { value: k, ...(S.lang === k ? { selected: "" } : {}) }, LANG[k].name)))),
    el("label", { class: "ctl" }, el("span", {}, t("theme")), el("select", { onchange: e => { S.theme = e.target.value; save(); render(); } }, ...[["auto", "themeAuto"], ["light", "themeLight"], ["dark", "themeDark"]].map(([v, k]) => el("option", { value: v, ...(S.theme === v ? { selected: "" } : {}) }, t(k))))),
    el("label", { class: "ctl" }, el("span", {}, t("studentName")), el("input", { type: "text", value: S.name, oninput: e => { S.name = e.target.value; save(); } })),
    el("label", { class: "ctl chk" }, el("input", { type: "checkbox", ...(S.confirm ? { checked: "" } : {}), onchange: e => { S.confirm = e.target.checked; save(); render(); } }), el("span", {}, t("confirmRule"))),
    el("div", { class: "row" }, el("button", { class: "btn small ghost danger", onclick: () => { if (!resetArmed) { resetArmed = true; render(); return; } localStorage.removeItem(KEY); S = fresh(); resetArmed = false; go("home"); } }, resetArmed ? t("resetConfirm") : t("reset"))));
  const modes = el("div", { class: "panel" }, el("h3", {}, t("modeH")), el("div", { class: "modes" }, ...Object.keys(MODES).map(k => el("button", { class: "mode" + (S.mode === k ? " on" : ""), onclick: () => { S.mode = k; save(); render(); } }, el("b", {}, MODE_ICON[k] + " " + t("modes")[k]), el("span", {}, t("modeDesc")[k])))));
  sec.append(p, modes, llmSettings()); return sec;
}
function llmSettings() {
  const c = LLM.cfg(), status = el("span", { class: "empty" });
  const box = el("div", { class: "panel" }, el("h3", {}, "🤖 " + t("llmH")), el("p", { class: "empty" }, t("llmP")));
  const fld = (label, key, type = "text", ph = "") => el("label", { class: "ctl" }, el("span", {}, label), el("input", { type, value: c[key] || "", placeholder: ph, oninput: e => { c[key] = e.target.value.trim(); LLM.save(c); } }));
  const modelF = fld(t("llmModel"), "model", "text", PROVIDERS[c.provider].model), urlF = fld(t("llmUrl"), "url", "text", "https://.../v1/chat/completions");
  urlF.style.display = c.provider === "custom" ? "" : "none";
  box.append(el("label", { class: "ctl" }, el("span", {}, t("llmProvider")), el("select", { onchange: e => { c.provider = e.target.value; LLM.save(c); modelF.querySelector("input").placeholder = PROVIDERS[c.provider].model; urlF.style.display = c.provider === "custom" ? "" : "none"; } }, ...Object.keys(PROVIDERS).map(k => el("option", { value: k, ...(c.provider === k ? { selected: "" } : {}) }, PROVIDERS[k].name)))),
    fld(t("llmKey"), "key", "password", "sk-…"), modelF, urlF,
    el("div", { class: "row" }, el("button", { class: "btn small", onclick: async () => { status.textContent = "…"; try { const out = await LLM.chat("Reply with one short sentence.", [{ role: "user", content: "Say hello." }]); status.textContent = "✓ " + out.slice(0, 80); } catch (e) { status.textContent = "✗ " + (e.message || e); } } }, t("llmTest")),
      el("button", { class: "btn small ghost danger", onclick: () => { localStorage.removeItem(LLM_KEY); render(); } }, t("llmForget")), status),
    el("p", { class: "empty" }, t("llmNote")));
  return box;
}

/* ---------- boot ---------- */
S = load(); render();
