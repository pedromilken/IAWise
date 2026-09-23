/* IAWise - simuladores interativos.
   Cada simulador exporta mount(el, api) e devolve {check(taskId) -> boolean, destroy()}.
   api.s(key) devolve o texto do simulador no idioma atual; api.refreshTasks() repinta a lista de tarefas. */
const SIMS = {};

/* ---------- utilidades de interface ---------- */
const H = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const k in attrs) { if (k === "class") e.className = attrs[k]; else if (k === "style") e.style.cssText = attrs[k]; else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); } for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(String(c))); return e; };
function slider(label, min, max, step, val, on, fmt = v => v) {
  const out = H("output", {}, fmt(val));
  const inp = H("input", { type: "range", min, max, step, value: val, oninput: e => { const v = +e.target.value; out.textContent = fmt(v); on(v); } });
  const wrap = H("label", { class: "ctl" }, H("span", {}, label), inp, out);
  wrap.set = v => { inp.value = v; out.textContent = fmt(v); };
  return wrap;
}
function select(label, opts, val, on) {
  const sel = H("select", { onchange: e => on(e.target.value) }, ...opts.map(([v, l]) => H("option", { value: v, ...(v === val ? { selected: "" } : {}) }, l)));
  return H("label", { class: "ctl" }, H("span", {}, label), sel);
}
const btn = (label, on, cls = "btn small") => H("button", { class: cls, onclick: on }, label);
function canvas(el, w, h) {
  const c = H("canvas", { class: "simcv" }); el.append(c);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = w * dpr; c.height = h * dpr; c.style.width = "100%"; c.style.maxWidth = w + "px"; c.style.aspectRatio = w + "/" + h;
  const g = c.getContext("2d"); g.scale(dpr, dpr); c.g = g; c.w = w; c.h = h; return c;
}
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const COL = () => ({ ink: css("--ink"), muted: css("--muted"), line: css("--line"), a: css("--nn"), b: css("--rl"), ok: css("--ok"), bad: css("--bad"), gold: css("--gold"), surface: css("--surface"), sunken: css("--sunken") });
const fmt2 = v => (Math.round(v * 100) / 100).toFixed(2);
const fmt3 = v => (Math.round(v * 1000) / 1000).toFixed(3);
const rnd = (a, b) => a + Math.random() * (b - a);
function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* =====================================================================
   1. PERCEPTRON - fronteira linear, regra de aprendizado, XOR
   ===================================================================== */
SIMS.perceptron = { mount(el, api) {
  const s = api.s;
  const DS = {
    and: [[-1, -1, 0], [-1, 1, 0], [1, -1, 0], [1, 1, 1]],
    or: [[-1, -1, 0], [-1, 1, 1], [1, -1, 1], [1, 1, 1]],
    xor: [[-1, -1, 0], [-1, 1, 1], [1, -1, 1], [1, 1, 0]]
  };
  const st = { ds: "and", pts: DS.and, w1: 0.6, w2: 0.6, b: -0.2, lr: 0.3, steps: 0, manual: false, best: 0 };
  function randomSet() { const r = seeded(Date.now() & 0xffff), a = r() * Math.PI, nx = Math.cos(a), ny = Math.sin(a), c = rnd(-.3, .3), p = []; while (p.length < 14) { const x = rnd(-1, 1), y = rnd(-1, 1), m = nx * x + ny * y + c; if (Math.abs(m) > .2) p.push([x, y, m > 0 ? 1 : 0]); } return p; }
  const pred = p => (st.w1 * p[0] + st.w2 * p[1] + st.b >= 0 ? 1 : 0);
  const acc = () => st.pts.filter(p => pred(p) === p[2]).length / st.pts.length;
  function step() { const wrong = st.pts.filter(p => pred(p) !== p[2]); if (!wrong.length) return; const p = wrong[Math.floor(Math.random() * wrong.length)], e = p[2] - pred(p); st.w1 += st.lr * e * p[0]; st.w2 += st.lr * e * p[1]; st.b += st.lr * e; st.steps++; st.best = Math.max(st.best, acc()); }
  const cv = canvas(el, 460, 360), g = cv.g;
  const ctl = H("div", { class: "ctls" }); el.append(ctl);
  const sW1 = slider("w₁", -3, 3, .05, st.w1, v => { st.w1 = v; st.manual = true; draw(); }, fmt2);
  const sW2 = slider("w₂", -3, 3, .05, st.w2, v => { st.w2 = v; st.manual = true; draw(); }, fmt2);
  const sB = slider("b", -3, 3, .05, st.b, v => { st.b = v; st.manual = true; draw(); }, fmt2);
  const sLr = slider(s("lr"), .05, 1, .05, st.lr, v => st.lr = v, fmt2);
  const info = H("div", { class: "siminfo" });
  ctl.append(select(s("dataset"), [["and", "AND"], ["or", "OR"], ["random", s("random")], ["xor", "XOR"]], "and", v => { st.ds = v; st.pts = v === "random" ? randomSet() : DS[v]; reset(); }),
    sW1, sW2, sB, sLr,
    H("div", { class: "row" }, btn(s("step1"), () => { step(); syncS(); draw(); }), btn(s("step20"), () => { for (let i = 0; i < 20; i++) step(); syncS(); draw(); }), btn(s("reset"), () => { reset(); }, "btn small ghost")), info);
  function syncS() { sW1.set(fmt2(st.w1)); sW2.set(fmt2(st.w2)); sB.set(fmt2(st.b)); }
  function reset() { st.w1 = rnd(-.5, .5); st.w2 = rnd(-.5, .5); st.b = rnd(-.5, .5); st.steps = 0; st.manual = false; st.best = acc(); syncS(); draw(); }
  function draw() {
    const C = COL(), W = cv.w, Hh = cv.h, m = 30, sx = (W - 2 * m) / 2.6, sy = (Hh - 2 * m) / 2.6, X = x => W / 2 + x * sx, Y = y => Hh / 2 - y * sy;
    g.clearRect(0, 0, W, Hh);
    // regiões
    const img = g.createImageData(W, Hh); const ca = hex(C.a), cb = hex(C.b);
    for (let py = 0; py < Hh; py += 1) for (let px = 0; px < W; px += 1) { const x = (px - W / 2) / sx, y = (Hh / 2 - py) / sy, v = st.w1 * x + st.w2 * y + st.b, c = v >= 0 ? ca : cb, i = (py * W + px) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 34; }
    g.putImageData(img, 0, 0);
    g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath(); g.moveTo(X(-1.3), Y(0)); g.lineTo(X(1.3), Y(0)); g.moveTo(X(0), Y(-1.3)); g.lineTo(X(0), Y(1.3)); g.stroke();
    // fronteira w1 x + w2 y + b = 0
    g.strokeStyle = C.ink; g.lineWidth = 2.5; g.beginPath();
    if (Math.abs(st.w2) > 1e-6) { g.moveTo(X(-1.3), Y((-st.b + 1.3 * st.w1) / st.w2)); g.lineTo(X(1.3), Y((-st.b - 1.3 * st.w1) / st.w2)); }
    else if (Math.abs(st.w1) > 1e-6) { g.moveTo(X(-st.b / st.w1), Y(-1.3)); g.lineTo(X(-st.b / st.w1), Y(1.3)); }
    g.stroke();
    // vetor de pesos
    g.strokeStyle = C.gold; g.lineWidth = 2; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(st.w1 / 3), Y(st.w2 / 3)); g.stroke();
    for (const p of st.pts) { const ok = pred(p) === p[2]; g.beginPath(); g.arc(X(p[0]), Y(p[1]), 9, 0, 7); g.fillStyle = p[2] ? C.a : C.b; g.fill(); g.lineWidth = 3; g.strokeStyle = ok ? C.surface : C.bad; g.stroke(); }
    const a = acc();
    info.innerHTML = ""; info.append(H("b", {}, s("acc") + ": " + Math.round(a * 100) + "%"), " · " + s("steps") + ": " + st.steps + " · " + s("best") + ": " + Math.round(st.best * 100) + "%");
    api.refreshTasks();
  }
  draw();
  return {
    check(id) { const a = acc();
      if (id === "p1") return st.ds === "and" && a === 1;
      if (id === "p2") return st.ds === "random" && a === 1 && st.steps >= 1 && st.steps <= 40 && !st.manual;
      if (id === "p3") return (st.ds === "and" || st.ds === "or") && a === 0;
      if (id === "p4") return st.ds === "xor" && st.steps >= 40 && st.best <= .75;
      return false; },
    state() { return { dataset: st.ds, w1: +fmt2(st.w1), w2: +fmt2(st.w2), b: +fmt2(st.b), lr: st.lr, accuracy: acc(), trainingSteps: st.steps, bestAccuracy: st.best, slidersTouchedSinceReset: st.manual }; },
    destroy() {}
  };
} };
function hex(h) { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map(c => c + c).join(""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }

/* =====================================================================
   2. REPRESENTATIVIDADE - o que uma rede consegue aproximar
   ===================================================================== */
SIMS.represent = { mount(el, api) {
  const s = api.s;
  const TG = { abs: x => Math.abs(x), sin: x => Math.sin(3 * x), step: x => (x > 0 ? 1 : 0), bump: x => Math.exp(-8 * x * x) };
  const N = 64, xs = Array.from({ length: N }, (_, i) => -1 + 2 * i / (N - 1));
  const st = { tg: "abs", act: "relu", Hn: 2, steps: 0, mse: 1, net: null, showUnits: false };
  const ACT = { relu: [z => Math.max(0, z), z => (z > 0 ? 1 : 0)], tanh: [Math.tanh, z => 1 - Math.tanh(z) ** 2] };
  function init() { const r = seeded(Date.now() & 0xfffff); const w1 = Array.from({ length: st.Hn }, (_, j) => (j % 2 ? -1 : 1) * (1 + 2 * r())); st.net = { w1, b1: w1.map(w => -w * (r() * 1.6 - .8)), w2: Array.from({ length: st.Hn }, () => (r() - .5)), b2: 0, m: null }; st.steps = 0; st.mse = loss(); }
  function fwd(x, n = st.net) { const f = ACT[st.act][0]; let y = n.b2; for (let j = 0; j < st.Hn; j++) y += n.w2[j] * f(n.w1[j] * x + n.b1[j]); return y; }
  function loss() { let e = 0; for (const x of xs) e += (fwd(x) - TG[st.tg](x)) ** 2; return e / N; }
  function train(K) { const n = st.net, [f, df] = ACT[st.act], lr = .02, b1 = .9, b2 = .999; if (!n.m) n.m = { w1: n.w1.map(() => 0), b1: n.b1.map(() => 0), w2: n.w2.map(() => 0), b2: 0, v1: n.w1.map(() => 0), vb1: n.b1.map(() => 0), v2: n.w2.map(() => 0), vb2: 0, t: 0 };
    for (let k = 0; k < K; k++) { const gw1 = n.w1.map(() => 0), gb1 = n.b1.map(() => 0), gw2 = n.w2.map(() => 0); let gb2 = 0;
      for (const x of xs) { const zs = n.w1.map((w, j) => w * x + n.b1[j]), hs = zs.map(f), y = n.b2 + hs.reduce((a, h, j) => a + n.w2[j] * h, 0), d = 2 * (y - TG[st.tg](x)) / N; gb2 += d; for (let j = 0; j < st.Hn; j++) { gw2[j] += d * hs[j]; const dh = d * n.w2[j] * df(zs[j]); gw1[j] += dh * x; gb1[j] += dh; } }
      const m = n.m; m.t++; const upd = (p, gr, mm, vv) => { for (let j = 0; j < p.length; j++) { mm[j] = b1 * mm[j] + (1 - b1) * gr[j]; vv[j] = b2 * vv[j] + (1 - b2) * gr[j] * gr[j]; p[j] -= lr * (mm[j] / (1 - b1 ** m.t)) / (Math.sqrt(vv[j] / (1 - b2 ** m.t)) + 1e-8); } };
      upd(n.w1, gw1, m.w1, m.v1); upd(n.b1, gb1, m.b1, m.vb1); upd(n.w2, gw2, m.w2, m.v2); m.b2 = b1 * m.b2 + (1 - b1) * gb2; m.vb2 = b2 * m.vb2 + (1 - b2) * gb2 * gb2; n.b2 -= lr * (m.b2 / (1 - b1 ** m.t)) / (Math.sqrt(m.vb2 / (1 - b2 ** m.t)) + 1e-8); st.steps++; }
    st.mse = loss(); }
  const cv = canvas(el, 460, 320), g = cv.g;
  const ctl = H("div", { class: "ctls" }); el.append(ctl);
  const info = H("div", { class: "siminfo" });
  ctl.append(select(s("target"), [["abs", "|x|"], ["sin", "sin(3x)"], ["step", s("stepfn")], ["bump", s("bump")]], "abs", v => { st.tg = v; init(); draw(); }),
    select(s("act"), [["relu", "ReLU"], ["tanh", "tanh"]], "relu", v => { st.act = v; init(); draw(); }),
    slider(s("hidden"), 1, 16, 1, st.Hn, v => { st.Hn = v; init(); draw(); }),
    H("div", { class: "row" }, btn(s("train300"), () => { train(300); draw(); }), btn(s("train1500"), () => { train(1500); draw(); }), btn(s("reinit"), () => { init(); draw(); }, "btn small ghost"), btn(s("units"), () => { st.showUnits = !st.showUnits; draw(); }, "btn small ghost")), info);
  function draw() {
    const C = COL(), W = cv.w, Hh = cv.h, m = 28, X = x => m + (x + 1) / 2 * (W - 2 * m), Y = y => Hh - m - (y + .6) / 2.2 * (Hh - 2 * m);
    g.clearRect(0, 0, W, Hh); g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath(); g.moveTo(X(-1), Y(0)); g.lineTo(X(1), Y(0)); g.moveTo(X(0), Y(-.6)); g.lineTo(X(0), Y(1.6)); g.stroke();
    const line = (fn, col, w, dash) => { g.strokeStyle = col; g.lineWidth = w; g.setLineDash(dash || []); g.beginPath(); xs.forEach((x, i) => { const y = Math.max(-.6, Math.min(1.6, fn(x))); i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }); g.stroke(); g.setLineDash([]); };
    if (st.showUnits) for (let j = 0; j < st.Hn; j++) line(x => st.net.w2[j] * ACT[st.act][0](st.net.w1[j] * x + st.net.b1[j]), C.gold, 1.2, [4, 4]);
    line(TG[st.tg], C.muted, 3, [6, 5]); line(x => fwd(x), C.a, 3);
    g.fillStyle = C.muted; g.font = "12px sans-serif"; g.fillText("x", X(1) - 8, Y(0) + 14); g.fillText(s("legend"), m, 16);
    info.innerHTML = ""; info.append(H("b", {}, "MSE: " + fmt3(st.mse)), " · " + s("steps") + ": " + st.steps + " · H = " + st.Hn);
    api.refreshTasks();
  }
  init(); draw();
  return { check(id) {
    if (id === "r1") return st.tg === "abs" && st.act === "relu" && st.Hn >= 2 && st.mse < .01;
    if (id === "r2") return st.tg === "bump" && st.act === "relu" && st.Hn === 1 && st.steps >= 300 && st.mse > .01;
    if (id === "r3") return st.tg === "sin" && st.mse < .02;
    if (id === "r4") return st.tg === "bump" && st.act === "relu" && st.mse < .006;
    return false; }, state() { return { target: st.tg, activation: st.act, hiddenUnits: st.Hn, trainingSteps: st.steps, mse: +fmt3(st.mse) }; }, destroy() {} };
} };

/* =====================================================================
   3. APRENDENDO A REDE (parte 1) - perda, gradiente e passo
   ===================================================================== */
SIMS.gradient = { mount(el, api) {
  const s = api.s;
  const raw = [-1.5, -1, -.5, .5, 1, 1.5], k = Math.sqrt(6 / 7), xs = raw.map(x => x * k), r = seeded(42), ys = xs.map(x => 2 * x + (r() - .5) * .6);
  const mx2 = xs.reduce((a, x) => a + x * x, 0) / 6, mxy = xs.reduce((a, x, i) => a + x * ys[i], 0) / 6, wStar = mxy / mx2, Lmin = (() => { const w = mxy / mx2; return xs.reduce((a, x, i) => a + (w * x - ys[i]) ** 2, 0) / 6; })();
  const L = w => xs.reduce((a, x, i) => a + (w * x - ys[i]) ** 2, 0) / 6, dL = w => xs.reduce((a, x, i) => a + 2 * (w * x - ys[i]) * x, 0) / 6;
  const st = { w: -2, lr: .1, steps: 0, manual: false, hist: [], up: 0 };
  const cv = canvas(el, 520, 300), g = cv.g;
  const ctl = H("div", { class: "ctls" }); el.append(ctl);
  const info = H("div", { class: "siminfo" });
  const sW = slider("w", -3, 5, .05, st.w, v => { st.w = v; st.manual = true; st.hist.push(L(v)); draw(); }, fmt2);
  const sLr = slider(s("lr"), .01, 1.2, .01, st.lr, v => st.lr = v, fmt2);
  ctl.append(sW, sLr, H("div", { class: "row" }, btn(s("step1"), () => { const before = L(st.w); st.w -= st.lr * dL(st.w); st.w = Math.max(-40, Math.min(40, st.w)); st.steps++; const after = L(st.w); st.up = after > before ? st.up + 1 : 0; st.hist.push(after); sW.set(fmt2(st.w)); draw(); }), btn(s("reset"), () => { st.w = -2; st.steps = 0; st.manual = false; st.hist = []; st.up = 0; sW.set(fmt2(st.w)); draw(); }, "btn small ghost")), info);
  function draw() {
    const C = COL(), W = cv.w, Hh = cv.h, m = 28, half = W / 2 - 10;
    g.clearRect(0, 0, W, Hh);
    // esquerda: L(w)
    const Lmax = 20, X = w => m + (w + 3) / 8 * (half - 2 * m), Y = l => Hh - m - Math.min(l, Lmax) / Lmax * (Hh - 2 * m);
    g.strokeStyle = C.line; g.beginPath(); g.moveTo(X(-3), Y(0)); g.lineTo(X(5), Y(0)); g.stroke();
    g.strokeStyle = C.a; g.lineWidth = 3; g.beginPath(); for (let w = -3; w <= 5.001; w += .05) { const y = Y(L(w)); w === -3 ? g.moveTo(X(w), y) : g.lineTo(X(w), y); } g.stroke();
    const wv = Math.max(-3, Math.min(5, st.w)), lv = L(st.w), gr = dL(st.w);
    g.strokeStyle = C.gold; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(wv - .8), Y(lv - .8 * gr)); g.lineTo(X(wv + .8), Y(lv + .8 * gr)); g.stroke(); g.setLineDash([]);
    g.fillStyle = C.bad; g.beginPath(); g.arc(X(wv), Y(lv), 7, 0, 7); g.fill();
    // seta -grad
    const ax = X(wv), ay = Y(lv), dir = -Math.sign(gr) * Math.min(40, Math.abs(gr) * 8); g.strokeStyle = C.bad; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + dir, ay); g.lineTo(ax + dir - Math.sign(dir) * 6, ay - 4); g.moveTo(ax + dir, ay); g.lineTo(ax + dir - Math.sign(dir) * 6, ay + 4); g.stroke();
    g.fillStyle = C.muted; g.font = "12px sans-serif"; g.fillText("L(w)", m, 16); g.fillText("w", X(5) - 10, Y(0) + 14);
    // direita: dados e reta
    const ox = W / 2 + 10, X2 = x => ox + m + (x + 1.6) / 3.2 * (half - 2 * m), Y2 = y => Hh / 2 - y / 4 * (Hh - 2 * m) / 2;
    g.strokeStyle = C.line; g.beginPath(); g.moveTo(X2(-1.6), Y2(0)); g.lineTo(X2(1.6), Y2(0)); g.moveTo(X2(0), Y2(-4)); g.lineTo(X2(0), Y2(4)); g.stroke();
    g.strokeStyle = C.a; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X2(-1.6), Y2(Math.max(-4, Math.min(4, -1.6 * st.w)))); g.lineTo(X2(1.6), Y2(Math.max(-4, Math.min(4, 1.6 * st.w)))); g.stroke();
    xs.forEach((x, i) => { g.fillStyle = C.b; g.beginPath(); g.arc(X2(x), Y2(ys[i]), 6, 0, 7); g.fill(); g.strokeStyle = C.bad; g.lineWidth = 1; g.beginPath(); g.moveTo(X2(x), Y2(ys[i])); g.lineTo(X2(x), Y2(Math.max(-4, Math.min(4, st.w * x)))); g.stroke(); });
    g.fillStyle = C.muted; g.fillText(s("fit"), ox + m, 16);
    info.innerHTML = ""; info.append(H("b", {}, "L = " + fmt3(lv)), " · ∂L/∂w = " + fmt2(gr) + " · " + s("steps") + ": " + st.steps);
    api.refreshTasks();
  }
  draw();
  return { check(id) { const lv = L(st.w);
    if (id === "g1") return lv < Lmin + .02;
    if (id === "g2") return !st.manual && st.steps >= 1 && st.steps <= 15 && lv < Lmin + .02;
    if (id === "g3") return st.up >= 3;
    if (id === "g4") return !st.manual && st.steps === 1 && lv < Lmin + .0005;
    return false; }, state() { return { w: +fmt2(st.w), lr: st.lr, loss: +fmt3(L(st.w)), gradient: +fmt2(dL(st.w)), minPossibleLoss: +fmt3(Lmin), gradientStepsSinceReset: st.steps, sliderTouchedSinceReset: st.manual, consecutiveLossIncreases: st.up }; }, destroy() {} };
} };

/* =====================================================================
   4. RETROPROPAGAÇÃO - grafo computacional e regra da cadeia
   ===================================================================== */
SIMS.backprop = { mount(el, api) {
  const s = api.s;
  const SC = { A: { x: 2, y: 1, w1: .5, b1: .5, w2: 1.5, b2: -.5 }, B: { x: -2, y: 1, w1: .5, b1: .5, w2: 1.5, b2: -.5 } };
  const st = { sc: "A", ans: { dy: "", dw2: "", dh: "", dw1: "" }, show: false };
  const calc = () => { const p = SC[st.sc], z = p.w1 * p.x + p.b1, h = Math.max(0, z), yh = p.w2 * h + p.b2, L = (yh - p.y) ** 2, dy = 2 * (yh - p.y), dw2 = dy * h, dh = dy * p.w2, dz = dh * (z > 0 ? 1 : 0), dw1 = dz * p.x; return { ...p, z, h, yh, L, dy, dw2, dh, dz, dw1 }; };
  const cv = canvas(el, 560, 250), g = cv.g;
  const ctl = H("div", { class: "ctls" }); el.append(ctl);
  const inputs = {}; const mk = (key, label) => { const i = H("input", { type: "number", step: "0.01", placeholder: "?", oninput: e => { st.ans[key] = e.target.value; api.refreshTasks(); } }); inputs[key] = i; return H("label", { class: "ctl" }, H("span", { class: "mono" }, label), i); };
  ctl.append(H("div", { class: "row" }, btn(s("scA"), () => { st.sc = "A"; draw(); }), btn(s("scB"), () => { st.sc = "B"; draw(); }), btn(s("path"), () => { st.show = !st.show; draw(); }, "btn small ghost")),
    mk("dy", "∂L/∂ŷ"), mk("dw2", "∂L/∂w₂"), mk("dh", "∂L/∂h"), mk("dw1", "∂L/∂w₁"), H("p", { class: "empty" }, s("note")));
  function node(x, y, label, val, col) { const C = COL(); g.fillStyle = C.surface; g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); g.roundRect(x - 44, y - 24, 88, 48, 10); g.fill(); g.stroke(); g.fillStyle = C.ink; g.font = "bold 13px sans-serif"; g.textAlign = "center"; g.fillText(label, x, y - 5); g.font = "12px monospace"; g.fillText(val, x, y + 13); }
  function arrow(x1, y1, x2, y2, lab) { const C = COL(); g.strokeStyle = C.muted; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); if (lab) { g.fillStyle = C.gold; g.font = "11px monospace"; g.textAlign = "center"; g.fillText(lab, (x1 + x2) / 2, (y1 + y2) / 2 - 6); } }
  function draw() {
    const C = COL(), v = calc(); g.clearRect(0, 0, cv.w, cv.h);
    const y0 = 70, y1 = 175;
    node(60, y0, "x", fmt2(v.x), C.muted); node(60, y1, "w₁, b₁", fmt2(v.w1) + ", " + fmt2(v.b1), C.muted);
    arrow(104, y0, 146, 110); arrow(104, y1, 146, 140);
    node(190, 125, "z = w₁x+b₁", fmt2(v.z), C.a); arrow(234, 125, 276, 125, st.show ? (v.z > 0 ? "×1" : "×0") : "");
    node(320, 125, "h = ReLU(z)", fmt2(v.h), C.a); arrow(364, 125, 406, 125, st.show ? "×w₂" : "");
    node(320, y1 + 20, "w₂, b₂", fmt2(v.w2) + ", " + fmt2(v.b2), C.muted); arrow(364, y1 + 10, 406, 140);
    node(450, 125, "ŷ = w₂h+b₂", fmt2(v.yh), C.b); arrow(494, 125, 520, 125, st.show ? "×2(ŷ−y)" : "");
    node(450, y0 - 20, "y", fmt2(v.y), C.muted); arrow(494, y0 - 10, 520, 110);
    g.fillStyle = C.ink; g.font = "bold 14px sans-serif"; g.textAlign = "left"; g.fillText("L = (ŷ−y)² = " + fmt3(v.L), 400, 40);
    g.fillStyle = C.muted; g.font = "12px sans-serif"; g.fillText(s("sc") + " " + st.sc + (st.sc === "B" ? " · z < 0" : ""), 12, 20);
    api.refreshTasks();
  }
  draw();
  const near = (a, b) => a !== "" && Math.abs(parseFloat(a) - b) < .011;
  return { check(id) { const v = calc();
    if (id === "b1") return near(st.ans.dy, v.dy);
    if (id === "b2") return near(st.ans.dw2, v.dw2);
    if (id === "b3") return st.sc === "A" && near(st.ans.dw1, v.dw1) && near(st.ans.dh, v.dh);
    if (id === "b4") return st.sc === "B" && near(st.ans.dw1, 0) && near(st.ans.dw2, v.dw2);
    return false; }, state() { const v = calc(); return { scenario: st.sc, forward: { x: v.x, y: v.y, w1: v.w1, b1: v.b1, w2: v.w2, b2: v.b2, z: +fmt2(v.z), h: +fmt2(v.h), yhat: +fmt2(v.yh), loss: +fmt3(v.L) }, studentAnswers: st.ans }; }, destroy() {} };
} };

/* =====================================================================
   5. OTIMIZADORES - SGD, momento e Adam correndo no mesmo terreno
   ===================================================================== */
SIMS.optimizers = { mount(el, api) {
  const s = api.s;
  const SURF = {
    bowl: { f: (x, y) => x * x + 10 * y * y, g: (x, y) => [2 * x, 20 * y], start: [-2.2, 1.6], range: [-2.6, 2.6, -2, 2] },
    valley: { f: (x, y) => (1 - x) ** 2 + 5 * (y - x * x) ** 2, g: (x, y) => [-2 * (1 - x) - 20 * x * (y - x * x), 10 * (y - x * x)], start: [-1.6, 1.8], range: [-2.2, 2.2, -1, 3] }
  };
  const st = { surf: "bowl", lr: .05, beta: .9, steps: 0, opt: {} };
  function reset() { const p = SURF[st.surf].start; st.opt = { sgd: { p: [...p], path: [[...p]] }, mom: { p: [...p], v: [0, 0], path: [[...p]] }, adam: { p: [...p], m: [0, 0], v: [0, 0], t: 0, path: [[...p]] } }; st.steps = 0; }
  function step(n) { const S = SURF[st.surf]; for (let k = 0; k < n; k++) {
    const o = st.opt; let gr = S.g(...o.sgd.p); o.sgd.p = o.sgd.p.map((x, i) => x - st.lr * gr[i]);
    gr = S.g(...o.mom.p); o.mom.v = o.mom.v.map((v, i) => st.beta * v - st.lr * gr[i]); o.mom.p = o.mom.p.map((x, i) => x + o.mom.v[i]);
    gr = S.g(...o.adam.p); o.adam.t++; o.adam.m = o.adam.m.map((m, i) => .9 * m + .1 * gr[i]); o.adam.v = o.adam.v.map((v, i) => .999 * v + .001 * gr[i] * gr[i]); o.adam.p = o.adam.p.map((x, i) => x - st.lr * (o.adam.m[i] / (1 - .9 ** o.adam.t)) / (Math.sqrt(o.adam.v[i] / (1 - .999 ** o.adam.t)) + 1e-8));
    for (const key of ["sgd", "mom", "adam"]) { const q = o[key].p.map(x => Number.isFinite(x) ? Math.max(-1e6, Math.min(1e6, x)) : 1e6); o[key].p = q; if (o[key].path.length < 2000) o[key].path.push([...q]); }
    st.steps++; } }
  const loss = key => SURF[st.surf].f(...st.opt[key].p);
  const cv = canvas(el, 520, 380), g = cv.g;
  const ctl = H("div", { class: "ctls" }); el.append(ctl);
  const info = H("div", { class: "siminfo" });
  ctl.append(select(s("surface"), [["bowl", s("bowl")], ["valley", s("valley")]], "bowl", v => { st.surf = v; reset(); bg = null; draw(); }),
    slider(s("lr"), .005, .2, .005, st.lr, v => { st.lr = v; }, v => v.toFixed(3)), slider("β (" + s("momentum") + ")", 0, .99, .01, st.beta, v => st.beta = v, fmt2),
    H("div", { class: "row" }, btn(s("run10"), () => { step(10); draw(); }), btn(s("run100"), () => { step(100); draw(); }), btn(s("reset"), () => { reset(); draw(); }, "btn small ghost")), info);
  let bg = null;
  function draw() {
    const C = COL(), W = cv.w, Hh = cv.h, S = SURF[st.surf], [x0, x1, y0, y1] = S.range, X = x => (x - x0) / (x1 - x0) * W, Y = y => Hh - (y - y0) / (y1 - y0) * Hh;
    if (!bg) { bg = g.createImageData(W, Hh); const dpr = cv.width / W; const img = g.createImageData(cv.width, cv.height); const ca = hex(C.a); for (let py = 0; py < cv.height; py++) for (let px = 0; px < cv.width; px++) { const x = x0 + px / cv.width * (x1 - x0), y = y1 - py / cv.height * (y1 - y0), v = Math.log(1 + S.f(x, y)), t = Math.min(1, v / (st.surf === "bowl" ? 4 : 5.5)), i = (py * cv.width + px) * 4, band = Math.floor(v * 3) % 2 ? 0 : 18; img.data[i] = ca[0]; img.data[i + 1] = ca[1]; img.data[i + 2] = ca[2]; img.data[i + 3] = 30 + 170 * t + band; } bg = img; }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.putImageData(bg, 0, 0); g.restore();
    const cols = { sgd: C.bad, mom: C.gold, adam: C.ok };
    for (const key of ["sgd", "mom", "adam"]) { const p = st.opt[key].path; g.strokeStyle = cols[key]; g.lineWidth = 2; g.beginPath(); p.forEach((q, i) => { const xx = Math.max(-50, Math.min(W + 50, X(q[0]))), yy = Math.max(-50, Math.min(Hh + 50, Y(q[1]))); i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }); g.stroke(); const q = p[p.length - 1]; g.fillStyle = cols[key]; g.beginPath(); g.arc(Math.max(-50, Math.min(W + 50, X(q[0]))), Math.max(-50, Math.min(Hh + 50, Y(q[1]))), 6, 0, 7); g.fill(); }
    g.fillStyle = C.ink; g.beginPath(); g.arc(X(st.surf === "bowl" ? 0 : 1), Y(st.surf === "bowl" ? 0 : 1), 5, 0, 7); g.fill(); g.strokeStyle = C.surface; g.lineWidth = 2; g.stroke();
    const fl = v => v > 1e6 ? "∞" : v > 100 ? v.toExponential(1) : fmt3(v);
    info.innerHTML = ""; info.append(H("span", { style: "color:" + cols.sgd }, "● SGD " + fl(loss("sgd"))), " · ", H("span", { style: "color:" + cols.mom }, "● " + s("momentum") + " " + fl(loss("mom"))), " · ", H("span", { style: "color:" + cols.adam }, "● Adam " + fl(loss("adam"))), " · " + s("steps") + ": " + st.steps);
    api.refreshTasks();
  }
  reset(); draw();
  return { check(id) {
    if (id === "o1") return st.surf === "bowl" && st.steps >= 50 && loss("sgd") < .01;
    if (id === "o2") return st.surf === "bowl" && st.steps >= 50 && loss("sgd") > 1e3 && loss("adam") < .5;
    if (id === "o3") return st.surf === "valley" && st.steps >= 200 && loss("mom") < loss("sgd") && loss("mom") < 1;
    if (id === "o4") return st.surf === "valley" && st.steps <= 600 && loss("adam") < .01;
    return false; }, state() { const f = v => v > 1e6 ? "diverged" : +fmt3(v); return { surface: st.surf, lr: st.lr, momentumBeta: st.beta, steps: st.steps, loss: { sgd: f(loss("sgd")), momentum: f(loss("mom")), adam: f(loss("adam")) } }; }, destroy() {} };
} };

/* =====================================================================
   6. MARS ROVER - retorno, desconto e política num MDP de corredor
   ===================================================================== */
SIMS.rover = { mount(el, api) {
  const s = api.s;
  const N = 7, R = [1, 0, 0, 0, 0, 0, 10];
  const st = { gamma: .9, slip: 0, pol: [null, "R", "R", "R", "R", "R", null], pos: 3, trail: [] };
  function evalPol(pol) { let V = Array(N).fill(0); for (let k = 0; k < 400; k++) { const nv = [...V]; for (let i = 1; i < N - 1; i++) { const a = pol[i], go = a === "R" ? i + 1 : i - 1, other = a === "R" ? i - 1 : i + 1, q = t => R[t] + (t === 0 || t === N - 1 ? 0 : st.gamma * V[t]); nv[i] = (1 - st.slip) * q(go) + st.slip * q(other); } V = nv; } return V; }
  function optimal() { let V = Array(N).fill(0), pol = [...st.pol]; for (let k = 0; k < 400; k++) { const nv = [...V]; for (let i = 1; i < N - 1; i++) { const q = t => R[t] + (t === 0 || t === N - 1 ? 0 : st.gamma * V[t]); const qr = (1 - st.slip) * q(i + 1) + st.slip * q(i - 1), ql = (1 - st.slip) * q(i - 1) + st.slip * q(i + 1); nv[i] = Math.max(qr, ql); pol[i] = qr >= ql - 1e-9 ? "R" : "L"; } V = nv; } return { V, pol }; }
  const cv = canvas(el, 560, 260), g = cv.g;
  const ctl = H("div", { class: "ctls" }); el.append(ctl);
  const info = H("div", { class: "siminfo" });
  ctl.append(slider("γ (" + s("discount") + ")", .05, .99, .01, st.gamma, v => { st.gamma = v; draw(); }, fmt2), slider(s("slip"), 0, .4, .05, st.slip, v => { st.slip = v; draw(); }, fmt2),
    H("div", { class: "row" }, btn(s("allR"), () => { for (let i = 1; i < N - 1; i++) st.pol[i] = "R"; draw(); }), btn(s("allL"), () => { for (let i = 1; i < N - 1; i++) st.pol[i] = "L"; draw(); }), btn(s("walk"), () => { st.pos = 3; st.trail = [3]; const go = () => { if (st.pos === 0 || st.pos === N - 1) return draw(); const a = st.pol[st.pos], slipped = Math.random() < st.slip; st.pos += (a === "R") !== slipped ? 1 : -1; st.trail.push(st.pos); draw(); setTimeout(go, 350); }; go(); }, "btn small ghost")),
    H("p", { class: "empty" }, s("tip")), info);
  cv.addEventListener("click", e => { const rect = cv.getBoundingClientRect(), x = (e.clientX - rect.left) / rect.width * cv.w, y = (e.clientY - rect.top) / rect.height * cv.h, i = Math.floor((x - 20) / ((cv.w - 40) / N)); if (i >= 1 && i < N - 1 && y > 120 && y < 175) { st.pol[i] = st.pol[i] === "R" ? "L" : "R"; draw(); } });
  function draw() {
    const C = COL(), W = cv.w, cw = (W - 40) / N, V = evalPol(st.pol); g.clearRect(0, 0, W, cv.h);
    const vmax = Math.max(1, ...V.slice(1, -1));
    for (let i = 0; i < N; i++) { const x = 20 + i * cw, term = i === 0 || i === N - 1;
      g.fillStyle = term ? (i === 0 ? C.gold : C.ok) : C.sunken; g.fillRect(x + 3, 120, cw - 6, 55); g.strokeStyle = C.line; g.strokeRect(x + 3, 120, cw - 6, 55);
      g.fillStyle = C.ink; g.font = "bold 13px sans-serif"; g.textAlign = "center"; g.fillText(term ? "+" + R[i] : "s" + (i + 1), x + cw / 2, term ? 152 : 140);
      if (!term) { g.font = "22px sans-serif"; g.fillText(st.pol[i] === "R" ? "→" : "←", x + cw / 2, 168); const h = V[i] / vmax * 70; g.fillStyle = C.a; g.fillRect(x + cw / 2 - 14, 105 - h, 28, h); g.fillStyle = C.muted; g.font = "11px monospace"; g.fillText(fmt2(V[i]), x + cw / 2, 100 - h); }
      if (st.pos === i) { g.font = "26px sans-serif"; g.fillText("🛸", x + cw / 2, 215); } }
    g.fillStyle = C.muted; g.font = "12px sans-serif"; g.textAlign = "left"; g.fillText("V^π(s)", 20, 20);
    info.innerHTML = ""; info.append(H("b", {}, "V(s4) = " + fmt3(V[3])), " · " + s("steps") + " " + st.trail.length);
    api.refreshTasks();
  }
  draw();
  const sameOpt = () => { const o = optimal(), V = evalPol(st.pol); return st.slip === 0 && o.V.every((v, i) => Math.abs(v - V[i]) < 1e-6); };
  return { check(id) {
    if (id === "m1") return st.slip === 0 && Math.abs(st.gamma - .9) < .011 && st.pol.slice(1, -1).every(a => a === "R") && evalPol(st.pol)[1] > 5;
    if (id === "m2") return Math.abs(st.gamma - .5) < .06 && sameOpt() && st.pol[1] === "L" && st.pol[2] === "R";
    if (id === "m3") return st.gamma >= .9 && sameOpt() && st.pol.slice(1, -1).every(a => a === "R");
    if (id === "m4") return sameOpt() && st.pol[1] === "L" && st.pol[2] === "L" && st.pol[3] === "R";
    return false; }, state() { const V = evalPol(st.pol); return { gamma: st.gamma, slip: st.slip, policy_s2_to_s6: st.pol.slice(1, -1).join(""), V_pi: V.slice(1, -1).map(v => +fmt3(v)), policyIsOptimal: sameOpt() }; }, destroy() {} };
} };

/* =====================================================================
   7. GRIDWORLD - iteração de valor num mundo em grade com incerteza
   ===================================================================== */
SIMS.gridworld = { mount(el, api) {
  const s = api.s;
  const ROWS = 3, COLS = 4, GOAL = [0, 3], PIT = [1, 3], WALL = [1, 1], START = [2, 0];
  const st = { gamma: .9, slip: .2, live: -.04, V: [], sweeps: 0, delta: 1, converged: false };
  const isT = (r, c) => (r === GOAL[0] && c === GOAL[1]) || (r === PIT[0] && c === PIT[1]);
  const isW = (r, c) => r === WALL[0] && c === WALL[1];
  const Rw = (r, c) => (r === GOAL[0] && c === GOAL[1]) ? 1 : (r === PIT[0] && c === PIT[1]) ? -1 : st.live;
  const DIRS = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] }, PERP = { U: ["L", "R"], D: ["L", "R"], L: ["U", "D"], R: ["U", "D"] };
  const move = (r, c, d) => { const [dr, dc] = DIRS[d], nr = r + dr, nc = c + dc; return (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || isW(nr, nc)) ? [r, c] : [nr, nc]; };
  const Q = (r, c, a, V) => { const t = [[1 - st.slip, a], [st.slip / 2, PERP[a][0]], [st.slip / 2, PERP[a][1]]]; return t.reduce((acc, [p, d]) => { const [nr, nc] = move(r, c, d); return acc + p * V[nr][nc]; }, 0); };
  function resetV() { st.V = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => isT(r, c) ? Rw(r, c) : 0)); st.sweeps = 0; st.delta = 1; st.converged = false; }
  function sweep() { const nv = st.V.map(r => [...r]); let d = 0; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { if (isT(r, c) || isW(r, c)) { nv[r][c] = isT(r, c) ? Rw(r, c) : 0; continue; } const best = Math.max(...Object.keys(DIRS).map(a => Q(r, c, a, st.V))); nv[r][c] = Rw(r, c) + st.gamma * best; d = Math.max(d, Math.abs(nv[r][c] - st.V[r][c])); } st.V = nv; st.sweeps++; st.delta = d; st.converged = d < .001; }
  const greedy = (r, c) => Object.keys(DIRS).reduce((b, a) => Q(r, c, a, st.V) > Q(r, c, b, st.V) + 1e-9 ? a : b, "U");
  const cv = canvas(el, 480, 360), g = cv.g;
  const ctl = H("div", { class: "ctls" }); el.append(ctl);
  const info = H("div", { class: "siminfo" });
  ctl.append(slider("γ (" + s("discount") + ")", .5, 1, .01, st.gamma, v => { st.gamma = v; resetV(); draw(); }, fmt2), slider(s("slip"), 0, .5, .05, st.slip, v => { st.slip = v; resetV(); draw(); }, fmt2), slider(s("live"), -2, 0, .01, st.live, v => { st.live = v; resetV(); draw(); }, fmt2),
    H("div", { class: "row" }, btn(s("sweep1"), () => { sweep(); draw(); }), btn(s("converge"), () => { for (let k = 0; k < 500 && !st.converged; k++) sweep(); draw(); }), btn(s("reset"), () => { resetV(); draw(); }, "btn small ghost")), info);
  function draw() {
    const C = COL(), cs = 100, ox = 40, oy = 30; g.clearRect(0, 0, cv.w, cv.h);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const x = ox + c * cs, y = oy + r * cs, v = st.V[r][c];
      if (isW(r, c)) { g.fillStyle = C.ink; g.fillRect(x, y, cs, cs); continue; }
      const t = Math.max(-1, Math.min(1, v)); g.fillStyle = t >= 0 ? C.ok : C.bad; g.globalAlpha = .12 + .6 * Math.abs(t); g.fillRect(x, y, cs, cs); g.globalAlpha = 1; g.strokeStyle = C.line; g.strokeRect(x, y, cs, cs);
      g.fillStyle = C.ink; g.textAlign = "center"; g.font = "bold 15px monospace"; g.fillText(fmt2(v), x + cs / 2, y + 24);
      if (isT(r, c)) { g.font = "28px sans-serif"; g.fillText(Rw(r, c) > 0 ? "🏁" : "🕳️", x + cs / 2, y + 68); }
      else { g.font = "30px sans-serif"; g.fillText({ U: "↑", D: "↓", L: "←", R: "→" }[greedy(r, c)], x + cs / 2, y + 70); }
      if (r === START[0] && c === START[1]) { g.font = "11px sans-serif"; g.fillStyle = C.muted; g.textAlign = "right"; g.fillText(s("start"), x + cs - 5, y + cs - 5); }
      g.fillStyle = C.muted; g.font = "10px monospace"; g.textAlign = "left"; g.fillText("(" + r + "," + c + ")", x + 4, y + cs - 5); }
    info.innerHTML = ""; info.append(H("b", {}, s("sweeps") + ": " + st.sweeps), " · Δ = " + (st.delta < 1e-4 ? st.delta.toExponential(1) : fmt3(st.delta)) + (st.converged ? " · " + s("done") : ""));
    api.refreshTasks();
  }
  resetV(); draw();
  return { check(id) {
    if (id === "w1") return st.converged;
    if (id === "w2") return st.converged && Math.abs(st.slip - .2) < .01 && Math.abs(st.live + .04) < .005 && greedy(2, 3) === "L";
    if (id === "w3") return st.converged && Math.abs(st.slip - .2) < .01 && greedy(2, 3) === "U" && st.live < -.08;
    if (id === "w4") return st.converged && st.slip === 0 && st.gamma >= .995 && Math.abs(st.live + .04) < .005 && Math.abs(st.V[2][0] - .8) < .002;
    return false; }, state() { return { gamma: st.gamma, slip: st.slip, rewardPerStep: st.live, sweeps: st.sweeps, delta: +st.delta.toExponential(2), converged: st.converged, V: st.V.map(r => r.map(v => +fmt2(v))), greedyPolicy: st.V.map((row, r) => row.map((_, c) => isT(r, c) ? "T" : isW(r, c) ? "#" : greedy(r, c)).join(" ")) }; }, destroy() {} };
} };
