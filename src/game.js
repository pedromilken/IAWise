/* IAWise - camada de jogo: economia de XP, dificuldade, loja e patentes. Derivada do DevWise. */

/* Modos. mult: multiplicador de XP; pen: XP perdido por verificação falha (x dificuldade da tarefa); hint: dicas liberadas? */
const MODES = {
  normal:  {mult:1,   pen:2,  hint:true},
  medio:   {mult:1.5, pen:4,  hint:true},
  dificil: {mult:2,   pen:6,  hint:false},
  hardcore:{mult:3,   pen:10, hint:false}
};
const MODE_ICON = {normal:"🌱", medio:"⚙️", dificil:"🔥", hardcore:"💀"};
const TASK_XP = {1:10, 2:20, 3:35};    // XP base por dificuldade da tarefa
const COMEBACK = 5;                    // bônus por acertar logo depois de um erro
const HINT_HALF = true;                // com dica, XP cai pela metade

/* Loja. kind: "power" (consumível) | "title" (cosmético, compra única). */
const SHOP = [
  {id:"shield", icon:"🛡️", kind:"power", cost:30},
  {id:"boost",  icon:"⚡",  kind:"power", cost:40},
  {id:"lens",   icon:"🔍",  kind:"power", cost:20},
  {id:"key",    icon:"🗝️", kind:"power", cost:60},
  {id:"tNeuron",icon:"🧠",  kind:"title", cost:80},
  {id:"tAgent", icon:"🤖",  kind:"title", cost:80},
  {id:"tOracle",icon:"🔮",  kind:"title", cost:250}
];

/* Patentes por XP acumulado. */
const ROLE_XP = [0, 120, 350, 700, 1200];
