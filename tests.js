/* Verificação de consistência: node tests.js */
const fs = require("fs"), vm = require("vm");
const ctx = { LANG: {} }; vm.createContext(ctx);
for (const f of ["data.js", "game.js", "lang-pt.js", "lang-en.js"]) vm.runInContext(fs.readFileSync("src/" + f, "utf8").replace(/^"use strict";/, "").replace(/^const /gm, "var "), ctx);
let bad = 0; const fail = m => { bad++; console.log("FALHA:", m); };
for (const lang of ["pt", "en"]) { const L = ctx.LANG[lang];
  for (const l of ctx.LESSONS) { const x = L.lessons[l.id]; if (!x || !x.name || !x.about) fail(lang + " " + l.id + " sem name/about");
    if (l.sim) { if (!x.story || !x.title || !x.theory || x.theory.length !== 3) fail(lang + " " + l.id + " sem história/3 conceitos");
      for (const tk of ctx.TASKS[l.sim]) if (!x.tasks || !x.tasks[tk.id] || !x.tasks[tk.id].t || !x.tasks[tk.id].h) fail(lang + " " + l.id + " tarefa " + tk.id + " sem texto/dica");
      if (!L.sims[l.sim]) fail(lang + " sem rótulos do simulador " + l.sim); } }
  for (const k in ctx.LANG.pt.ui) if (L.ui[k] === undefined) fail(lang + " ui." + k + " ausente");
  for (const s of ctx.SHOP) if (!L.game.shop[s.id]) fail(lang + " loja " + s.id); }
for (const l of ctx.LESSONS) for (const p of l.pre) if (!ctx.LESSONS.find(x => x.id === p)) fail("pré-requisito inexistente " + p);
const simsSrc = fs.readFileSync("src/sims.js", "utf8"); for (const s in ctx.TASKS) { if (!simsSrc.includes("SIMS." + s)) fail("simulador " + s + " não implementado"); for (const tk of ctx.TASKS[s]) if (!simsSrc.includes('"' + tk.id + '"')) fail("check da tarefa " + tk.id + " ausente"); }
console.log(bad ? bad + " falha(s)" : "OK: " + ctx.LESSONS.length + " fases, " + Object.values(ctx.TASKS).flat().length + " tarefas, 2 idiomas consistentes");
process.exit(bad ? 1 : 0);
