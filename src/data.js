"use strict";
/* IAWise - dados independentes de idioma natural.
   Textos ficam em src/lang-pt.js e src/lang-en.js. Estrutura derivada do DevWise (pedromilken/DevWise),
   com o conteúdo das disciplinas GBC073 (Inteligência Computacional) e GBC063 (Inteligência Artificial), UFU/FACOM. */
const LANG = {};

/* Dois mundos = as duas disciplinas. Cada um responde a uma pergunta-guia. */
const WORLDS = [
  {id:"nn", icon:"🧠", color:"nn"},   // GBC073: "Como construir máquinas que aprendem a partir de dados?"
  {id:"rl", icon:"🤖", color:"rl"}    // GBC063: "Como construir agentes que tomam boas decisões?"
];

/* Uma fase por aula. pre: fases que precisam de 60% de domínio; gate: XP acumulado exigido; sim: simulador (null = em construção).
   x,y: posição no mapa (SVG 640 x 420 por mundo). */
const LESSONS = [
  /* ---- Mundo 1: redes neurais e deep learning (GBC073) ---- */
  {id:"nn01", world:"nn", n:1, pre:[], gate:0, sim:"perceptron", x:60, y:70},
  {id:"nn02", world:"nn", n:2, pre:["nn01"], gate:60, sim:"represent", x:180, y:70},
  {id:"nn03", world:"nn", n:3, pre:["nn02"], gate:120, sim:"gradient", x:300, y:70},
  {id:"nn04", world:"nn", n:4, pre:["nn03"], gate:180, sim:"backprop", x:420, y:70},
  {id:"nn05", world:"nn", n:5, pre:["nn04"], gate:240, sim:"optimizers", x:540, y:70},
  {id:"nn06", world:"nn", n:6, pre:["nn05"], gate:300, sim:null, x:540, y:180},
  {id:"nn07", world:"nn", n:7, pre:["nn06"], gate:360, sim:null, x:420, y:180},
  {id:"nn08", world:"nn", n:8, pre:["nn07"], gate:420, sim:null, x:300, y:180},
  {id:"nn09", world:"nn", n:9, pre:["nn08"], gate:480, sim:null, x:180, y:180},
  {id:"nn10", world:"nn", n:10, pre:["nn09"], gate:540, sim:null, x:60, y:180},
  {id:"nn11", world:"nn", n:11, pre:["nn10"], gate:600, sim:null, x:60, y:290},
  {id:"nn12", world:"nn", n:12, pre:["nn11"], gate:660, sim:null, x:180, y:290},
  {id:"nn13", world:"nn", n:13, pre:["nn12"], gate:720, sim:null, x:300, y:290},
  {id:"nn14", world:"nn", n:14, pre:["nn13"], gate:780, sim:null, x:420, y:290},
  /* ---- Mundo 2: aprendizagem por reforço (GBC063) ---- */
  {id:"rl01", world:"rl", n:1, pre:[], gate:0, sim:"rover", x:60, y:70},
  {id:"rl02", world:"rl", n:2, pre:["rl01"], gate:60, sim:"gridworld", x:180, y:70},
  {id:"rl03", world:"rl", n:3, pre:["rl02"], gate:120, sim:null, x:300, y:70},
  {id:"rl04", world:"rl", n:4, pre:["rl03"], gate:180, sim:null, x:420, y:70},
  {id:"rl05", world:"rl", n:5, pre:["rl04"], gate:240, sim:null, x:540, y:70},
  {id:"rl06", world:"rl", n:6, pre:["rl05"], gate:300, sim:null, x:540, y:180},
  {id:"rl07", world:"rl", n:7, pre:["rl06"], gate:360, sim:null, x:420, y:180},
  {id:"rl08", world:"rl", n:8, pre:["rl07"], gate:420, sim:null, x:300, y:180},
  {id:"rl09", world:"rl", n:9, pre:["rl08"], gate:480, sim:null, x:180, y:180},
  {id:"rl10", world:"rl", n:10, pre:["rl09"], gate:540, sim:null, x:60, y:180},
  {id:"rl11", world:"rl", n:11, pre:["rl10"], gate:600, sim:null, x:60, y:290},
  {id:"rl12", world:"rl", n:12, pre:["rl11"], gate:660, sim:null, x:180, y:290},
  {id:"rl13", world:"rl", n:13, pre:["rl12"], gate:720, sim:null, x:300, y:290},
  {id:"rl14", world:"rl", n:14, pre:["rl13"], gate:780, sim:null, x:420, y:290}
];

/* Tarefas de cada simulador: são os "itens" do rastreamento do conhecimento.
   d: dificuldade autoral (1 a 3), c: probabilidade de acerto ao acaso (verificação de estado tem chute baixo).
   O texto de cada tarefa fica em lang-*.js em lessons[id].tasks[i]. A verificação vive em sims.js. */
const TASKS = {
  perceptron: [{id:"p1",d:1},{id:"p2",d:2},{id:"p3",d:2},{id:"p4",d:3}],
  represent:  [{id:"r1",d:1},{id:"r2",d:2},{id:"r3",d:2},{id:"r4",d:3}],
  gradient:   [{id:"g1",d:1},{id:"g2",d:2},{id:"g3",d:2},{id:"g4",d:3}],
  backprop:   [{id:"b1",d:1},{id:"b2",d:2},{id:"b3",d:3},{id:"b4",d:3}],
  optimizers: [{id:"o1",d:1},{id:"o2",d:2},{id:"o3",d:2},{id:"o4",d:3}],
  rover:      [{id:"m1",d:1},{id:"m2",d:2},{id:"m3",d:2},{id:"m4",d:3}],
  gridworld:  [{id:"w1",d:1},{id:"w2",d:2},{id:"w3",d:2},{id:"w4",d:3}]
};
const GUESS = 0.05;   // chute assumido numa verificação de estado do simulador
