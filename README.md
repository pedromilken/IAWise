# IAWise

Jogo instrutivo de **redes neurais** e **aprendizagem por reforço** com simuladores interativos, histórias de problemas reais, arsenal teórico e *knowledge tracing*. Derivado do [DevWise](https://github.com/pedromilken/DevWise) (mesma arquitetura, mesmo motor de rastreamento, mesma economia de XP), com o conteúdo das disciplinas abertas do Prof. Albertini (UFU/FACOM):

- **Mundo 1 — Máquinas que aprendem**: [GBC073 — Inteligência Computacional](https://github.com/albertiniufu/gbc073) · *Como construir máquinas que aprendem a partir de dados?*
- **Mundo 2 — Agentes que decidem**: [GBC063 — Inteligência Artificial](https://github.com/albertiniufu/gbc063) · *Como construir agentes que tomam boas decisões?*

Idiomas: **português** e **inglês**.

## Como funciona

Uma fase por aula (14 + 14 = 28). Cada fase segue três passos:

1. **História** — um cenário concreto (a fábrica que separa peças, o rover no cânion) que motiva o conceito.
2. **Arsenal teórico** — três conceitos essenciais com analogias práticas e a notação dos slides do curso.
3. **Simulador** — o núcleo do jogo. Em vez de questões de múltipla escolha, cada fase tem um simulador que roda no navegador (canvas puro, sem dependências) e **quatro tarefas verificáveis**: o estudante ajusta pesos, gradientes, políticas e recompensas até o simulador estar no estado pedido e clica em *Verificar*. Cada verificação (acerto ou erro) é um item para o modelo de rastreamento.

| Fase | Simulador | O que se manipula |
|---|---|---|
| NN 1 · Perceptron | `perceptron` | w₁, w₂, b, regra de aprendizado, AND/OR/aleatório/XOR |
| NN 2 · O que uma rede representa | `represent` | unidades ocultas, ReLU/tanh, alvo (|x|, seno, degrau, lombada), Adam |
| NN 3 · Aprendendo a rede I | `gradient` | perda L(w), gradiente, taxa de aprendizado, divergência, passo exato |
| NN 4 · Retropropagação | `backprop` | grafo computacional, derivadas locais digitadas, neurônio morto |
| NN 5 · Treinar é otimizar | `optimizers` | SGD × momento × Adam em tigela alongada e vale de Rosenbrock |
| RL 1 · Introdução à RL | `rover` | política por estado, γ, derrapagem, V^π por avaliação iterativa |
| RL 2 · Decisões com modelo | `gridworld` | iteração de valor 3×4, custo de viver, derrapagem, γ |

Toda fase tem uma aba **Material de apoio** com os slides (PDF) e, no mundo 2, o handout da aula, os simuladores do próprio professor quando existem, extras do repositório e leituras, vídeos e interativos complementares selecionados por assunto — acessível mesmo em fases bloqueadas ou ainda sem simulador.

As demais 21 fases já existem no mapa (nome, pré-requisito e portão de XP) e recebem história, arsenal e simulador nas próximas versões.

## Rastreamento e gamificação (herdados do DevWise)

- **Elo/Rasch** pilota o jogo: domínio por fase, 60% libera a próxima, 85% domina, confirmação em outro dia. **TRI 3PL (EAP), BKT, PFA e AFM** rodam como sombras e registram no log a previsão feita antes de cada verificação (aba Relatório mostra Brier, AUC e acurácia).
- XP por tarefa (10/20/35 × multiplicador do modo), penalidade por verificação falha, sequência, recuperação, quatro modos de dificuldade, loja (escudo, XP em dobro, lente) e títulos.
- Relatório imprimível e exportação do log no formato longo de datasets de KT.

## Compilar e publicar

```
python build.py      # gera index.html (arquivo único) a partir de src/
node tests.js        # verifica consistência entre dados, simuladores e os dois idiomas
```

Publique `index.html` no GitHub Pages. O progresso fica no `localStorage` do navegador.

## Estrutura

```
src/data.js     mundos, fases, tarefas (itens do KT)
src/game.js     modos, XP, loja, patentes
src/models.js   Elo/Rasch, TRI, BKT, PFA, AFM (idêntico ao DevWise)
src/sims.js     simuladores: mount(el, api) -> {check(taskId), destroy()}
src/lang-pt.js  textos em português
src/lang-en.js  textos em inglês
src/app.js      estado, rastreamento, telas
src/style.css   estilo (tema claro/escuro)
```

Para acrescentar uma fase: defina `sim` em `LESSONS` e suas tarefas em `TASKS` (data.js), implemente `SIMS.<id>` em sims.js, e escreva `lessons.<id>` e `sims.<id>` nos dois pacotes de idioma. `node tests.js` acusa o que faltar.

## Licença

Código: MIT. Conteúdo pedagógico derivado dos materiais CC0 de GBC073/GBC063.
