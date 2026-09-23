/* IAWise - simuladores das fases NN 6–14 e RL 3–14 (mesma interface: mount -> {check, state, destroy}). */

/* ---------- utilidades compartilhadas ---------- */
/* gerador de melhor qualidade (mulberry32) para simuladores sensíveis a correlação entre sorteios */
function mb32(a) { a >>>= 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
/* gráfico de linhas simples: series = [{pts:[[x,y]], col, w, dash, dots}] */
function plot(g, x, y, w, h, series, o) {
  const C = COL(), X = v => x + (v - o.x0) / (o.x1 - o.x0) * w, tY = v => o.log ? Math.log10(Math.max(v, 1e-12)) : v, Y = v => y + h - (tY(v) - tY(o.y0)) / (tY(o.y1) - tY(o.y0)) * h;
  g.save(); g.strokeStyle = C.line; g.lineWidth = 1; g.strokeRect(x, y, w, h);
  g.fillStyle = C.muted; g.font = "11px sans-serif"; g.textAlign = "left"; if (o.title) g.fillText(o.title, x + 4, y + 13);
  if (o.yl) { g.textAlign = "right"; g.fillText(o.yl[0], x - 3, y + h); g.fillText(o.yl[1], x - 3, y + 10); }
  if (o.xl) { g.textAlign = "left"; g.fillText(o.xl[0], x, y + h + 12); g.textAlign = "right"; g.fillText(o.xl[1], x + w, y + h + 12); }
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  for (const s of series) { g.strokeStyle = s.col; g.fillStyle = s.col; g.lineWidth = s.w || 2; g.setLineDash(s.dash || []);
    if (s.dots) { for (const [a, b] of s.pts) { g.beginPath(); g.arc(X(a), Y(b), s.r || 4, 0, 7); s.hollow ? g.stroke() : g.fill(); } }
    else { g.beginPath(); s.pts.forEach(([a, b], i) => i ? g.lineTo(X(a), Y(b)) : g.moveTo(X(a), Y(b))); g.stroke(); } }
  g.setLineDash([]); g.restore(); return { X, Y };
}
function bars(g, x, y, w, h, vals, labels, cols, o = {}) {
  const C = COL(), n = vals.length, bw = w / n, max = o.max || Math.max(1e-9, ...vals.map(Math.abs)), min = o.min != null ? o.min : 0;
  g.save(); g.font = "11px sans-serif"; g.textAlign = "center";
  const Y = v => y + h - (v - min) / (max - min) * h;
  vals.forEach((v, i) => { g.fillStyle = Array.isArray(cols) ? cols[i] : cols; const y0 = Y(Math.max(min, 0)), y1 = Y(v); g.fillRect(x + i * bw + bw * .18, Math.min(y0, y1), bw * .64, Math.abs(y1 - y0));
    g.fillStyle = C.ink; g.fillText(o.fmt ? o.fmt(v) : fmt2(v), x + i * bw + bw / 2, Math.min(y0, y1) - 4); if (labels) { g.fillStyle = C.muted; g.fillText(labels[i], x + i * bw + bw / 2, y + h + 13); } });
  if (o.title) { g.textAlign = "left"; g.fillStyle = C.muted; g.fillText(o.title, x, y - 6); }
  g.strokeStyle = C.line; g.beginPath(); g.moveTo(x, Y(Math.max(min, 0))); g.lineTo(x + w, Y(Math.max(min, 0))); g.stroke(); g.restore();
}
function solve(A, b) { const n = b.length, M = A.map((r, i) => [...r, b[i]]); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; const d = M[c][c] || 1e-12; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / d; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } } return M.map((r, i) => r[n] / (r[i] || 1e-12)); }
/* MLP pequena treinada com Adam (regressão MSE ou classificação binária) */
function mlp(sizes, act, r) { const L = []; for (let l = 0; l < sizes.length - 1; l++) { const a = sizes[l], b = sizes[l + 1], sc = Math.sqrt((act === "relu" ? 2 : 1) / a); L.push({ a, b, W: Array.from({ length: a * b }, () => gauss(r) * sc), c: new Array(b).fill(0) }); } return { L, act, t: 0, m: null }; }
function mlpFwd(n, x) { const hs = [x]; let h = x; n.L.forEach((ly, l) => { const o = new Array(ly.b); for (let j = 0; j < ly.b; j++) { let s = ly.c[j]; for (let i = 0; i < ly.a; i++) s += ly.W[j * ly.a + i] * h[i]; o[j] = l < n.L.length - 1 ? (n.act === "relu" ? Math.max(0, s) : Math.tanh(s)) : s; } hs.push(o); h = o; }); return hs; }
function mlpParams(n) { return n.L.reduce((a, l) => a + l.W.length + l.c.length, 0); }
function mlpTrain(n, X, Y, steps, lr, kind) {
  if (!n.m) n.m = n.L.map(l => ({ mW: l.W.map(() => 0), vW: l.W.map(() => 0), mc: l.c.map(() => 0), vc: l.c.map(() => 0) }));
  let loss = 0;
  for (let s = 0; s < steps; s++) {
    const gW = n.L.map(l => new Array(l.W.length).fill(0)), gc = n.L.map(l => new Array(l.c.length).fill(0)); loss = 0;
    for (let k = 0; k < X.length; k++) { const hs = mlpFwd(n, X[k]), out = hs[hs.length - 1][0]; let d;
      if (kind === "bce") { const p = 1 / (1 + Math.exp(-out)); loss += -(Y[k] * Math.log(p + 1e-9) + (1 - Y[k]) * Math.log(1 - p + 1e-9)); d = [(p - Y[k]) / X.length]; }
      else { loss += (out - Y[k]) ** 2; d = [2 * (out - Y[k]) / X.length]; }
      for (let l = n.L.length - 1; l >= 0; l--) { const ly = n.L[l], hin = hs[l], nd = new Array(ly.a).fill(0);
        for (let j = 0; j < ly.b; j++) { gc[l][j] += d[j]; for (let i = 0; i < ly.a; i++) { gW[l][j * ly.a + i] += d[j] * hin[i]; nd[i] += d[j] * ly.W[j * ly.a + i]; } }
        if (l > 0) for (let i = 0; i < ly.a; i++) nd[i] *= n.act === "relu" ? (hin[i] > 0 ? 1 : 0) : 1 - hin[i] * hin[i];
        d = nd; } }
    n.t++; const b1 = .9, b2 = .999, c1 = 1 - b1 ** n.t, c2 = 1 - b2 ** n.t;
    n.L.forEach((ly, l) => { const m = n.m[l]; for (let i = 0; i < ly.W.length; i++) { m.mW[i] = b1 * m.mW[i] + (1 - b1) * gW[l][i]; m.vW[i] = b2 * m.vW[i] + (1 - b2) * gW[l][i] ** 2; ly.W[i] -= lr * (m.mW[i] / c1) / (Math.sqrt(m.vW[i] / c2) + 1e-8); }
      for (let j = 0; j < ly.c.length; j++) { m.mc[j] = b1 * m.mc[j] + (1 - b1) * gc[l][j]; m.vc[j] = b2 * m.vc[j] + (1 - b2) * gc[l][j] ** 2; ly.c[j] -= lr * (m.mc[j] / c1) / (Math.sqrt(m.vc[j] / c2) + 1e-8); } });
  }
  return loss / X.length;
}
const logSlider = (label, e0, e1, val, on) => slider(label, e0, e1, .1, val, on, v => v <= e0 ? "0" : "1e" + v.toFixed(1));

/* =====================================================================
   NN 6. SOBREAJUSTE - grau do polinômio × regularização L2
   ===================================================================== */
SIMS.overfit = { mount(el, api) {
  const s = api.s, f = x => .8 * Math.sin(Math.PI * x);
  const st = { d: 3, le: -9, seed: 7, tr: null, va: null };
  const leg = (x, d) => { const P = [1, x]; for (let k = 2; k <= d; k++) P.push(((2 * k - 1) * x * P[k - 1] - (k - 1) * P[k - 2]) / k); return P.slice(0, d + 1); };
  function data() { const r = seeded(st.seed); st.tr = Array.from({ length: 12 }, (_, i) => { const x = -1 + 2 * (i + r() * .6) / 12.2; return [x, f(x) + gauss(r) * .15]; }); st.va = Array.from({ length: 60 }, () => { const x = r() * 2 - 1; return [x, f(x) + gauss(r) * .15]; }); }
  const lam = () => st.le <= -9 ? 0 : Math.pow(10, st.le);
  function fit(d, l) { const A = Array.from({ length: d + 1 }, () => new Array(d + 1).fill(0)), b = new Array(d + 1).fill(0);
    for (const [x, y] of st.tr) { const p = leg(x, d); for (let i = 0; i <= d; i++) { b[i] += p[i] * y / st.tr.length; for (let j = 0; j <= d; j++) A[i][j] += p[i] * p[j] / st.tr.length; } }
    for (let i = 1; i <= d; i++) A[i][i] += l; A[0][0] += 1e-12; return solve(A, b); }
  const pred = (w, x) => leg(x, w.length - 1).reduce((a, p, i) => a + p * w[i], 0);
  const mse = (w, D) => D.reduce((a, [x, y]) => a + (pred(w, x) - y) ** 2, 0) / D.length;
  const errs = (d, l) => { const w = fit(d, l); return { w, tr: mse(w, st.tr), va: mse(w, st.va) }; };
  const cv = canvas(el, 560, 280), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(slider(s("degree"), 1, 11, 1, st.d, v => { st.d = v; draw(); }), logSlider("λ (L2)", -9, 1, st.le, v => { st.le = v; draw(); }),
    H("div", { class: "row" }, btn(s("newData"), () => { st.seed++; data(); draw(); }, "btn small ghost")), info);
  function draw() {
    const C = COL(), cur = errs(st.d, lam()); g.clearRect(0, 0, cv.w, cv.h);
    const xs = Array.from({ length: 121 }, (_, i) => -1 + i / 60);
    plot(g, 10, 10, 300, 250, [{ pts: xs.map(x => [x, f(x)]), col: C.muted, dash: [5, 4] }, { pts: xs.map(x => [x, Math.max(-2, Math.min(2, pred(cur.w, x)))]), col: C.a, w: 2.5 },
      { pts: st.va, col: C.muted, dots: true, hollow: true, r: 3, w: 1 }, { pts: st.tr, col: C.b, dots: true, r: 5 }], { x0: -1, x1: 1, y0: -1.6, y1: 1.6, title: s("fitT") });
    const E = Array.from({ length: 11 }, (_, i) => errs(i + 1, lam()));
    plot(g, 350, 10, 200, 250, [{ pts: E.map((e, i) => [i + 1, e.tr]), col: C.b }, { pts: E.map((e, i) => [i + 1, e.va]), col: C.bad }, { pts: [[st.d, cur.tr], [st.d, cur.va]], col: C.ink, dots: true, r: 5 }],
      { x0: 1, x1: 11, y0: 1e-4, y1: 10, log: true, title: s("curveT"), xl: ["1", "11"], yl: ["1e-4", "10"] });
    g.fillStyle = C.b; g.fillText("— " + s("train"), 360, 250); g.fillStyle = C.bad; g.fillText("— " + s("val"), 440, 250);
    st.cur = cur; info.innerHTML = ""; info.append(H("b", {}, s("train") + " MSE " + fmt3(cur.tr) + " · " + s("val") + " MSE " + fmt3(cur.va)), " · " + s("degree") + " " + st.d + " · λ " + (lam() ? lam().toExponential(1) : "0"));
    api.refreshTasks(); }
  data(); draw();
  const best0 = () => Math.min(...Array.from({ length: 11 }, (_, i) => errs(i + 1, 0).va));
  return { check(id) { const c = st.cur;
      if (id === "o1") return st.d === 1 && c.tr > .08;
      if (id === "o2") return st.d >= 9 && lam() === 0 && c.va > 5 * c.tr;
      if (id === "o3") return st.d >= 9 && lam() > 0 && c.va < .045;
      if (id === "o4") return lam() === 0 && c.va <= best0() * 1.1;
      return false; },
    state() { return { degree: st.d, lambda: lam(), trainMSE: +fmt3(st.cur.tr), valMSE: +fmt3(st.cur.va), trainPoints: 12 }; }, destroy() {} };
} };

/* =====================================================================
   NN 7. CONVOLUÇÃO - filtro 3×3, stride, padding e pooling
   ===================================================================== */
SIMS.conv = { mount(el, api) {
  const s = api.s, N = 14;
  const IMG = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => ((c === 3 && r >= 2 && r <= 11) || (r === 10 && c >= 5 && c <= 12) || (r >= 2 && r <= 6 && c >= 7 && c <= 11 && !(r >= 3 && r <= 5 && c >= 8 && c <= 10))) ? 1 : 0));
  const PRE = { id: [0, 0, 0, 0, 1, 0, 0, 0, 0], vert: [-1, 0, 1, -2, 0, 2, -1, 0, 1], hor: [-1, -2, -1, 0, 0, 0, 1, 2, 1], blur: [1, 1, 1, 1, 2, 1, 1, 1, 1], sharp: [0, -1, 0, -1, 2, -1, 0, -1, 0] };
  const st = { k: [...PRE.id], stride: 1, pad: 1, pool: false };
  function conv(img, k, stride, pad) { const n = img.length, o = Math.floor((n + 2 * pad - 3) / stride) + 1, out = []; for (let i = 0; i < o; i++) { const row = []; for (let j = 0; j < o; j++) { let v = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const r = i * stride - pad + a, c = j * stride - pad + b; if (r >= 0 && c >= 0 && r < n && c < n) v += img[r][c] * k[a * 3 + b]; } row.push(v); } out.push(row); } return out; }
  const poolF = m => { const o = Math.floor(m.length / 2); return Array.from({ length: o }, (_, i) => Array.from({ length: o }, (_, j) => Math.max(m[2 * i][2 * j], m[2 * i + 1][2 * j], m[2 * i][2 * j + 1], m[2 * i + 1][2 * j + 1]))); };
  const out = () => { const m = conv(IMG, st.k, st.stride, st.pad); return st.pool && m.length >= 2 ? poolF(m) : m; };
  const PV = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => c >= 4 ? 1 : 0)), PH = PV.map((row, r) => row.map((_, c) => PV[c][r]));
  const resp = img => conv(img, st.k, 1, 0).flat().reduce((a, v) => a + Math.abs(v), 0);
  const tv = m => { let t = 0; for (let i = 0; i < m.length; i++) for (let j = 0; j < m.length; j++) { if (i + 1 < m.length) t += Math.abs(m[i + 1][j] - m[i][j]); if (j + 1 < m.length) t += Math.abs(m[i][j + 1] - m[i][j]); } return t; };
  const cv = canvas(el, 560, 260), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  const selK = select(s("preset"), [["id", s("pId")], ["vert", s("pVert")], ["hor", s("pHor")], ["blur", s("pBlur")], ["sharp", s("pSharp")]], "id", v => { st.k = [...PRE[v]]; draw(); });
  ctl.append(selK, slider("stride", 1, 3, 1, st.stride, v => { st.stride = v; draw(); }), slider("padding", 0, 2, 1, st.pad, v => { st.pad = v; draw(); }),
    H("label", { class: "ctl chk" }, H("input", { type: "checkbox", onchange: e => { st.pool = e.target.checked; draw(); } }), H("span", {}, s("pool"))), H("p", { class: "empty" }, s("tip")), info);
  const KX = 250, KY = 70, KS = 34;
  cv.addEventListener("click", e => { const rc = cv.getBoundingClientRect(), x = (e.clientX - rc.left) / rc.width * cv.w, y = (e.clientY - rc.top) / rc.height * cv.h, c = Math.floor((x - KX) / KS), r = Math.floor((y - KY) / KS);
    if (r >= 0 && r < 3 && c >= 0 && c < 3) { const i = r * 3 + c, seq = [0, 1, 2, -2, -1]; st.k[i] = seq[(seq.indexOf(st.k[i]) + 1) % 5] ?? 0; draw(); } });
  function grid(m, x0, y0, size, signed) { const C = COL(), n = m.length, cs = size / n, mx = Math.max(1e-9, ...m.flat().map(Math.abs)), ca = hex(C.a), cb = hex(C.bad);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = m[i][j] / mx, c = v >= 0 ? ca : cb; g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, Math.abs(v))})`; g.fillRect(x0 + j * cs, y0 + i * cs, cs, cs); }
    g.strokeStyle = C.line; g.strokeRect(x0, y0, size, size); }
  function draw() {
    const C = COL(), o = out(); g.clearRect(0, 0, cv.w, cv.h); g.font = "12px sans-serif"; g.fillStyle = C.muted; g.textAlign = "left";
    g.fillText(s("input") + " 14×14", 10, 16); grid(IMG, 10, 24, 220);
    g.fillText(s("kernel"), KX, KY - 8); for (let i = 0; i < 9; i++) { const r = Math.floor(i / 3), c = i % 3, v = st.k[i]; g.fillStyle = v > 0 ? C.a : v < 0 ? C.bad : C.surface; g.globalAlpha = v ? .25 + .3 * Math.abs(v) : 1; g.fillRect(KX + c * KS, KY + r * KS, KS - 2, KS - 2); g.globalAlpha = 1; g.fillStyle = C.ink; g.textAlign = "center"; g.font = "bold 14px monospace"; g.fillText(v, KX + c * KS + KS / 2 - 1, KY + r * KS + 22); }
    g.textAlign = "left"; g.font = "12px sans-serif"; g.fillStyle = C.muted; g.fillText(s("output") + " " + o.length + "×" + o.length, 370, 16); grid(o, 370, 24, 180);
    info.innerHTML = ""; info.append(H("b", {}, s("size") + ": " + o.length + "×" + o.length), " · (14 + 2·" + st.pad + " − 3) / " + st.stride + " + 1" + (st.pool ? " → pool 2×2" : ""));
    api.refreshTasks(); }
  draw();
  return { check(id) { const o = out();
      if (id === "c1") return !st.pool && o.length === N && o.every((row, i) => row.every((v, j) => Math.abs(v - IMG[i][j]) < 1e-9));
      if (id === "c2") { const v = resp(PV), h = resp(PH); return v > 0 && v >= 3 * h; }
      if (id === "c3") return o.length === 6;
      if (id === "c4") { const sum = st.k.reduce((a, b) => a + b, 0); if (st.k.some(v => v < 0) || sum <= 0 || st.stride !== 1 || st.pad !== 1 || st.pool) return false; const m = conv(IMG, st.k, 1, 1).map(r => r.map(v => v / sum)); return tv(m) < .6 * tv(IMG); }
      return false; },
    state() { const o = out(); return { kernel: [st.k.slice(0, 3), st.k.slice(3, 6), st.k.slice(6)], stride: st.stride, padding: st.pad, maxPool2x2: st.pool, outputSize: o.length + "x" + o.length, verticalEdgeResponse: resp(PV), horizontalEdgeResponse: resp(PH) }; }, destroy() {} };
} };

/* =====================================================================
   NN 8. RNN - gradiente que some ou explode × memória com porta
   ===================================================================== */
SIMS.rnn = { mount(el, api) {
  const s = api.s, st = { mode: "tanh", w: .8, f: .9, T: 20 };
  function run() { const h = [], gr = []; let x = 0, g = 1;
    for (let t = 1; t <= st.T; t++) { const inp = t === 1 ? 1 : 0;
      if (st.mode === "gate") { x = st.f * x + inp; if (t > 1) g *= st.f; }
      else { const pre = st.w * x + inp; x = st.mode === "tanh" ? Math.tanh(pre) : pre; if (t > 1) g *= st.w * (st.mode === "tanh" ? 1 - x * x : 1); }
      h.push(x); gr.push(Math.abs(g)); }
    return { h, gr, hT: h[h.length - 1], gT: gr[gr.length - 1] }; }
  const cv = canvas(el, 560, 280), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  const sw = slider("w (" + s("recurrent") + ")", 0, 2, .01, st.w, v => { st.w = v; draw(); }, fmt2), sf = slider("f (" + s("forget") + ")", .5, 1, .001, st.f, v => { st.f = v; draw(); }, fmt3);
  ctl.append(select(s("cell"), [["tanh", s("mTanh")], ["linear", s("mLin")], ["gate", s("mGate")]], "tanh", v => { st.mode = v; draw(); }), sw, sf, slider(s("steps"), 5, 60, 1, st.T, v => { st.T = v; draw(); }), info);
  function draw() {
    const C = COL(), r = run(); g.clearRect(0, 0, cv.w, cv.h); sw.style.opacity = st.mode === "gate" ? .4 : 1; sf.style.opacity = st.mode === "gate" ? 1 : .4;
    plot(g, 30, 10, 240, 240, [{ pts: r.h.map((v, i) => [i + 1, Math.max(-1.5, Math.min(3, v))]), col: C.a, w: 2.5 }, { pts: [[1, .5], [st.T, .5]], col: C.muted, dash: [4, 4], w: 1 }], { x0: 1, x1: st.T, y0: -1, y1: 1.5, title: s("memT"), xl: ["t=1", "t=" + st.T] });
    plot(g, 310, 10, 240, 240, [{ pts: r.gr.map((v, i) => [i + 1, Math.max(1e-12, Math.min(1e12, v))]), col: C.bad, w: 2.5 }, { pts: [[1, 1], [st.T, 1]], col: C.muted, dash: [4, 4], w: 1 }], { x0: 1, x1: st.T, y0: 1e-8, y1: 1e8, log: true, title: s("gradT"), xl: ["t=1", "t=" + st.T], yl: ["1e-8", "1e8"] });
    st.r = r; info.innerHTML = ""; info.append(H("b", {}, (st.mode === "gate" ? "c" : "h") + "_T = " + fmt3(r.hT)), " · |∂" + (st.mode === "gate" ? "c" : "h") + "_T/∂" + (st.mode === "gate" ? "c" : "h") + "_1| = " + r.gT.toExponential(2)); api.refreshTasks(); }
  draw();
  return { check(id) { const r = st.r;
      if (id === "r1") return st.mode === "tanh" && st.T >= 20 && r.gT < 1e-3;
      if (id === "r2") return st.mode === "linear" && st.T >= 20 && r.gT > 1e3;
      if (id === "r3") return st.mode === "gate" && st.T >= 50 && r.hT >= .5;
      if (id === "r4") return st.mode === "tanh" && st.T >= 30 && r.hT >= .5 && r.gT < 1e-2;
      return false; },
    state() { return { cell: st.mode, w: st.w, forgetGate: st.f, T: st.T, finalState: +fmt3(st.r.hT), gradientFirstToLast: +st.r.gT.toExponential(2) }; }, destroy() {} };
} };

/* =====================================================================
   NN 9. ATENÇÃO - consulta, chaves, temperatura e softmax
   ===================================================================== */
SIMS.attention = { mount(el, api) {
  const s = api.s, K = [[1, .2], [.85, .55], [-.8, .6], [-.9, -.35], [.1, -.15]], names = s("words").split(",");
  const st = { ang: 45, norm: 2, tau: 1 };
  function weights() { const q = [st.norm * Math.cos(st.ang * Math.PI / 180), st.norm * Math.sin(st.ang * Math.PI / 180)], l = K.map(k => (q[0] * k[0] + q[1] * k[1]) / st.tau), m = Math.max(...l), e = l.map(v => Math.exp(v - m)), z = e.reduce((a, b) => a + b, 0); return { q, w: e.map(v => v / z), l }; }
  const cv = canvas(el, 560, 280), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(slider(s("angle"), -180, 180, 1, st.ang, v => { st.ang = v; draw(); }, v => v + "°"), slider("‖q‖", .2, 6, .1, st.norm, v => { st.norm = v; draw(); }, v => v.toFixed(1)), slider(s("temp") + " (τ ≈ √d)", .05, 10, .05, st.tau, v => { st.tau = v; draw(); }, fmt2), info);
  function draw() {
    const C = COL(), R = weights(); g.clearRect(0, 0, cv.w, cv.h);
    const cx = 130, cy = 140, sc = 95; g.strokeStyle = C.line; g.beginPath(); g.moveTo(cx - 120, cy); g.lineTo(cx + 120, cy); g.moveTo(cx, cy - 120); g.lineTo(cx, cy + 120); g.stroke();
    K.forEach((k, i) => { g.fillStyle = C.b; g.globalAlpha = .25 + .75 * R.w[i]; g.beginPath(); g.arc(cx + k[0] * sc, cy - k[1] * sc, 6 + 14 * R.w[i], 0, 7); g.fill(); g.globalAlpha = 1; g.fillStyle = C.ink; g.font = "12px sans-serif"; g.textAlign = "center"; g.fillText(names[i], cx + k[0] * sc, cy - k[1] * sc - 14 - 10 * R.w[i]); });
    const qn = Math.min(1.2, st.norm / 3); g.strokeStyle = C.gold; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(st.ang * Math.PI / 180) * qn * sc, cy - Math.sin(st.ang * Math.PI / 180) * qn * sc); g.stroke(); g.lineWidth = 1;
    g.fillStyle = C.gold; g.font = "bold 12px sans-serif"; g.fillText("q", cx + Math.cos(st.ang * Math.PI / 180) * (qn * sc + 12), cy - Math.sin(st.ang * Math.PI / 180) * (qn * sc + 12));
    bars(g, 290, 40, 260, 200, R.w, names, C.b, { max: 1, fmt: v => Math.round(v * 100) + "%", title: s("wT") });
    st.R = R; info.innerHTML = ""; info.append(H("b", {}, "softmax(q·k / τ)"), " · max " + Math.round(Math.max(...R.w) * 100) + "%"); api.refreshTasks(); }
  draw();
  return { check(id) { const w = st.R.w;
      if (id === "a1") return w[0] >= .8;
      if (id === "a2") return Math.max(...w) <= .25;
      if (id === "a3") return w[0] >= .4 && w[1] >= .4;
      if (id === "a4") return w[2] >= .99;
      return false; },
    state() { return { queryAngleDeg: st.ang, queryNorm: st.norm, temperature: st.tau, weights: Object.fromEntries(names.map((n, i) => [n, +st.R.w[i].toFixed(3)])) }; }, destroy() {} };
} };

/* =====================================================================
   NN 10. AUTOENCODER - linear = PCA; gargalo; dados não lineares
   ===================================================================== */
SIMS.autoenc = { mount(el, api) {
  const s = api.s, r = seeded(11);
  const D = { ell: Array.from({ length: 80 }, () => { const a = gauss(r) * 1.3, b = gauss(r) * .35, t = Math.PI / 6; return [a * Math.cos(t) - b * Math.sin(t), a * Math.sin(t) + b * Math.cos(t)]; }),
    ring: Array.from({ length: 80 }, () => { const t = r() * 2 * Math.PI, rr = 1.4 + gauss(r) * .08; return [rr * Math.cos(t), rr * Math.sin(t)]; }) };
  Object.values(D).forEach(P => { const mx = P.reduce((a, p) => a + p[0], 0) / P.length, my = P.reduce((a, p) => a + p[1], 0) / P.length; P.forEach(p => { p[0] -= mx; p[1] -= my; }); });
  const st = { ds: "ell", ang: 100, k: 1, enc: "lin" };
  function recon(ang = st.ang, k = st.k, enc = st.enc) { const P = D[st.ds], u = [Math.cos(ang * Math.PI / 180), Math.sin(ang * Math.PI / 180)];
    if (k === 2) return P.map(p => [...p]);
    if (enc === "polar") { const rm = P.reduce((a, p) => a + Math.hypot(...p), 0) / P.length; return P.map(p => { const z = Math.atan2(p[1], p[0]); return [rm * Math.cos(z), rm * Math.sin(z)]; }); }
    return P.map(p => { const z = p[0] * u[0] + p[1] * u[1]; return [z * u[0], z * u[1]]; }); }
  const err = R => D[st.ds].reduce((a, p, i) => a + (p[0] - R[i][0]) ** 2 + (p[1] - R[i][1]) ** 2, 0) / D[st.ds].length;
  const curve = () => Array.from({ length: 181 }, (_, a) => err(recon(a, 1, "lin")));
  const cv = canvas(el, 560, 280), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(select(s("data"), [["ell", s("dEll")], ["ring", s("dRing")]], "ell", v => { st.ds = v; draw(); }), select(s("enc"), [["lin", s("eLin")], ["polar", s("ePolar")]], "lin", v => { st.enc = v; draw(); }),
    slider(s("code"), 1, 2, 1, st.k, v => { st.k = v; draw(); }), slider(s("angle"), 0, 180, 1, st.ang, v => { st.ang = v; draw(); }, v => v + "°"), info);
  function draw() {
    const C = COL(), R = recon(), P = D[st.ds], e = err(R), cu = curve(); g.clearRect(0, 0, cv.w, cv.h);
    const { X, Y } = plot(g, 10, 10, 260, 260, [], { x0: -3, x1: 3, y0: -3, y1: 3, title: s("pts") });
    g.strokeStyle = C.line; P.forEach((p, i) => { g.beginPath(); g.moveTo(X(p[0]), Y(p[1])); g.lineTo(X(R[i][0]), Y(R[i][1])); g.stroke(); });
    if (st.k === 1 && st.enc === "lin") { const u = [Math.cos(st.ang * Math.PI / 180), Math.sin(st.ang * Math.PI / 180)]; g.strokeStyle = C.gold; g.lineWidth = 2; g.beginPath(); g.moveTo(X(-3 * u[0]), Y(-3 * u[1])); g.lineTo(X(3 * u[0]), Y(3 * u[1])); g.stroke(); g.lineWidth = 1; }
    plot(g, 10, 10, 260, 260, [{ pts: P, col: C.b, dots: true, r: 3 }, { pts: R, col: C.a, dots: true, r: 2.5, hollow: true, w: 1 }], { x0: -3, x1: 3, y0: -3, y1: 3 });
    const mx = Math.max(...cu); plot(g, 310, 10, 240, 240, [{ pts: cu.map((v, a) => [a, v]), col: C.a }, { pts: [[st.ang, st.k === 1 && st.enc === "lin" ? e : cu[st.ang]]], col: C.gold, dots: true, r: 5 }], { x0: 0, x1: 180, y0: 0, y1: mx * 1.1, title: s("curveT"), xl: ["0°", "180°"] });
    st.e = e; st.min = Math.min(...cu); st.max = mx; st.var = P.reduce((a, p) => a + p[0] ** 2 + p[1] ** 2, 0) / P.length;
    info.innerHTML = ""; info.append(H("b", {}, s("err") + " " + fmt3(e)), " · " + s("varT") + " " + fmt3(st.var) + " · " + Math.round(100 * e / st.var) + "% " + s("lost")); api.refreshTasks(); }
  draw();
  return { check(id) { const lin1 = st.k === 1 && st.enc === "lin";
      if (id === "e1") return st.ds === "ell" && lin1 && st.e <= st.min * 1.05;
      if (id === "e2") return st.ds === "ell" && lin1 && st.e >= st.max * .95;
      if (id === "e3") return st.ds === "ring" && lin1 && st.e <= st.min * 1.05;
      if (id === "e4") return st.ds === "ring" && st.k === 1 && st.enc === "polar" && st.e < .1 * st.min;
      return false; },
    state() { return { data: st.ds, encoder: st.enc, codeSize: st.k, angleDeg: st.ang, reconstructionError: +fmt3(st.e), bestLinearError: +fmt3(st.min), worstLinearError: +fmt3(st.max), totalVariance: +fmt3(st.var) }; }, destroy() {} };
} };

/* =====================================================================
   NN 11. HOPFIELD - regra de Hebb, recuperação e capacidade
   ===================================================================== */
SIMS.hopfield = { mount(el, api) {
  const s = api.s, LET = { T: "11111001000010000100001000", L: "1000010000100001000011111", X: "1000101010001000101010001", O: "0111010001100011000101110", H: "1000110001111111000110001", Z: "1111100010001000100011111" };
  const P = Object.fromEntries(Object.entries(LET).map(([k, v]) => [k, v.slice(0, 25).split("").map(c => c === "1" ? 1 : -1)]));
  const st = { stored: { T: true, L: true, X: false, O: false, H: false, Z: false }, target: "T", noise: .2, x: [...P.T], noisy: 0, E0: null, ran: false, seed: 1, rec: {} };
  const keys = () => Object.keys(st.stored).filter(k => st.stored[k]);
  const Wm = () => { const W = Array.from({ length: 25 }, () => new Array(25).fill(0)); for (const k of keys()) for (let i = 0; i < 25; i++) for (let j = 0; j < 25; j++) if (i !== j) W[i][j] += P[k][i] * P[k][j] / 25; return W; };
  const energy = (x, W) => { let e = 0; for (let i = 0; i < 25; i++) for (let j = 0; j < 25; j++) e -= .5 * W[i][j] * x[i] * x[j]; return e; };
  const cv = canvas(el, 560, 240), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  const chk = H("div", { class: "row" }, H("span", { class: "empty" }, s("store")), ...Object.keys(LET).map(k => H("label", { class: "row", style: "gap:4px" }, H("input", { type: "checkbox", ...(st.stored[k] ? { checked: "" } : {}), onchange: e => { st.stored[k] = e.target.checked; st.ran = false; draw(); } }), k)));
  ctl.append(chk, select(s("target"), Object.keys(LET).map(k => [k, k]), "T", v => { st.target = v; st.x = [...P[v]]; st.noisy = 0; st.ran = false; draw(); }),
    slider(s("noise"), 0, 1, .05, st.noise, v => { st.noise = v; }, v => Math.round(v * 100) + "%"),
    H("div", { class: "row" }, btn(s("corrupt"), () => { const r = seeded(st.seed++); st.x = P[st.target].map(v => r() < st.noise ? -v : v); st.noisy = st.noise; st.ran = false; draw(); }), btn(s("run"), () => { const W = Wm(); st.E0 = energy(st.x, W);
      for (let sw = 0; sw < 30; sw++) { let ch = 0; for (let i = 0; i < 25; i++) { let h = 0; for (let j = 0; j < 25; j++) h += W[i][j] * st.x[j]; const v = h >= 0 ? 1 : -1; if (v !== st.x[i]) { st.x[i] = v; ch++; } } if (!ch) break; }
      st.ran = true; const eq = st.x.every((v, i) => v === P[st.target][i]); if (eq && st.noisy >= .2 && st.stored[st.target]) st.rec[keys().sort().join("")] = { ...(st.rec[keys().sort().join("")] || {}), [st.target]: true }; draw(); })), H("p", { class: "empty" }, s("tip")), info);
  function cells(x, x0, y0, sz, lab) { const C = COL(), c = sz / 5; g.fillStyle = C.muted; g.font = "12px sans-serif"; g.textAlign = "left"; g.fillText(lab, x0, y0 - 6); for (let i = 0; i < 25; i++) { g.fillStyle = x[i] > 0 ? C.ink : C.sunken; g.fillRect(x0 + (i % 5) * c + 1, y0 + Math.floor(i / 5) * c + 1, c - 2, c - 2); } }
  function draw() {
    const C = COL(), W = Wm(); g.clearRect(0, 0, cv.w, cv.h); cells(st.x, 20, 30, 170, s("state")); cells(P[st.target], 230, 30, 90, s("targetL") + " " + st.target);
    keys().forEach((k, i) => cells(P[k], 350 + (i % 3) * 68, 30 + Math.floor(i / 3) * 90, 55, k));
    const eq = st.x.every((v, i) => v === P[st.target][i]), inv = st.x.every((v, i) => v === -P[st.target][i]);
    st.eq = eq; st.inv = inv; info.innerHTML = ""; info.append(H("b", {}, st.ran ? (eq ? s("okRec") : inv ? s("invRec") : s("noRec")) : s("ready")), " · E = " + fmt2(energy(st.x, W)) + (st.E0 != null && st.ran ? " (" + s("before") + " " + fmt2(st.E0) + ")" : "") + " · " + s("storedN") + " " + keys().length); api.refreshTasks(); }
  draw();
  return { check(id) { const n = keys().length;
      if (id === "h1") return st.ran && st.eq && st.noisy >= .2 && n >= 2 && st.stored[st.target];
      if (id === "h2") return st.ran && st.noisy >= .2 && n >= 5 && st.stored[st.target] && !st.eq;
      if (id === "h3") return st.ran && st.inv && st.noisy >= .7 && st.stored[st.target];
      if (id === "h4") return n === 3 && Object.keys(st.rec[keys().sort().join("")] || {}).length >= 3;
      return false; },
    state() { return { storedLetters: keys(), target: st.target, noiseApplied: st.noisy, ranDynamics: st.ran, recoveredTarget: st.eq, reachedInverse: st.inv }; }, destroy() {} };
} };

/* =====================================================================
   NN 12. CAMPO NEURAL - viés espectral e Fourier features
   ===================================================================== */
SIMS.field = { mount(el, api) {
  const s = api.s, f = x => .5 * Math.sin(2 * Math.PI * x) + .3 * Math.sin(2 * Math.PI * 5 * x) + .25 * Math.sin(2 * Math.PI * 11 * x);
  const XT = Array.from({ length: 48 }, (_, i) => i / 48), XV = Array.from({ length: 200 }, (_, i) => (i + .5) / 200);
  const st = { ff: false, sigma: 6, m: 16, steps: 0, net: null, B: null, tr: 1, te: 1 };
  const feat = x => st.ff ? st.B.flatMap(b => [Math.sin(2 * Math.PI * b * x), Math.cos(2 * Math.PI * b * x)]) : [x * 2 - 1];
  function init() { const r = seeded(5); st.B = Array.from({ length: st.m }, () => gauss(r) * st.sigma); st.net = mlp([st.ff ? 2 * st.m : 1, 64, 1], "relu", seeded(9)); st.steps = 0; evalN(); }
  const predict = x => mlpFwd(st.net, feat(x))[2][0];
  function evalN() { st.tr = XT.reduce((a, x) => a + (predict(x) - f(x)) ** 2, 0) / XT.length; st.te = XV.reduce((a, x) => a + (predict(x) - f(x)) ** 2, 0) / XV.length; }
  function train(k) { mlpTrain(st.net, XT.map(feat), XT.map(f), k, .005, "mse"); st.steps += k; evalN(); }
  const cv = canvas(el, 560, 260), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(H("label", { class: "ctl chk" }, H("input", { type: "checkbox", onchange: e => { st.ff = e.target.checked; init(); draw(); } }), H("span", {}, s("useFF"))),
    slider("σ (" + s("scale") + ")", 1, 60, 1, st.sigma, v => { st.sigma = v; init(); draw(); }), slider(s("nfeat"), 2, 32, 1, st.m, v => { st.m = v; init(); draw(); }),
    H("div", { class: "row" }, btn(s("train500"), () => { train(500); draw(); }), btn(s("reinit"), () => { init(); draw(); }, "btn small ghost")), info);
  function draw() {
    const C = COL(), xs = Array.from({ length: 400 }, (_, i) => i / 399); g.clearRect(0, 0, cv.w, cv.h);
    plot(g, 10, 10, 540, 230, [{ pts: xs.map(x => [x, f(x)]), col: C.muted, dash: [5, 4] }, { pts: xs.map(x => [x, Math.max(-1.6, Math.min(1.6, predict(x)))]), col: C.a, w: 2 }, { pts: XT.map(x => [x, f(x)]), col: C.b, dots: true, r: 3 }], { x0: 0, x1: 1, y0: -1.3, y1: 1.3, title: s("legend") });
    info.innerHTML = ""; info.append(H("b", {}, s("trainE") + " " + st.tr.toFixed(4) + " · " + s("testE") + " " + st.te.toFixed(4)), " · " + s("stepsL") + " " + st.steps + (st.ff ? " · σ " + st.sigma + " · m " + st.m : "")); api.refreshTasks(); }
  init(); draw();
  return { check(id) {
      if (id === "f1") return !st.ff && st.steps >= 2000 && st.tr > .02;
      if (id === "f2") return st.ff && st.te < .005;
      if (id === "f3") return st.ff && st.sigma >= 30 && st.tr < .005 && st.te > .03;
      if (id === "f4") return st.ff && st.m <= 6 && st.te < .01;
      return false; },
    state() { return { fourierFeatures: st.ff, sigma: st.sigma, numFeatures: st.m, trainingSteps: st.steps, trainMSE: +st.tr.toFixed(4), testMSE: +st.te.toFixed(4), trainPoints: XT.length }; }, destroy() {} };
} };

/* =====================================================================
   NN 13. PROJETO DE REDE - espirais, profundidade, largura, parâmetros
   ===================================================================== */
SIMS.spiral = { mount(el, api) {
  const s = api.s;
  function make(n, seed) { const r = seeded(seed), P = []; for (let i = 0; i < n; i++) { const c = i % 2, t = .25 + 2.6 * r() , rad = t / 2.85 * 1.6; P.push([rad * Math.cos(t * 4 + c * Math.PI) + gauss(r) * .07, rad * Math.sin(t * 4 + c * Math.PI) + gauss(r) * .07, c]); } return P; }
  const VA = make(300, 99), st = { depth: 2, width: 8, ntr: 200, lr: .03, steps: 0, net: null, TR: null, trA: 0, vaA: 0, loss: 0 };
  function init() { st.TR = make(st.ntr, 3); const sz = [2, ...Array(st.depth).fill(st.width), 1]; st.net = mlp(sz, "tanh", seeded(4)); st.steps = 0; evalN(); }
  const out = (x, y) => mlpFwd(st.net, [x, y]).pop()[0];
  const acc = D => D.filter(p => (out(p[0], p[1]) > 0 ? 1 : 0) === p[2]).length / D.length;
  function evalN() { st.trA = acc(st.TR); st.vaA = acc(VA); }
  function train(k) { st.loss = mlpTrain(st.net, st.TR.map(p => [p[0], p[1]]), st.TR.map(p => p[2]), k, st.lr, "bce"); st.steps += k; evalN(); }
  const cv = canvas(el, 560, 280), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(slider(s("depth"), 0, 4, 1, st.depth, v => { st.depth = v; init(); draw(); }), slider(s("width"), 2, 32, 1, st.width, v => { st.width = v; init(); draw(); }),
    slider(s("ntrain"), 20, 300, 10, st.ntr, v => { st.ntr = v; init(); draw(); }), slider(s("lr"), .001, .3, .001, st.lr, v => { st.lr = v; }, v => v.toFixed(3)),
    H("div", { class: "row" }, btn(s("train200"), () => { train(200); draw(); }), btn(s("reinit"), () => { init(); draw(); }, "btn small ghost")), info);
  function draw() {
    const C = COL(), W = 260, x0 = 10, y0 = 10, R = 2.1, X = v => x0 + (v + R) / (2 * R) * W, Y = v => y0 + W - (v + R) / (2 * R) * W; g.clearRect(0, 0, cv.w, cv.h);
    const ca = hex(C.a), cb = hex(C.b), n = 52; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = -R + (i + .5) * 2 * R / n, y = R - (j + .5) * 2 * R / n, v = out(x, y), c = v > 0 ? cb : ca; g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${.12 + .25 * Math.min(1, Math.abs(Math.tanh(v)))})`; g.fillRect(x0 + i * W / n, y0 + j * W / n, W / n + .5, W / n + .5); }
    for (const p of st.TR) { g.fillStyle = p[2] ? C.b : C.a; g.beginPath(); g.arc(X(p[0]), Y(p[1]), 3, 0, 7); g.fill(); }
    g.strokeStyle = C.line; g.strokeRect(x0, y0, W, W);
    g.fillStyle = C.ink; g.font = "13px sans-serif"; g.textAlign = "left";
    const P = mlpParams(st.net), arch = [2, ...Array(st.depth).fill(st.width), 1].join(" → ");
    [[s("arch"), arch], [s("params"), P], [s("trainAcc"), Math.round(st.trA * 100) + "%"], [s("valAcc"), Math.round(st.vaA * 100) + "%"], [s("stepsL"), st.steps]].forEach(([a, b], i) => { g.fillStyle = C.muted; g.fillText(a, 300, 40 + i * 40); g.fillStyle = C.ink; g.font = "bold 15px monospace"; g.fillText(String(b), 300, 60 + i * 40); g.font = "13px sans-serif"; });
    st.P = P; info.innerHTML = ""; info.append(H("b", {}, s("valAcc") + " " + Math.round(st.vaA * 100) + "%"), " · " + s("params") + " " + P + " · loss " + fmt3(st.loss)); api.refreshTasks(); }
  init(); draw();
  return { check(id) {
      if (id === "s1") return st.depth === 0 && st.steps >= 200 && st.vaA <= .7;
      if (id === "s2") return st.vaA >= .95;
      if (id === "s3") return st.vaA >= .9 && st.P <= 70;
      if (id === "s4") return st.ntr <= 30 && st.trA >= .99 && st.vaA <= st.trA - .08;
      return false; },
    state() { return { depth: st.depth, width: st.width, parameters: st.P, trainPoints: st.ntr, learningRate: st.lr, steps: st.steps, trainAccuracy: +st.trA.toFixed(3), valAccuracy: +st.vaA.toFixed(3) }; }, destroy() {} };
} };

/* =====================================================================
   NN 14. TRÊS PARADIGMAS - algoritmo genético × descida de gradiente
   ===================================================================== */
SIMS.evo = { mount(el, api) {
  const s = api.s, F = (x, y) => 20 + x * x - 10 * Math.cos(2 * Math.PI * x) + y * y - 10 * Math.cos(2 * Math.PI * y);
  const dF = (x, y) => [2 * x + 20 * Math.PI * Math.sin(2 * Math.PI * x), 2 * y + 20 * Math.PI * Math.sin(2 * Math.PI * y)];
  const st = { pop: 30, sigma: .5, gen: 0, P: [], gd: null, gdSteps: 0, seed: 1, best: Infinity };
  function reset() { const r = seeded(st.seed); st.r = r; st.P = Array.from({ length: st.pop }, () => [2.5 + r() * 2.5, 2.5 + r() * 2.5]); st.gen = 0; st.best = Math.min(...st.P.map(p => F(...p))); }
  function gen(k) { const r = st.r; for (let t = 0; t < k; t++) { const fit = st.P.map(p => F(...p)), idx = fit.map((_, i) => i).sort((a, b) => fit[a] - fit[b]), elite = st.P[idx[0]];
      const tour = () => { const a = Math.floor(r() * st.pop), b = Math.floor(r() * st.pop); return fit[a] < fit[b] ? st.P[a] : st.P[b]; };
      const N = [[...elite]]; while (N.length < st.pop) { const a = tour(), b = tour(), w = r(); N.push([w * a[0] + (1 - w) * b[0] + gauss(r) * st.sigma, w * a[1] + (1 - w) * b[1] + gauss(r) * st.sigma].map(v => Math.max(-5.12, Math.min(5.12, v)))); }
      st.P = N; st.gen++; st.best = Math.min(st.best, ...st.P.map(p => F(...p))); } }
  const cv = canvas(el, 560, 290), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(slider(s("pop"), 4, 80, 1, st.pop, v => { st.pop = v; reset(); draw(); }), slider(s("mut"), 0, 2, .05, st.sigma, v => { st.sigma = v; }, fmt2),
    H("div", { class: "row" }, btn(s("gen10"), () => { gen(10); draw(); }), btn(s("gen50"), () => { gen(50); draw(); }), btn(s("newPop"), () => { st.seed++; reset(); draw(); }, "btn small ghost")),
    H("div", { class: "row" }, btn(s("gd"), () => { let p = [3.3, 3.1]; for (let i = 0; i < 300; i++) { const d = dF(...p); p = [p[0] - .002 * d[0], p[1] - .002 * d[1]]; } st.gd = p; st.gdSteps = 300; draw(); }, "btn small ghost")), info);
  let bg = null;
  function draw() {
    const C = COL(), W = 280, x0 = 10, y0 = 5, X = v => x0 + (v + 5.12) / 10.24 * W, Y = v => y0 + W - (v + 5.12) / 10.24 * W; g.clearRect(0, 0, cv.w, cv.h);
    if (!bg) { const n = 70, ca = hex(C.a); bg = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = -5.12 + (i + .5) * 10.24 / n, y = 5.12 - (j + .5) * 10.24 / n; bg.push([i, j, F(x, y)]); } bg.n = n; bg.c = ca; }
    for (const [i, j, v] of bg) { g.fillStyle = `rgba(${bg.c[0]},${bg.c[1]},${bg.c[2]},${.06 + .6 * Math.min(1, v / 80)})`; g.fillRect(x0 + i * W / bg.n, y0 + j * W / bg.n, W / bg.n + .5, W / bg.n + .5); }
    for (const p of st.P) { g.fillStyle = C.b; g.beginPath(); g.arc(X(p[0]), Y(p[1]), 3.5, 0, 7); g.fill(); }
    if (st.gd) { g.fillStyle = C.bad; g.beginPath(); g.arc(X(3.3), Y(3.1), 4, 0, 7); g.fill(); g.strokeStyle = C.bad; g.lineWidth = 2; g.beginPath(); g.moveTo(X(3.3), Y(3.1)); g.lineTo(X(st.gd[0]), Y(st.gd[1])); g.stroke(); g.beginPath(); g.arc(X(st.gd[0]), Y(st.gd[1]), 6, 0, 7); g.stroke(); g.lineWidth = 1; }
    g.strokeStyle = C.ink; g.beginPath(); g.arc(X(0), Y(0), 5, 0, 7); g.stroke();
    g.fillStyle = C.ink; g.font = "13px sans-serif"; g.textAlign = "left";
    [[s("genL"), st.gen], [s("bestGA"), st.best.toFixed(3)], [s("gdL"), st.gd ? F(...st.gd).toFixed(3) : "–"], [s("globalL"), "f(0,0) = 0"]].forEach(([a, b], i) => { g.fillStyle = C.muted; g.fillText(a, 310, 40 + i * 44); g.fillStyle = C.ink; g.font = "bold 15px monospace"; g.fillText(String(b), 310, 60 + i * 44); g.font = "13px sans-serif"; });
    info.innerHTML = ""; info.append(H("b", {}, "Rastrigin"), " · " + s("genL") + " " + st.gen + " · " + s("bestGA") + " " + st.best.toFixed(3)); api.refreshTasks(); }
  reset(); draw();
  return { check(id) {
      if (id === "e1") return !!st.gd && F(...st.gd) > 1;
      if (id === "e2") return st.best < .1;
      if (id === "e3") return st.sigma === 0 && st.gen >= 50 && st.best > 1;
      if (id === "e4") return st.best < .1 && st.gen <= 60;
      return false; },
    state() { return { population: st.pop, mutationSigma: st.sigma, generations: st.gen, bestGA: +st.best.toFixed(4), gradientDescentEnd: st.gd ? +F(...st.gd).toFixed(3) : null, startRegion: "[2.5,5]x[2.5,5]" }; }, destroy() {} };
} };

/* =====================================================================
   RL 3. MONTE CARLO × TD(0) - passeio aleatório de 5 estados
   ===================================================================== */
SIMS.mctd = { mount(el, api) {
  const s = api.s, TRUE = [1, 2, 3, 4, 5].map(k => k / 6), R = 20, NM = "ABCDE";
  const st = { aT: .1, aM: .02, ep: 0, seed: 1 };
  function reset() { st.V = { td: Array.from({ length: R }, () => new Array(5).fill(.5)), mc: Array.from({ length: R }, () => new Array(5).fill(.5)) }; st.rng = Array.from({ length: R }, (_, k) => seeded(st.seed * 100 + k)); st.ep = 0; st.curve = { td: [rms("td")], mc: [rms("mc")] }; }
  const rms = m => st.V[m].reduce((a, V) => a + Math.sqrt(V.reduce((b, v, i) => b + (v - TRUE[i]) ** 2, 0) / 5), 0) / R;
  function episodes(n) { for (let e = 0; e < n; e++) { for (let k = 0; k < R; k++) { const r = st.rng[k], Vt = st.V.td[k], Vm = st.V.mc[k]; let x = 2; const vis = [];
        while (true) { vis.push(x); const nx = x + (r() < .5 ? -1 : 1), rew = nx === 5 ? 1 : 0, vn = nx < 0 || nx > 4 ? 0 : Vt[nx]; Vt[x] += st.aT * (rew + vn - Vt[x]); if (nx < 0 || nx > 4) { for (const v of vis) Vm[v] += st.aM * (rew - Vm[v]); break; } x = nx; } }
      st.ep++; st.curve.td.push(rms("td")); st.curve.mc.push(rms("mc")); } }
  const cv = canvas(el, 560, 260), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(slider("α TD", .01, .8, .01, st.aT, v => { st.aT = v; }, fmt2), slider("α MC", .01, .8, .01, st.aM, v => { st.aM = v; }, fmt2),
    H("div", { class: "row" }, btn("+1", () => { episodes(1); draw(); }), btn("+10", () => { episodes(10); draw(); }), btn("+100", () => { episodes(100); draw(); }), btn(s("reset"), () => { st.seed++; reset(); draw(); }, "btn small ghost")), H("p", { class: "empty" }, s("tip")), info);
  function draw() {
    const C = COL(); g.clearRect(0, 0, cv.w, cv.h);
    const { X, Y } = plot(g, 30, 10, 230, 220, [{ pts: TRUE.map((v, i) => [i, v]), col: C.muted, dash: [5, 4] }, { pts: st.V.td[0].map((v, i) => [i, v]), col: C.a, w: 2.5 }, { pts: st.V.mc[0].map((v, i) => [i, v]), col: C.gold, w: 2.5 }], { x0: -.3, x1: 4.3, y0: 0, y1: 1, title: s("vT") });
    g.fillStyle = C.muted; g.font = "11px sans-serif"; g.textAlign = "center"; for (let i = 0; i < 5; i++) g.fillText(NM[i], X(i), 244);
    const n = st.curve.td.length, ymax = .3; plot(g, 300, 10, 250, 220, [{ pts: st.curve.td.map((v, i) => [i, v]), col: C.a }, { pts: st.curve.mc.map((v, i) => [i, v]), col: C.gold }], { x0: 0, x1: Math.max(10, n - 1), y0: 0, y1: ymax, title: s("rmsT"), xl: ["0", String(Math.max(10, n - 1))], yl: ["0", "0.3"] });
    g.textAlign = "left"; g.fillStyle = C.a; g.fillText("— TD(0)", 310, 225); g.fillStyle = C.gold; g.fillText("— Monte Carlo", 370, 225);
    info.innerHTML = ""; info.append(H("b", {}, s("episodes") + " " + st.ep), " · RMS TD " + fmt3(rms("td")) + " · RMS MC " + fmt3(rms("mc")) + " (" + s("avg20") + ")"); api.refreshTasks(); }
  reset(); draw();
  return { check(id) { const t = rms("td"), m = rms("mc");
      if (id === "t1") return t < .08;
      if (id === "t2") return m < .08;
      if (id === "t3") return st.aT >= .5 && st.ep >= 100 && t > .1;
      if (id === "t4") return Math.abs(st.aT - st.aM) < .001 && st.aT <= .1 && st.ep >= 50 && t < m;
      return false; },
    state() { return { alphaTD: st.aT, alphaMC: st.aM, episodes: st.ep, rmsTD: +fmt3(rms("td")), rmsMC: +fmt3(rms("mc")), trueValues: "1/6..5/6", runsAveraged: R }; }, destroy() {} };
} };

/* =====================================================================
   RL 4. Q-LEARNING × SARSA - o penhasco
   ===================================================================== */
SIMS.cliff = { mount(el, api) {
  const s = api.s, RW = 4, CL = 12, A = [[-1, 0], [1, 0], [0, -1], [0, 1]], START = [3, 0], GOAL = [3, 11];
  const st = { eps: .1, alpha: .5, ep: 0, seed: 1 };
  const isCliff = (r, c) => r === 3 && c >= 1 && c <= 10;
  function reset() { st.Q = { q: Array.from({ length: 48 }, () => [0, 0, 0, 0]), s: Array.from({ length: 48 }, () => [0, 0, 0, 0]) }; st.rew = { q: [], s: [] }; st.ep = 0; st.r = seeded(st.seed); st.maxEps = 0; }
  const step = (p, a) => { let r = Math.max(0, Math.min(RW - 1, p[0] + A[a][0])), c = Math.max(0, Math.min(CL - 1, p[1] + A[a][1])); if (isCliff(r, c)) return { p: [...START], rew: -100 }; return { p: [r, c], rew: -1 }; };
  const idx = p => p[0] * CL + p[1];
  const greedyA = (Q, p) => { const q = Q[idx(p)], m = Math.max(...q), best = [0, 1, 2, 3].filter(a => q[a] === m); return best[Math.floor(st.r() * best.length)]; };
  const pick = (Q, p) => st.r() < st.eps ? Math.floor(st.r() * 4) : greedyA(Q, p);
  function run(n) { st.maxEps = Math.max(st.maxEps, st.eps); for (let e = 0; e < n; e++) { for (const alg of ["q", "s"]) { const Q = st.Q[alg]; let p = [...START], a = pick(Q, p), tot = 0;
        for (let t = 0; t < 500; t++) { const o = step(p, a); tot += o.rew; const done = o.p[0] === GOAL[0] && o.p[1] === GOAL[1], a2 = pick(Q, o.p);
          const target = done ? o.rew : o.rew + (alg === "q" ? Math.max(...Q[idx(o.p)]) : Q[idx(o.p)][a2]);
          Q[idx(p)][a] += st.alpha * (target - Q[idx(p)][a]); if (done) break; p = o.p; a = a2; }
        st.rew[alg].push(tot); } st.ep++; } }
  function path(alg) { const Q = st.Q[alg]; let p = [...START]; const P = [p]; for (let t = 0; t < 60; t++) { const q = Q[idx(p)], a = q.indexOf(Math.max(...q)), o = step(p, a); if (o.rew === -100) return { P: [...P, "cliff"], ok: false }; p = o.p; P.push(p); if (p[0] === 3 && p[1] === 11) return { P, ok: true }; } return { P, ok: false }; }
  const avg = arr => { const l = arr.slice(-100); return l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0; };
  const cv = canvas(el, 560, 290), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(slider("ε", 0, .3, .01, st.eps, v => { st.eps = v; }, fmt2), slider("α", .05, 1, .05, st.alpha, v => { st.alpha = v; }, fmt2),
    H("div", { class: "row" }, btn("+10 " + s("ep"), () => { run(10); draw(); }), btn("+100 " + s("ep"), () => { run(100); draw(); }), btn(s("reset"), () => { st.seed++; reset(); draw(); }, "btn small ghost")), info);
  function draw() {
    const C = COL(), cs = 40, x0 = 20, y0 = 10; g.clearRect(0, 0, cv.w, cv.h);
    for (let r = 0; r < RW; r++) for (let c = 0; c < CL; c++) { g.fillStyle = isCliff(r, c) ? C.bad : C.surface; g.globalAlpha = isCliff(r, c) ? .5 : 1; g.fillRect(x0 + c * cs + 1, y0 + r * cs + 1, cs - 2, cs - 2); g.globalAlpha = 1; g.strokeStyle = C.line; g.strokeRect(x0 + c * cs + 1, y0 + r * cs + 1, cs - 2, cs - 2); }
    g.font = "18px sans-serif"; g.textAlign = "center"; g.fillText("🚩", x0 + 11 * cs + cs / 2, y0 + 3 * cs + 26); g.fillText("🤖", x0 + cs / 2, y0 + 3 * cs + 26);
    const draws = [["q", C.a, -5], ["s", C.gold, 5]], res = {};
    for (const [alg, col, off] of draws) { const pp = path(alg); res[alg] = pp; g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); pp.P.filter(p => p !== "cliff").forEach((p, i) => { const x = x0 + p[1] * cs + cs / 2 + off, y = y0 + p[0] * cs + cs / 2 + off; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.lineWidth = 1; }
    g.textAlign = "left"; g.font = "12px sans-serif"; g.fillStyle = C.a; g.fillText("— Q-learning: " + (res.q.ok ? (res.q.P.length - 1) + " " + s("steps") : s("noPath")) + " · " + s("online") + " " + avg(st.rew.q).toFixed(1), 20, 190);
    g.fillStyle = C.gold; g.fillText("— SARSA: " + (res.s.ok ? (res.s.P.length - 1) + " " + s("steps") : s("noPath")) + " · " + s("online") + " " + avg(st.rew.s).toFixed(1), 20, 208);
    const n = st.rew.q.length; if (n) { const sm = arr => arr.map((_, i) => { const l = arr.slice(Math.max(0, i - 19), i + 1); return [i, l.reduce((a, b) => a + b, 0) / l.length]; }); plot(g, 20, 218, 520, 64, [{ pts: sm(st.rew.q), col: C.a }, { pts: sm(st.rew.s), col: C.gold }], { x0: 0, x1: Math.max(10, n - 1), y0: -120, y1: 0, title: s("rewT") }); }
    st.res = res; info.innerHTML = ""; info.append(H("b", {}, s("episodes") + " " + st.ep), " · ε " + st.eps + " · α " + st.alpha); api.refreshTasks(); }
  reset(); draw();
  const safe = P => P.every(p => p === "cliff" || !(p[0] === 2 && p[1] >= 1 && p[1] <= 10));
  return { check(id) { const r = st.res;
      if (id === "q1") return r.q.ok && r.q.P.length - 1 === 13;
      if (id === "q2") return st.eps >= .05 && r.s.ok && safe(r.s.P) && r.s.P.length - 1 > 13;
      if (id === "q3") return st.eps >= .05 && st.ep >= 200 && avg(st.rew.s) > avg(st.rew.q);
      if (id === "q4") return st.ep > 0 && st.maxEps <= .01 && r.s.ok && r.s.P.length - 1 === 13;
      return false; },
    state() { return { epsilon: st.eps, alpha: st.alpha, episodes: st.ep, maxEpsilonSinceReset: st.maxEps, qLearningGreedyPathLength: st.res.q.ok ? st.res.q.P.length - 1 : null, sarsaGreedyPathLength: st.res.s.ok ? st.res.s.P.length - 1 : null, onlineAvgRewardLast100: { q: +avg(st.rew.q).toFixed(1), sarsa: +avg(st.rew.s).toFixed(1) } }; }, destroy() {} };
} };

/* =====================================================================
   RL 5. REINFORCE - linha de base e variância do gradiente
   ===================================================================== */
SIMS.reinforce = { mount(el, api) {
  const s = api.s, MU = [1, 2, 1.5];
  const st = { lr: .1, off: 0, base: false, beta: 0, seed: 1 };
  function reset() { st.th = [0, 0, 0]; st.n = 0; st.b = 0; st.r = seeded(st.seed); st.hist = [[0, 1 / 3]]; st.acc = { nb: [0, [0, 0, 0], 0], b: [0, [0, 0, 0], 0] }; }
  const pi = () => { const m = Math.max(...st.th), e = st.th.map(v => Math.exp(v - m)), z = e.reduce((a, b) => a + b, 0); return e.map(v => v / z); };
  const variance = k => { const [n, sum, sq] = st.acc[k]; if (n < 2) return 0; const m = sum.map(v => v / n); return sq / n - m.reduce((a, v) => a + v * v, 0); };
  function update(k) { for (let t = 0; t < k; t++) { const p = pi(), u = st.r(); let a = 0, c = p[0]; while (u > c && a < 2) c += p[++a];
      const R = MU[a] + st.off + gauss(st.r), grad = p.map((v, i) => (i === a ? 1 : 0) - v), gnb = grad.map(v => R * v), gb = grad.map(v => (R - st.b) * v);
      for (const [key, gg] of [["nb", gnb], ["b", gb]]) { const A = st.acc[key]; A[0]++; gg.forEach((v, i) => A[1][i] += v); A[2] += gg.reduce((x, v) => x + v * v, 0); }
      const H0 = -p.reduce((x, v) => x + v * Math.log(v + 1e-12), 0), gH = p.map(v => -v * (Math.log(v + 1e-12) + H0)), use = st.base ? gb : gnb;
      st.th = st.th.map((v, i) => v + st.lr * (use[i] + st.beta * gH[i])); st.n++; st.b += (R - st.b) / st.n; st.hist.push([st.n, pi()[1]]); } }
  const cv = canvas(el, 560, 260), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(slider("α", .01, 1, .01, st.lr, v => { st.lr = v; }, fmt2), slider(s("offset"), 0, 20, 1, st.off, v => { st.off = v; reset(); draw(); }),
    slider("β (" + s("entropy") + ")", 0, 2, .05, st.beta, v => { st.beta = v; }, fmt2),
    H("label", { class: "ctl chk" }, H("input", { type: "checkbox", onchange: e => { st.base = e.target.checked; reset(); draw(); } }), H("span", {}, s("baseline"))),
    H("div", { class: "row" }, btn("+10", () => { update(10); draw(); }), btn("+100", () => { update(100); draw(); }), btn(s("reset"), () => { st.seed++; reset(); draw(); }, "btn small ghost")), info);
  function draw() {
    const C = COL(), p = pi(); g.clearRect(0, 0, cv.w, cv.h);
    bars(g, 20, 40, 200, 180, p, s("arms").split(",").map((a, i) => a + " (μ=" + MU[i] + "+" + st.off + ")"), [C.b, C.ok, C.gold], { max: 1, fmt: v => Math.round(v * 100) + "%", title: "π(a)" });
    plot(g, 260, 10, 290, 150, [{ pts: st.hist, col: C.ok }, { pts: [[0, .9], [Math.max(10, st.n), .9]], col: C.muted, dash: [4, 4], w: 1 }], { x0: 0, x1: Math.max(10, st.n), y0: 0, y1: 1, title: s("pBestT") });
    const vn = variance("nb"), vb = variance("b"); g.fillStyle = C.ink; g.font = "13px sans-serif"; g.textAlign = "left";
    g.fillText(s("varNB") + ": " + (vn ? vn.toFixed(2) : "–"), 260, 190); g.fillText(s("varB") + ": " + (vb ? vb.toFixed(2) : "–"), 260, 210); g.fillText(s("ratio") + ": " + (vb ? (vn / vb).toFixed(1) + "×" : "–"), 260, 230);
    st.vn = vn; st.vb = vb; info.innerHTML = ""; info.append(H("b", {}, s("updates") + " " + st.n), " · π(" + s("best") + ") " + Math.round(p[1] * 100) + "% · b = " + st.b.toFixed(2)); api.refreshTasks(); }
  reset(); draw();
  return { check(id) { const p = pi();
      if (id === "g1") return p[1] >= .9;
      if (id === "g2") return st.off >= 10 && st.base && p[1] >= .9 && st.n <= 400;
      if (id === "g3") return st.off >= 10 && st.n >= 50 && st.vb > 0 && st.vn / st.vb >= 10;
      if (id === "g4") return st.beta > 0 && st.n >= 500 && Math.max(...p) <= .8 && Math.max(...p) >= .4;
      return false; },
    state() { const p = pi(); return { lr: st.lr, rewardOffset: st.off, baseline: st.base, entropyBeta: st.beta, updates: st.n, policy: p.map(v => +v.toFixed(3)), gradVarNoBaseline: +st.vn.toFixed(3), gradVarBaseline: +st.vb.toFixed(3) }; }, destroy() {} };
} };

/* =====================================================================
   RL 6. PPO - objetivo substituto com clipping
   ===================================================================== */
SIMS.ppo = { mount(el, api) {
  const s = api.s, st = { A: 1, eps: .2, r: 1 };
  const L = (r, A = st.A, e = st.eps) => Math.min(r * A, Math.max(1 - e, Math.min(1 + e, r)) * A);
  const grad = () => { const h = 1e-4; return (L(st.r + h) - L(st.r - h)) / (2 * h); };
  const cv = canvas(el, 560, 280), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(slider(s("adv") + " Â", -2, 2, .1, st.A, v => { st.A = v; draw(); }, v => v.toFixed(1)), slider("ε (clip)", .05, .5, .05, st.eps, v => { st.eps = v; draw(); }, fmt2), slider(s("ratio") + " r = π_new/π_old", 0, 2, .01, st.r, v => { st.r = v; draw(); }, fmt2), info);
  function draw() {
    const C = COL(), rs = Array.from({ length: 201 }, (_, i) => i / 100), ys = rs.map(r => L(r)), un = rs.map(r => r * st.A), lo = Math.min(...un, ...ys) - .2, hi = Math.max(...un, ...ys) + .2; g.clearRect(0, 0, cv.w, cv.h);
    const { X, Y } = plot(g, 40, 10, 500, 240, [{ pts: rs.map((r, i) => [r, un[i]]), col: C.muted, dash: [5, 4] }, { pts: rs.map((r, i) => [r, ys[i]]), col: C.b, w: 3 }], { x0: 0, x1: 2, y0: lo, y1: hi, title: s("objT"), xl: ["r = 0", "r = 2"] });
    g.fillStyle = C.gold; g.globalAlpha = .12; g.fillRect(X(1 - st.eps), 10, X(1 + st.eps) - X(1 - st.eps), 240); g.globalAlpha = 1;
    const gr = grad(); g.fillStyle = gr === 0 ? C.muted : C.bad; g.beginPath(); g.arc(X(st.r), Y(L(st.r)), 7, 0, 7); g.fill();
    if (Math.abs(gr) > 1e-9) { g.strokeStyle = C.bad; g.lineWidth = 2; const d = Math.sign(gr) * 30; g.beginPath(); g.moveTo(X(st.r), Y(L(st.r))); g.lineTo(X(st.r) + d, Y(L(st.r))); g.stroke(); g.lineWidth = 1; }
    st.g = gr; info.innerHTML = ""; info.append(H("b", {}, "L = min(r·Â, clip(r, 1−ε, 1+ε)·Â) = " + fmt2(L(st.r))), " · ∂L/∂r = " + fmt2(gr) + (Math.abs(gr) < 1e-9 ? " (" + s("zero") + ")" : "")); api.refreshTasks(); }
  draw();
  const outHi = () => st.r > 1 + st.eps + 1e-9, outLo = () => st.r < 1 - st.eps - 1e-9, z = () => Math.abs(st.g) < 1e-9;
  return { check(id) {
      if (id === "c1") return st.A > 0 && outHi() && z();
      if (id === "c2") return st.A < 0 && outLo() && z();
      if (id === "c3") return st.A > 0 && outLo() && !z();
      if (id === "c4") return st.A < 0 && outHi() && !z();
      return false; },
    state() { return { advantage: st.A, epsilon: st.eps, ratio: st.r, objective: +fmt3(L(st.r)), gradient: +fmt3(st.g), clipRegion: [1 - st.eps, 1 + st.eps] }; }, destroy() {} };
} };

/* =====================================================================
   RL 7. GAE - o botão λ entre viés e variância
   ===================================================================== */
SIMS.gae = { mount(el, api) {
  const s = api.s, T = 10, E = (() => { const r = seeded(21); return Array.from({ length: T }, () => (r() < .5 ? -1 : 1) * (.6 + .4 * r())).concat([0]); })();
  const st = { gamma: .95, lam: .5, bias: .6, sig: .3, seed: 1 };
  const Vs = () => Array.from({ length: T + 1 }, (_, t) => t === T ? 0 : Math.pow(st.gamma, T - 1 - t));
  const Vh = () => Vs().map((v, t) => t === T ? 0 : v + st.bias * E[t]);
  /* alvo: retorno esperado − V̂(s_0) (o V̂ do estado inicial é linha de base e não enviesa o gradiente); o viés vem de V̂ dos estados futuros */
  function mse(lam) { const V = Vh(); let e = 0, v = 0, G = 0; for (let l = 0; l < T; l++) { const w = Math.pow(st.gamma * lam, l), rTrue = l === T - 1 ? 1 : 0; e += w * (rTrue + st.gamma * V[l + 1] - V[l]); v += w * w * st.sig * st.sig; G += Math.pow(st.gamma, l) * rTrue; } const b = e - (G - V[0]); return { bias: b, var: v, mse: b * b + v }; }
  function sample() { const r = seeded(st.seed), V = Vh(), rw = Array.from({ length: T }, (_, t) => (t === T - 1 ? 1 : 0) + gauss(r) * st.sig), d = rw.map((x, t) => x + st.gamma * V[t + 1] - V[t]), A = new Array(T).fill(0); let acc = 0; for (let t = T - 1; t >= 0; t--) { acc = d[t] + st.gamma * st.lam * acc; A[t] = acc; } return { d, A }; }
  const cv = canvas(el, 560, 280), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(slider("λ", 0, 1, .01, st.lam, v => { st.lam = v; draw(); }, fmt2), slider("γ", .8, 1, .01, st.gamma, v => { st.gamma = v; draw(); }, fmt2),
    slider(s("critic"), 0, 1, .05, st.bias, v => { st.bias = v; draw(); }, fmt2), slider(s("noise"), 0, .5, .05, st.sig, v => { st.sig = v; draw(); }, fmt2),
    H("div", { class: "row" }, btn(s("resample"), () => { st.seed++; draw(); }, "btn small ghost")), info);
  function draw() {
    const C = COL(), ls = Array.from({ length: 101 }, (_, i) => i / 100), M = ls.map(mse), best = ls[M.reduce((bi, m, i) => m.mse < M[bi].mse ? i : bi, 0)], smp = sample(); g.clearRect(0, 0, cv.w, cv.h);
    const mx = Math.max(...M.map(m => m.mse)) * 1.1 || 1;
    plot(g, 30, 10, 250, 230, [{ pts: ls.map((l, i) => [l, M[i].bias ** 2]), col: C.gold }, { pts: ls.map((l, i) => [l, M[i].var]), col: C.b }, { pts: ls.map((l, i) => [l, M[i].mse]), col: C.bad, w: 3 }, { pts: [[st.lam, mse(st.lam).mse]], col: C.ink, dots: true, r: 5 }], { x0: 0, x1: 1, y0: 0, y1: mx, title: s("mseT"), xl: ["λ=0", "λ=1"] });
    g.font = "11px sans-serif"; g.textAlign = "left"; g.fillStyle = C.gold; g.fillText("— " + s("bias2"), 40, 232); g.fillStyle = C.b; g.fillText("— " + s("varL"), 110, 232); g.fillStyle = C.bad; g.fillText("— MSE", 190, 232);
    const mm = Math.max(1, ...smp.d.map(Math.abs), ...smp.A.map(Math.abs));
    bars(g, 310, 30, 240, 90, smp.d, null, C.muted, { max: mm, min: -mm, fmt: () => "", title: "δ_t" }); bars(g, 310, 160, 240, 90, smp.A, null, C.b, { max: mm, min: -mm, fmt: () => "", title: "Â_t (GAE)" });
    st.best = best; info.innerHTML = ""; info.append(H("b", {}, "λ " + st.lam.toFixed(2) + " · " + s("bestL") + " " + best.toFixed(2)), " · Â_0 = " + fmt3(smp.A[0]) + " · δ_0 = " + fmt3(smp.d[0])); api.refreshTasks(); }
  draw();
  return { check(id) {
      if (id === "l1") return st.lam <= .001;
      if (id === "l2") return st.lam >= .999;
      if (id === "l3") return st.bias >= .4 && st.sig >= .2 && st.best > .05 && st.best < .95 && Math.abs(st.lam - st.best) <= .1;
      if (id === "l4") return st.bias === 0 && st.sig >= .2 && st.lam <= .05;
      return false; },
    state() { const m = mse(st.lam); return { lambda: st.lam, gamma: st.gamma, criticError: st.bias, rewardNoise: st.sig, bias2: +fmt3(m.bias ** 2), variance: +fmt3(m.var), mse: +fmt3(m.mse), bestLambda: st.best }; }, destroy() {} };
} };

/* =====================================================================
   RL 8. BRADLEY–TERRY e RLHF - preferências, modelo de recompensa, KL
   ===================================================================== */
SIMS.rlhf = { mount(el, api) {
  const s = api.s, Q = [2, 1.2, .6, 0, -.6, -1.4], REF = [.05, .1, .2, .3, .2, .15], N = 6, LB = "ABCDEF".split("");
  const st = { noise: .5, beta: 1, seed: 1 };
  function reset() { st.cmp = []; st.r = seeded(st.seed); st.rh = new Array(N).fill(0); }
  function collect(k) { for (let t = 0; t < k; t++) { const i = Math.floor(st.r() * N); let j = Math.floor(st.r() * (N - 1)); if (j >= i) j++; const p = 1 / (1 + Math.exp(-(Q[i] - Q[j]) / st.noise)); st.cmp.push(st.r() < p ? [i, j] : [j, i]); } fit(); }
  function fit() { const r = new Array(N).fill(0); for (let it = 0; it < 400; it++) { const gr = r.map(v => -.02 * v); for (const [w, l] of st.cmp) { const p = 1 / (1 + Math.exp(-(r[w] - r[l]))); gr[w] += 1 - p; gr[l] -= 1 - p; } for (let i = 0; i < N; i++) r[i] += .5 * gr[i] / Math.max(1, st.cmp.length / 10); } const m = r.reduce((a, b) => a + b, 0) / N; st.rh = r.map(v => v - m); }
  const pol = () => { const l = REF.map((p, i) => Math.log(p) + st.rh[i] / st.beta), m = Math.max(...l), e = l.map(v => Math.exp(v - m)), z = e.reduce((a, b) => a + b, 0); return e.map(v => v / z); };
  const kl = p => p.reduce((a, v, i) => a + (v > 0 ? v * Math.log(v / REF[i]) : 0), 0), EQ = p => p.reduce((a, v, i) => a + v * Q[i], 0);
  const kendall = () => { let c = 0, d = 0; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const x = Math.sign(Q[i] - Q[j]) * Math.sign(st.rh[i] - st.rh[j]); if (x > 0) c++; else if (x < 0) d++; } return (c - d) / (N * (N - 1) / 2); };
  const cv = canvas(el, 560, 270), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(slider(s("noise"), .2, 3, .1, st.noise, v => { st.noise = v; }, v => v.toFixed(1)), slider("β (KL)", .01, 3, .01, st.beta, v => { st.beta = v; draw(); }, fmt2),
    H("div", { class: "row" }, btn("+5 " + s("cmp"), () => { collect(5); draw(); }), btn("+20 " + s("cmp"), () => { collect(20); draw(); }), btn(s("reset"), () => { st.seed++; reset(); draw(); }, "btn small ghost")), H("p", { class: "empty" }, s("tip")), info);
  function draw() {
    const C = COL(), p = pol(); g.clearRect(0, 0, cv.w, cv.h);
    const mq = Math.max(2.2, ...st.rh.map(Math.abs)) * 1.1; bars(g, 20, 30, 250, 90, Q, null, C.muted, { max: 2.4, min: -2.4, title: s("trueQ") }); bars(g, 20, 160, 250, 90, st.rh, LB, C.b, { max: mq, min: -mq, title: s("rhat") });
    bars(g, 300, 30, 250, 80, REF, null, C.muted, { max: 1, fmt: v => Math.round(v * 100) + "%", title: "π_ref" }); bars(g, 300, 160, 250, 90, p, LB, C.ok, { max: 1, fmt: v => Math.round(v * 100) + "%", title: "π ∝ π_ref · exp(r̂/β)" });
    st.p = p; st.kl = kl(p); st.eq = EQ(p); st.tau = kendall(); const rr = Math.max(...st.rh) - Math.min(...st.rh);
    info.innerHTML = ""; info.append(H("b", {}, s("cmp") + " " + st.cmp.length + " · τ Kendall " + st.tau.toFixed(2)), " · KL " + st.kl.toFixed(2) + " · E[q] π " + st.eq.toFixed(2) + " (ref " + EQ(REF).toFixed(2) + ") · " + s("range") + " r̂ " + rr.toFixed(2)); api.refreshTasks(); }
  reset(); draw();
  return { check(id) { const rr = Math.max(...st.rh) - Math.min(...st.rh);
      if (id === "h1") return st.cmp.length >= 30 && st.tau >= .8;
      if (id === "h2") return st.cmp.length >= 10 && st.kl <= .3 && st.eq >= EQ(REF) + .5;
      if (id === "h3") return st.cmp.length >= 10 && st.beta <= .05 && st.kl >= 1.5;
      if (id === "h4") return st.noise >= 2 && st.cmp.length >= 60 && rr < .6 * 3.4;
      return false; },
    state() { return { comparisons: st.cmp.length, annotatorNoise: st.noise, beta: st.beta, rewardModel: st.rh.map(v => +v.toFixed(2)), trueQuality: Q, kendallTau: +st.tau.toFixed(2), policy: st.p.map(v => +v.toFixed(3)), KL: +st.kl.toFixed(3), expectedTrueQuality: +st.eq.toFixed(2), refExpectedQuality: +EQ(REF).toFixed(2) }; }, destroy() {} };
} };

/* =====================================================================
   RL 9. BANDIDOS - guloso, ε-guloso e UCB, arrependimento médio
   ===================================================================== */
SIMS.bandit = { mount(el, api) {
  const s = api.s, MU = [.2, .5, .9, 1.2, 1], K = 5, T = 1000, RUNS = 200, best = Math.max(...MU);
  const st = { alg: "greedy", eps: .1, c: 2, hist: [] };
  function run() { const r = seeded(7 + st.hist.length), reg = new Array(T).fill(0), opt = new Array(T).fill(0);
    for (let k = 0; k < RUNS; k++) { const q = new Array(K).fill(0), n = new Array(K).fill(0); let R = 0;
      for (let t = 0; t < T; t++) { let a;
        if (st.alg === "ucb") { a = n.indexOf(0); if (a < 0) { let bv = -Infinity; for (let i = 0; i < K; i++) { const v = q[i] + st.c * Math.sqrt(Math.log(t + 1) / n[i]); if (v > bv) { bv = v; a = i; } } } }
        else if (st.alg === "eps" && r() < st.eps) a = Math.floor(r() * K);
        else { const m = Math.max(...q), b = q.map((v, i) => v === m ? i : -1).filter(i => i >= 0); a = b[Math.floor(r() * b.length)]; }
        const x = MU[a] + gauss(r); n[a]++; q[a] += (x - q[a]) / n[a]; R += best - MU[a]; reg[t] += R / RUNS; if (a === 3) opt[t] += 1 / RUNS; } }
    const lab = st.alg === "greedy" ? s("greedy") : st.alg === "eps" ? "ε-" + s("greedy").toLowerCase() + " ε=" + st.eps : "UCB c=" + st.c;
    st.hist.push({ alg: st.alg, eps: st.eps, c: st.c, lab, reg, regret: reg[T - 1], opt: opt.slice(-100).reduce((a, b) => a + b, 0) / 100 }); if (st.hist.length > 6) st.hist.shift(); }
  const cv = canvas(el, 560, 280), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(select(s("alg"), [["greedy", s("greedy")], ["eps", "ε-" + s("greedy").toLowerCase()], ["ucb", "UCB"]], "greedy", v => { st.alg = v; }), slider("ε", 0, .5, .01, st.eps, v => { st.eps = v; }, fmt2), slider("c (UCB)", 0, 10, .1, st.c, v => { st.c = v; }, v => v.toFixed(1)),
    H("div", { class: "row" }, btn(s("run"), () => { run(); draw(); }), btn(s("clear"), () => { st.hist = []; draw(); }, "btn small ghost")), info);
  function draw() {
    const C = COL(), cols = [C.bad, C.gold, C.a, C.b, C.ok, C.muted]; g.clearRect(0, 0, cv.w, cv.h);
    const mx = Math.max(50, ...st.hist.map(h => h.regret)) * 1.05;
    plot(g, 40, 10, 270, 250, st.hist.map((h, i) => ({ pts: h.reg.filter((_, t) => t % 5 === 0).map((v, j) => [j * 5, v]), col: cols[i % 6] })), { x0: 0, x1: T, y0: 0, y1: mx, title: s("regT"), xl: ["t=0", "t=1000"] });
    g.font = "12px sans-serif"; g.textAlign = "left"; st.hist.forEach((h, i) => { g.fillStyle = cols[i % 6]; g.fillText("■ " + h.lab, 325, 24 + i * 42); g.fillStyle = C.muted; g.font = "11px sans-serif"; g.fillText(s("regretL") + " " + h.regret.toFixed(1), 337, 38 + i * 42); g.fillText(s("optL") + " " + Math.round(h.opt * 100) + "%", 337, 51 + i * 42); g.font = "12px sans-serif"; });
    if (!st.hist.length) { g.fillStyle = C.muted; g.fillText(s("empty"), 325, 40); }
    info.innerHTML = ""; info.append(H("b", {}, s("arms") + " μ = " + MU.join(", ")), " · " + RUNS + " " + s("runs") + " × " + T + " " + s("stepsL")); api.refreshTasks(); }
  draw();
  const H_ = () => st.hist, of = (a, f) => H_().filter(h => h.alg === a && (!f || f(h)));
  return { check(id) { const last = H_()[H_().length - 1];
      if (id === "b1") return !!last && last.alg === "greedy" && last.opt < .6;
      if (id === "b2") { const gr = of("greedy"); return gr.length && of("eps", h => h.eps >= .05 && h.eps <= .2 && h.regret < Math.min(...gr.map(x => x.regret))).length > 0; }
      if (id === "b3") { const e = of("eps"); return e.length && of("ucb", h => h.regret < Math.min(...e.map(x => x.regret))).length > 0; }
      if (id === "b4") { const lo = of("ucb", h => h.c <= 2); return lo.length && of("ucb", h => h.c >= 5 && h.regret > Math.min(...lo.map(x => x.regret))).length > 0; }
      return false; },
    state() { return { means: MU, runs: st.hist.map(h => ({ algorithm: h.lab, finalRegret: +h.regret.toFixed(1), optimalArmShareLast100: +h.opt.toFixed(2) })) }; }, destroy() {} };
} };

/* =====================================================================
   RL 10. HOEFFDING - quantas puxadas para separar dois braços
   ===================================================================== */
SIMS.hoeffding = { mount(el, api) {
  const s = api.s, st = { gap: .3, delta: .05, seed: 1, ans: "" };
  function reset() { st.r = seeded(st.seed); st.n = [0, 0]; st.sum = [0, 0]; }
  const p = () => [.5 + st.gap / 2, .5 - st.gap / 2];
  const hw = n => n ? Math.sqrt(Math.log(2 / st.delta) / (2 * n)) : Infinity;
  function pull(k) { const P = p(); for (let t = 0; t < k; t++) for (let a = 0; a < 2; a++) { st.n[a]++; st.sum[a] += st.r() < P[a] ? 1 : 0; } }
  const mean = a => st.n[a] ? st.sum[a] / st.n[a] : .5, sep = () => st.n[0] > 0 && mean(0) - hw(st.n[0]) > mean(1) + hw(st.n[1]);
  const cv = canvas(el, 560, 230), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  const inp = H("input", { type: "number", placeholder: "n", oninput: e => { st.ans = e.target.value; api.refreshTasks(); } });
  ctl.append(slider(s("gap") + " Δ", .02, .6, .01, st.gap, v => { st.gap = v; reset(); draw(); }, fmt2), slider("δ", .005, .2, .005, st.delta, v => { st.delta = v; draw(); }, v => v.toFixed(3)),
    H("div", { class: "row" }, btn("+10 " + s("each"), () => { pull(10); draw(); }), btn("+100 " + s("each"), () => { pull(100); draw(); }), btn(s("reset"), () => { st.seed++; reset(); draw(); }, "btn small ghost")),
    H("label", { class: "ctl" }, H("span", {}, s("askN")), inp), info);
  function draw() {
    const C = COL(), X = v => 30 + v * 500; g.clearRect(0, 0, cv.w, cv.h);
    g.strokeStyle = C.line; g.beginPath(); g.moveTo(X(0), 200); g.lineTo(X(1), 200); g.stroke(); g.fillStyle = C.muted; g.font = "11px sans-serif"; g.textAlign = "center"; for (let v = 0; v <= 1; v += .25) g.fillText(v.toFixed(2), X(v), 215);
    [0, 1].forEach(a => { const y = 60 + a * 70, m = mean(a), h = Math.min(1, hw(st.n[a])), col = a ? C.gold : C.b; g.fillStyle = col; g.globalAlpha = .25; g.fillRect(X(Math.max(0, m - h)), y - 14, X(Math.min(1, m + h)) - X(Math.max(0, m - h)), 28); g.globalAlpha = 1;
      g.fillRect(X(m) - 2, y - 16, 4, 32); g.strokeStyle = C.ink; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(p()[a]), y - 22); g.lineTo(X(p()[a]), y + 22); g.stroke(); g.setLineDash([]);
      g.fillStyle = C.ink; g.textAlign = "left"; g.font = "12px sans-serif"; g.fillText(s("arm") + " " + (a + 1) + ": n = " + st.n[a] + " · μ̂ = " + fmt3(m) + " ± " + (isFinite(hw(st.n[a])) ? fmt3(hw(st.n[a])) : "∞"), 30, y - 22); });
    info.innerHTML = ""; info.append(H("b", {}, sep() ? s("separated") : s("overlap")), " · ± √(ln(2/δ) / 2n)"); api.refreshTasks(); }
  reset(); draw();
  return { check(id) {
      if (id === "s1") return st.gap >= .2 && sep();
      if (id === "s2") return st.gap <= .1 && sep();
      if (id === "s3") { const n = parseFloat(st.ans); return Math.abs(n - 738) / 738 <= .05; }
      if (id === "s4") return st.delta <= .01 && st.gap >= .3 && sep() && st.n[0] <= 200;
      return false; },
    state() { return { gap: st.gap, delta: st.delta, pulls: st.n, means: [+fmt3(mean(0)), +fmt3(mean(1))], halfWidths: [hw(st.n[0]), hw(st.n[1])].map(v => isFinite(v) ? +fmt3(v) : null), separated: sep(), studentAnswerN: st.ans }; }, destroy() {} };
} };

/* =====================================================================
   RL 11. THOMPSON SAMPLING - posteriores Beta
   ===================================================================== */
function gammaS(k, r) { if (k < 1) return gammaS(k + 1, r) * Math.pow(r(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); while (true) { let x, v; do { x = gauss(r); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = r(); if (u < 1 - .0331 * x ** 4 || Math.log(u) < .5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
const betaS = (a, b, r) => { const x = gammaS(a, r), y = gammaS(b, r); return x / (x + y); };
SIMS.thompson = { mount(el, api) {
  const s = api.s, PR = { easy: [.3, .5, .6], close: [.5, .53, .56] };
  const st = { pre: "easy", seed: 1, cmp: null };
  function reset() { st.a = [1, 1, 1]; st.b = [1, 1, 1]; st.nT = [0, 0, 0]; st.nM = [0, 0, 0]; st.r = mb32(st.seed); }
  const P = () => PR[st.pre];
  function pull(a, man) { const x = st.r() < P()[a] ? 1 : 0; st.a[a] += x; st.b[a] += 1 - x; (man ? st.nM : st.nT)[a]++; }
  function ts(k) { for (let t = 0; t < k; t++) { const smp = [0, 1, 2].map(i => betaS(st.a[i], st.b[i], st.r)); pull(smp.indexOf(Math.max(...smp)), false); } }
  function pBest() { const r = mb32(99), c = [0, 0, 0]; for (let t = 0; t < 2000; t++) { const x = [0, 1, 2].map(i => betaS(st.a[i], st.b[i], r)); c[x.indexOf(Math.max(...x))]++; } return c.map(v => v / 2000); }
  function compare() { const r = mb32(123), res = { ts: 0, greedy: 0 }, pp = P(), best = Math.max(...pp);
    for (const m of ["ts", "greedy"]) for (let k = 0; k < 50; k++) { const a = [1, 1, 1], b = [1, 1, 1]; for (let t = 0; t < 500; t++) { let i; if (m === "ts") { const x = [0, 1, 2].map(j => betaS(a[j], b[j], r)); i = x.indexOf(Math.max(...x)); } else { const x = [0, 1, 2].map(j => a[j] / (a[j] + b[j]) + 1e-9 * r()); i = x.indexOf(Math.max(...x)); } const y = r() < pp[i] ? 1 : 0; a[i] += y; b[i] += 1 - y; res[m] += (best - pp[i]) / 50; } }
    st.cmp = res; }
  const cv = canvas(el, 560, 260), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(select(s("preset"), [["easy", s("easy") + " (0.30 / 0.50 / 0.60)"], ["close", s("close") + " (0.50 / 0.53 / 0.56)"]], "easy", v => { st.pre = v; reset(); draw(); }),
    H("div", { class: "row" }, btn("Thompson +1", () => { ts(1); draw(); }), btn("+50", () => { ts(50); draw(); }), btn("+500", () => { ts(500); draw(); }), btn(s("reset"), () => { st.seed++; reset(); draw(); }, "btn small ghost")),
    H("div", { class: "row" }, H("span", { class: "empty" }, s("manual")), ...[0, 1, 2].map(i => btn(s("arm") + " " + (i + 1), () => { pull(i, true); draw(); }, "btn small ghost")), btn(s("compare"), () => { compare(); draw(); }, "btn small ghost")), info);
  function draw() {
    const C = COL(), cols = [C.b, C.gold, C.ok], xs = Array.from({ length: 101 }, (_, i) => i / 100); g.clearRect(0, 0, cv.w, cv.h);
    const lb = (a, b) => { const lg = z => { let x = z, s0 = 0; while (x < 7) { s0 -= Math.log(x); x++; } return s0 + (x - .5) * Math.log(x) - x + .5 * Math.log(2 * Math.PI) + 1 / (12 * x); }; return lg(a) + lg(b) - lg(a + b); };
    const dens = (a, b) => xs.map(x => [x, x <= 0 || x >= 1 ? 0 : Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - lb(a, b))]);
    const D = [0, 1, 2].map(i => dens(st.a[i], st.b[i])), mx = Math.min(40, Math.max(3, ...D.flat().map(p => p[1])));
    const { X } = plot(g, 20, 10, 330, 230, D.map((d, i) => ({ pts: d.map(([x, y]) => [x, Math.min(y, mx)]), col: cols[i], w: 2.5 })), { x0: 0, x1: 1, y0: 0, y1: mx * 1.05, title: s("postT"), xl: ["0", "1"] });
    P().forEach((p, i) => { g.strokeStyle = cols[i]; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(p), 10); g.lineTo(X(p), 240); g.stroke(); g.setLineDash([]); });
    const pb = pBest(); st.pb = pb; g.font = "12px sans-serif"; g.textAlign = "left";
    [0, 1, 2].forEach(i => { g.fillStyle = cols[i]; g.fillText(s("arm") + " " + (i + 1) + ": Beta(" + st.a[i] + ", " + st.b[i] + ")", 370, 30 + i * 46); g.fillStyle = C.muted; g.fillText("TS " + st.nT[i] + " · " + s("man") + " " + st.nM[i] + " · P(" + s("best") + ") " + Math.round(pb[i] * 100) + "%", 370, 46 + i * 46); });
    if (st.cmp) { g.fillStyle = C.ink; g.fillText(s("cmpRes") + ": TS " + st.cmp.ts.toFixed(1) + " · " + s("greedyL") + " " + st.cmp.greedy.toFixed(1), 370, 190); }
    const tot = st.nT.reduce((a, b) => a + b, 0); info.innerHTML = ""; info.append(H("b", {}, "Thompson: " + tot + " " + s("pulls")), tot ? " · " + s("shareBest") + " " + Math.round(100 * st.nT[2] / tot) + "%" : ""); api.refreshTasks(); }
  reset(); draw();
  return { check(id) { const tot = st.nT.reduce((a, b) => a + b, 0);
      if (id === "t1") return st.pre === "easy" && tot >= 200 && st.nT[2] / tot >= .7;
      if (id === "t2") return st.nM[0] >= 20 && Math.abs(st.a[0] / (st.a[0] + st.b[0]) - P()[0]) < .05;
      if (id === "t3") return st.pre === "close" && st.pb[2] >= .9;
      if (id === "t4") return !!st.cmp && st.cmp.ts < st.cmp.greedy;
      return false; },
    state() { return { preset: st.pre, trueP: P(), posteriors: [0, 1, 2].map(i => "Beta(" + st.a[i] + "," + st.b[i] + ")"), thompsonPulls: st.nT, manualPulls: st.nM, probBest: st.pb.map(v => +v.toFixed(2)), comparison: st.cmp }; }, destroy() {} };
} };

/* =====================================================================
   RL 12. RIVERSWIM - exploração profunda com bônus
   ===================================================================== */
SIMS.riverswim = { mount(el, api) {
  const s = api.s, N = 6, Hh = 20, G = .95;
  const st = { meth: "eps", eps: .1, beta: .5, seed: 1 };
  /* ε-guloso: Q-learning. Bônus: MBIE-EB — modelo empírico (contagens) + bônus β/√n, resolvido por iteração de valor a cada passo;
     pares (s,a) nunca tentados valem β/(1−γ) (otimismo). */
  function reset() { st.Q = Array.from({ length: N }, () => [0, 0]); st.n = Array.from({ length: N }, () => [0, 0]); st.T = Array.from({ length: N }, () => [new Array(N).fill(0), new Array(N).fill(0)]); st.R = Array.from({ length: N }, () => [0, 0]); st.visits = new Array(N).fill(0); st.ep = 0; st.ret = []; st.r = seeded(st.seed); if (st.meth === "bonus") plan(); }
  function plan() { const Q = st.Q; for (let it = 0; it < 150; it++) { const V = Q.map(q => Math.max(...q)); for (let x = 0; x < N; x++) for (let a = 0; a < 2; a++) { const n = st.n[x][a]; if (!n) { Q[x][a] = st.beta / (1 - G); continue; } let ev = 0; for (let y = 0; y < N; y++) ev += st.T[x][a][y] / n * V[y]; Q[x][a] = st.R[x][a] / n + st.beta / Math.sqrt(n) + G * ev; } } }
  function env(x, a) { const r = st.r; if (a === 0) return { x: Math.max(0, x - 1), rew: x === 0 ? .005 : 0 }; const u = r();
    if (x === N - 1) return u < .6 ? { x, rew: 1 } : { x: x - 1, rew: 0 }; if (x === 0) return u < .4 ? { x: 1, rew: 0 } : { x: 0, rew: 0 }; return u < .35 ? { x: x + 1, rew: 0 } : u < .95 ? { x, rew: 0 } : { x: x - 1, rew: 0 }; }
  function run(k) { const r = st.r; for (let e = 0; e < k; e++) { let x = 0, tot = 0;
      for (let t = 0; t < Hh; t++) { st.visits[x]++; let a; const q = st.Q[x];
        if (st.meth === "eps" && r() < st.eps) a = Math.floor(r() * 2); else a = Math.abs(q[0] - q[1]) < 1e-12 ? Math.floor(r() * 2) : q[0] > q[1] ? 0 : 1;
        const o = env(x, a); tot += o.rew; st.n[x][a]++;
        if (st.meth === "bonus") { st.T[x][a][o.x]++; st.R[x][a] += o.rew; plan(); } else q[a] += .1 * (o.rew + G * Math.max(...st.Q[o.x]) - q[a]);
        x = o.x; }
      st.ret.push(tot); st.ep++; } }
  const cv = canvas(el, 560, 190), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(select(s("method"), [["eps", "ε-" + s("greedy")], ["bonus", s("bonusM")]], "eps", v => { st.meth = v; reset(); draw(); }), slider("ε", 0, .5, .01, st.eps, v => { st.eps = v; }, fmt2), slider("β (" + s("bonus") + ")", 0, 2, .005, st.beta, v => { st.beta = v; }, v => v.toFixed(3)),
    H("div", { class: "row" }, btn("+50 " + s("ep"), () => { run(50); draw(); }), btn("+200 " + s("ep"), () => { run(200); draw(); }), btn(s("reset"), () => { st.seed++; reset(); draw(); }, "btn small ghost")), info);
  function draw() {
    const C = COL(), cw = 80, y = 60; g.clearRect(0, 0, cv.w, cv.h); const vm = Math.max(1, ...st.visits);
    for (let i = 0; i < N; i++) { const x = 20 + i * (cw + 8); g.fillStyle = C.sunken; g.fillRect(x, y, cw, 60); g.fillStyle = C.a; g.globalAlpha = .15 + .6 * Math.sqrt(st.visits[i] / vm); g.fillRect(x, y, cw, 60); g.globalAlpha = 1;
      g.fillStyle = C.ink; g.font = "bold 13px sans-serif"; g.textAlign = "center"; g.fillText("s" + i, x + cw / 2, y + 22); g.font = "12px monospace"; g.fillText(s("vis") + " " + st.visits[i], x + cw / 2, y + 42);
      const q = st.Q[i]; g.font = "22px sans-serif"; g.fillText(q[1] > q[0] ? "→" : q[0] > q[1] ? "←" : "·", x + cw / 2, y + 90); }
    g.font = "12px sans-serif"; g.fillStyle = C.gold; g.textAlign = "left"; g.fillText("r = 0.005 ←", 20, 40); g.textAlign = "right"; g.fillStyle = C.ok; g.fillText("→ r = 1", 20 + 5 * (cw + 8) + cw, 40);
    g.fillStyle = C.muted; g.textAlign = "left"; g.fillText(s("current"), 20, 180);
    const avg = st.ret.slice(-50).reduce((a, b) => a + b, 0) / Math.max(1, st.ret.slice(-50).length);
    info.innerHTML = ""; info.append(H("b", {}, s("episodes") + " " + st.ep + " · " + s("vis") + " s5 = " + st.visits[5]), " · " + s("avgRet") + " " + avg.toFixed(2)); api.refreshTasks(); }
  reset(); draw();
  const allRight = () => st.Q.slice(0, 5).every(q => q[1] > q[0]);
  return { check(id) {
      if (id === "x1") return st.meth === "eps" && st.eps >= .05 && st.ep >= 200 && st.visits[5] <= 2;
      if (id === "x2") return st.meth === "bonus" && st.visits[5] > 0;
      if (id === "x3") return st.meth === "bonus" && allRight();
      if (id === "x4") return st.meth === "bonus" && st.beta <= .01 && st.ep >= 200 && st.visits[5] === 0;
      return false; },
    state() { return { method: st.meth, epsilon: st.eps, bonusBeta: st.beta, episodes: st.ep, visits: st.visits, greedyPolicy: st.Q.map(q => q[1] > q[0] ? "R" : q[0] > q[1] ? "L" : "-").join(""), avgReturnLast50: +(st.ret.slice(-50).reduce((a, b) => a + b, 0) / Math.max(1, st.ret.slice(-50).length)).toFixed(3) }; }, destroy() {} };
} };

/* =====================================================================
   RL 13–14. JOGO DA VELHA: MCTS/UCT e AlphaZero (PUCT)
   ===================================================================== */
const TTT = {
  POS: { A: [1, 1, 0, -1, -1, 0, 0, 0, 0], B: [-1, -1, 0, 0, 1, 0, 0, 0, 1] }, BEST: { A: 2, B: 2 },
  LINES: [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]],
  win(b) { for (const [a, c, d] of TTT.LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a]; return b.includes(0) ? null : 0; },
  moves: b => b.map((v, i) => v ? -1 : i).filter(i => i >= 0),
  toMove: b => b.filter(v => v === 1).length > b.filter(v => v === -1).length ? -1 : 1,
  rollout(b, r) { b = [...b]; let p = TTT.toMove(b); while (TTT.win(b) === null) { const m = TTT.moves(b); b[m[Math.floor(r() * m.length)]] = p; p = -p; } return TTT.win(b); },
  node: (b, prior) => ({ b, p: TTT.toMove(b), N: 0, W: 0, kids: null, P: prior }),
  /* uma iteração; puct = null para UCT, ou {c, rootPrior} para AlphaZero */
  iterate(root, c, r, puct) { const path = [root]; let n = root;
    while (TTT.win(n.b) === null) {
      if (!n.kids) { n.kids = {}; const ms = TTT.moves(n.b); for (const m of ms) { const b = [...n.b]; b[m] = n.p; n.kids[m] = TTT.node(b, n === root && puct ? puct.rootPrior[m] : 1 / ms.length); } if (!puct) { const un = ms[Math.floor(r() * ms.length)]; n = n.kids[un]; path.push(n); break; } }
      const ks = Object.entries(n.kids), un = ks.filter(([, k]) => !k.N);
      if (!puct && un.length) { n = un[Math.floor(r() * un.length)][1]; path.push(n); break; }
      let best = null, bv = -Infinity; for (const [, k] of ks) { const q = k.N ? k.W / k.N : 0, v = puct ? q + puct.c * k.P * Math.sqrt(n.N + 1) / (1 + k.N) : q + c * Math.sqrt(Math.log(n.N) / k.N); if (v > bv + 1e-12 || (Math.abs(v - bv) <= 1e-12 && r() < .5)) { bv = v; best = k; } }
      n = best; path.push(n); if (puct && !n.N) break; }
    const w = TTT.win(n.b), res = w !== null ? w : TTT.rollout(n.b, r);
    for (const x of path) { x.N++; x.W += res * (-x.p); } },
  stats(root) { const o = {}; if (!root.kids) return o; for (const [m, k] of Object.entries(root.kids)) o[m] = { N: k.N, Q: k.N ? k.W / k.N : 0, P: k.P }; return o; },
  top(root) { const st = TTT.stats(root); let bm = null, bn = -1; for (const m in st) if (st[m].N > bn) { bn = st[m].N; bm = +m; } return bm; },
  draw(g, x0, y0, sz, b, st, best, C, showP) { const c = sz / 3; g.strokeStyle = C.ink; g.lineWidth = 2; for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(x0 + i * c, y0); g.lineTo(x0 + i * c, y0 + sz); g.moveTo(x0, y0 + i * c); g.lineTo(x0 + sz, y0 + i * c); g.stroke(); } g.lineWidth = 1;
    const tot = Object.values(st).reduce((a, v) => a + v.N, 0) || 1;
    for (let i = 0; i < 9; i++) { const cx = x0 + (i % 3) * c + c / 2, cy = y0 + Math.floor(i / 3) * c + c / 2; g.textAlign = "center";
      if (b[i]) { g.fillStyle = b[i] === 1 ? C.b : C.bad; g.font = "bold 44px sans-serif"; g.fillText(b[i] === 1 ? "X" : "O", cx, cy + 15); }
      else if (st[i]) { g.fillStyle = C.gold; g.globalAlpha = .15 + .7 * st[i].N / tot; g.fillRect(cx - c / 2 + 3, cy - c / 2 + 3, c - 6, c - 6); g.globalAlpha = 1; g.fillStyle = C.ink; g.font = (i === best ? "bold " : "") + "13px monospace";
        g.fillText("N " + st[i].N, cx, cy - 8); g.fillText("Q " + st[i].Q.toFixed(2), cx, cy + 8); if (showP) g.fillText("P " + st[i].P.toFixed(2), cx, cy + 24); } } }
};
SIMS.mcts = { mount(el, api) {
  const s = api.s, st = { pos: "A", c: 1.4, seed: 1 };
  function reset() { st.root = TTT.node([...TTT.POS[st.pos]]); st.it = 0; st.r = seeded(st.seed); }
  function iter(k) { for (let i = 0; i < k; i++) TTT.iterate(st.root, st.c, st.r, null); st.it += k; }
  const cv = canvas(el, 560, 280), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(select(s("pos"), [["A", s("posA")], ["B", s("posB")]], "A", v => { st.pos = v; reset(); draw(); }), slider("c (UCT)", 0, 3, .1, st.c, v => { st.c = v; reset(); draw(); }, v => v.toFixed(1)),
    H("div", { class: "row" }, btn("+10", () => { iter(10); draw(); }), btn("+100", () => { iter(100); draw(); }), btn("+1000", () => { iter(1000); draw(); }), btn(s("reset"), () => { st.seed++; reset(); draw(); }, "btn small ghost")), info);
  function draw() {
    const C = COL(), S0 = TTT.stats(st.root), best = TTT.top(st.root); g.clearRect(0, 0, cv.w, cv.h); TTT.draw(g, 20, 10, 255, st.root.b, S0, best, C, false);
    g.fillStyle = C.ink; g.font = "13px sans-serif"; g.textAlign = "left"; g.fillText(s("xmove"), 300, 30); g.fillText(s("iters") + ": " + st.it, 300, 60);
    g.fillText(s("topMove") + ": " + (best == null ? "–" : s("cell") + " " + best), 300, 90); g.fillStyle = C.muted; g.fillText("UCT: Q + c·√(ln N / n)", 300, 130); g.fillText(s("legend"), 300, 150);
    const tot = Object.values(S0).reduce((a, v) => a + v.N, 0) || 1; st.best = best; st.share = best == null ? 0 : S0[best].N / tot;
    info.innerHTML = ""; info.append(H("b", {}, s("topMove") + " " + (best == null ? "–" : best)), " · " + Math.round(st.share * 100) + "% " + s("ofVisits")); api.refreshTasks(); }
  reset(); draw();
  return { check(id) {
      if (id === "m1") return st.pos === "A" && st.it >= 100 && st.best === 2;
      if (id === "m2") return st.pos === "B" && st.it >= 100 && st.best === 2;
      if (id === "m3") return st.pos === "B" && st.it > 0 && st.it <= 20 && st.best !== 2;
      if (id === "m4") return st.pos === "A" && st.it >= 1000 && st.c >= 2.5 && st.share < .95;
      return false; },
    state() { return { position: st.pos, c: st.c, iterations: st.it, mostVisited: st.best, shareOfVisits: +st.share.toFixed(2), rootStats: TTT.stats(st.root), correctMove: 2 }; }, destroy() {} };
} };
SIMS.alphazero = { mount(el, api) {
  const s = api.s, NOISE = (() => { const r = seeded(31); return Array.from({ length: 9 }, () => r() * 1.2); })();
  const st = { q: 0, c: 1.5, seed: 1, trained: 0, custom: null, startBad: false };
  const legal = () => TTT.moves(TTT.POS.B);
  function prior() { if (st.custom) return st.custom; const ms = legal(), l = {}; for (const m of ms) l[m] = NOISE[m] + (m === 2 ? 3 * st.q : 0); const mx = Math.max(...Object.values(l)); let z = 0; for (const m of ms) { l[m] = Math.exp(l[m] - mx); z += l[m]; } for (const m of ms) l[m] /= z; return l; }
  function reset() { st.root = TTT.node([...TTT.POS.B]); st.sims = 0; st.r = seeded(st.seed); }
  function sim(k) { const P = prior(); for (let i = 0; i < k; i++) TTT.iterate(st.root, 0, st.r, { c: st.c, rootPrior: P }); st.sims += k; }
  function train() { if (!st.root.kids || !st.sims) return; if (!st.trained) st.startBad = st.q <= -.5; const P = prior(), S0 = TTT.stats(st.root), tot = Object.values(S0).reduce((a, v) => a + v.N, 0), np = {}; for (const m of legal()) np[m] = .5 * P[m] + .5 * (S0[m] ? S0[m].N / tot : 0); st.custom = np; st.trained++; reset(); }
  const cv = canvas(el, 560, 280), g = cv.g, ctl = H("div", { class: "ctls" }), info = H("div", { class: "siminfo" }); el.append(ctl);
  ctl.append(slider(s("netQ"), -1, 1, .05, st.q, v => { st.q = v; st.custom = null; st.trained = 0; reset(); draw(); }, fmt2), slider("c_puct", .1, 5, .1, st.c, v => { st.c = v; reset(); draw(); }, v => v.toFixed(1)),
    H("div", { class: "row" }, btn("+10 " + s("sims"), () => { sim(10); draw(); }), btn("+100", () => { sim(100); draw(); }), btn("+800", () => { sim(800); draw(); }), btn(s("reset"), () => { st.seed++; reset(); draw(); }, "btn small ghost")),
    H("div", { class: "row" }, btn("🔁 " + s("train"), () => { train(); draw(); })), H("p", { class: "empty" }, s("tip")), info);
  function draw() {
    const C = COL(), P = prior(), S0 = TTT.stats(st.root); legal().forEach(m => { if (!S0[m]) S0[m] = { N: 0, Q: 0, P: P[m] }; });
    const best = st.sims ? TTT.top(st.root) : null, pArg = +Object.keys(P).reduce((a, b) => P[a] > P[b] ? a : b); g.clearRect(0, 0, cv.w, cv.h); TTT.draw(g, 20, 10, 255, TTT.POS.B, S0, best, C, true);
    g.fillStyle = C.ink; g.font = "13px sans-serif"; g.textAlign = "left"; g.fillText(s("xmove"), 300, 30); g.fillText(s("simsL") + ": " + st.sims, 300, 58); g.fillText(s("netPick") + ": " + s("cell") + " " + pArg + " (P " + P[pArg].toFixed(2) + ")", 300, 86);
    g.fillText(s("searchPick") + ": " + (best == null ? "–" : s("cell") + " " + best), 300, 114); g.fillText(s("trainedL") + ": " + st.trained, 300, 142); g.fillStyle = C.muted; g.fillText("PUCT: Q + c·P·√N / (1 + n)", 300, 180);
    st.best = best; st.pArg = pArg; info.innerHTML = ""; info.append(H("b", {}, "P(" + s("cell") + " 2) = " + P[2].toFixed(2)), " · " + s("searchPick") + " " + (best == null ? "–" : best)); api.refreshTasks(); }
  reset(); draw();
  return { check(id) {
      if (id === "z1") return !st.custom && st.q >= .5 && st.sims > 0 && st.sims <= 50 && st.best === 2;
      if (id === "z2") return !st.custom && st.q <= -.8 && st.sims >= 800 && st.best === 2;
      if (id === "z3") return st.startBad && st.trained >= 3 && st.pArg === 2;
      if (id === "z4") return !st.custom && st.q <= -.8 && st.sims > 0 && st.sims <= 50 && st.best !== 2;
      return false; },
    state() { const P = prior(); return { networkQuality: st.q, cPuct: st.c, simulations: st.sims, prior: Object.fromEntries(Object.entries(P).map(([k, v]) => [k, +v.toFixed(2)])), searchChoice: st.best, networkChoice: st.pArg, selfPlayIterations: st.trained, correctMove: 2 }; }, destroy() {} };
} };
