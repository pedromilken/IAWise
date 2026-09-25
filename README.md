# IAWise

Jogo instrutivo de **redes neurais** e **aprendizagem por reforço** com simuladores interativos, histórias de problemas reais, arsenal teórico e *knowledge tracing*. Derivado do [DevWise](https://github.com/pedromilken/DevWise) (mesma arquitetura, mesmo motor de rastreamento, mesma economia de XP), com o conteúdo das disciplinas abertas do Prof. Albertini (UFU/FACOM):

- **Mundo 1 — Máquinas que aprendem**: [GBC073 — Inteligência Computacional](https://github.com/albertiniufu/gbc073) · *Como construir máquinas que aprendem a partir de dados?*
- **Mundo 2 — Agentes que decidem**: [GBC063 — Inteligência Artificial](https://github.com/albertiniufu/gbc063) · *Como construir agentes que tomam boas decisões?*

Idiomas: **português** e **inglês**.

## Como funciona

Uma fase por aula (14 + 14 = 28), com pré-requisito linear dentro de cada mundo. Cada fase tem quatro abas:

1. **História** — um cenário concreto (a fábrica que separa peças, o rover no cânion) que motiva o conceito.
2. **Arsenal teórico** — três conceitos essenciais com analogias práticas e a notação dos slides do curso.
3. **Simulador** — o núcleo do jogo. Em vez de questões de múltipla escolha, cada fase tem um simulador que roda no navegador (canvas puro, sem dependências) e **quatro tarefas verificáveis**: o estudante ajusta pesos, gradientes, políticas e recompensas até o simulador estar no estado pedido e clica em *Verificar*. Cada verificação (acerto ou erro) é um item para o modelo de rastreamento.
4. **Material de apoio** — slides e handouts originais, simuladores do professor e links complementares (detalhes abaixo).

**Jogue em:** https://pedromilken.github.io/IAWise/

As **28 fases têm simulador próprio**, com 4 tarefas verificáveis cada: **112 itens** de knowledge tracing. Os simuladores seguem as seções dos slides de cada aula.

### Mundo 1 — Máquinas que aprendem (GBC073)

| Fase | Simulador | O que se manipula |
|---|---|---|
| NN 1 · Perceptron | `perceptron` | w₁, w₂, b, regra de aprendizado, AND/OR/aleatório/XOR |
| NN 2 · O que uma rede representa | `represent` | unidades ocultas, ReLU/tanh, alvo (\|x\|, seno, degrau, lombada), Adam |
| NN 3 · Aprendendo a rede I | `gradient` | perda L(w), gradiente, taxa de aprendizado, divergência, passo exato |
| NN 4 · Retropropagação | `backprop` | grafo computacional, derivadas locais digitadas, neurônio morto |
| NN 5 · Treinar é otimizar | `optimizers` | SGD × momento × Adam em tigela alongada e vale de Rosenbrock |
| NN 6 · A rede que decora | `overfit` | grau do polinômio × regularização L2; erro de treino e validação (curva em U) |
| NN 7 · Redes que enxergam | `conv` | filtro 3×3 editável, stride, padding, max-pooling, tamanho da saída |
| NN 8 · Redes que leem | `rnn` | RNN tanh/linear × célula com porta; gradiente que some ou explode; memória |
| NN 9 · Atenção | `attention` | consulta (ângulo, norma), temperatura, pesos do softmax sobre 5 chaves |
| NN 10 · Aprender sem professor | `autoenc` | autoencoder linear = PCA, gargalo 1D/2D, codificador não linear no anel |
| NN 11 · Memória e mapas | `hopfield` | regra de Hebb, letras guardadas, ruído, recuperação, capacidade, inverso |
| NN 12 · Interpolação e campos neurais | `field` | campo neural 1D, viés espectral, Fourier features (σ, número de features) |
| NN 13 · Classificação em escala | `spiral` | profundidade, largura, pontos de treino, taxa; orçamento de parâmetros |
| NN 14 · O mapa da IC | `evo` | algoritmo genético (população, mutação) × descida de gradiente em Rastrigin |

### Mundo 2 — Agentes que decidem (GBC063)

| Fase | Simulador | O que se manipula |
|---|---|---|
| RL 1 · Introdução à RL | `rover` | política por estado, γ, derrapagem, V^π por avaliação iterativa |
| RL 2 · Decisões com modelo | `gridworld` | iteração de valor 3×4, custo de viver, derrapagem, γ |
| RL 3 · Avaliação sem modelo | `mctd` | Monte Carlo × TD(0) no passeio aleatório (média de 20 execuções), α |
| RL 4 · Controle sem modelo | `cliff` | Q-learning × SARSA no penhasco, ε, α, caminho guloso, recompensa online |
| RL 5 · Gradientes de política I | `reinforce` | REINFORCE, linha de base, deslocamento da recompensa, variância, entropia |
| RL 6 · Gradientes de política II | `ppo` | objetivo substituto do PPO: vantagem, ε, razão r, onde o clip zera o gradiente |
| RL 7 · PPO, GAE e imitação | `gae` | λ, γ, erro do crítico, ruído; viés² × variância do estimador |
| RL 8 · Imitação, recompensa e RLHF | `rlhf` | comparações (Bradley–Terry), ruído do anotador, β da penalidade KL |
| RL 9 · Bandidos e arrependimento | `bandit` | guloso × ε-guloso × UCB, arrependimento médio em 200 execuções |
| RL 10 · Aprendizado rápido II | `hoeffding` | gap, δ, puxadas, intervalos de Hoeffding, cálculo de n |
| RL 11 · Bandidos bayesianos | `thompson` | posteriores Beta, Thompson sampling, puxadas manuais, comparação com guloso |
| RL 12 · Aprendizagem rápida em MDPs | `riverswim` | RiverSwim: ε-guloso × bônus de exploração (MBIE-EB) |
| RL 13 · MCTS e a família AlphaZero | `mcts` | MCTS/UCT no jogo da velha: posições, c, iterações, visitas e Q |
| RL 14 · MCTS II: AlphaZero | `alphazero` | PUCT com prior de rede, c_puct, simulações, laço de auto-jogo |

Toda fase tem uma aba **Material de apoio** com os slides (PDF) e, no mundo 2, o handout da aula, os simuladores do próprio professor quando existem, extras do repositório e leituras, vídeos e interativos complementares selecionados por assunto — acessível mesmo em fases bloqueadas.

## Rastreamento e gamificação (herdados do DevWise)

- **Elo/Rasch** pilota o jogo: domínio por fase, 60% libera a próxima, 85% domina, confirmação em outro dia. **TRI 3PL (EAP), BKT, PFA e AFM** rodam como sombras e registram no log a previsão feita antes de cada verificação (aba Relatório mostra Brier, AUC e acurácia).
- **Prior hierárquico:** a primeira fase de cada mundo começa em 15%; cada fase seguinte começa em 0,5·15% + 0,5·(domínio da fase anterior), congelado na primeira resposta. Um Elo contrafactual com prior fixo roda em paralelo (`preds.elo_fixed` no log) para comparar as duas estratégias nas mesmas trajetórias; `?prior=fixo` na URL inverte o piloto. Cada linha do log registra `prior` e `priorMode`.
- **Acerto com dica vale meia evidência**: os modelos atualizam e cada parâmetro volta à metade do caminho (`w: 0.5` no log).
- **Só a primeira falha de cada tarefa entra no modelo**: verificar de novo enquanto se ajusta o simulador é exploração, não desconhecimento. As falhas repetidas custam XP e ficam no log com `counted: 0`. Concluir as 4 tarefas de uma fase também libera a seguinte.
- XP por tarefa (10/20/35 × multiplicador do modo), penalidade por verificação falha, sequência e recuperação. Quatro modos de dificuldade em **Ajustes**.
- **Loja:** escudo, XP em dobro, lente e a **chave da curiosidade** (abre uma fase bloqueada sem mudar o domínio; as respostas dessa fase vão ao log com `keyed: 1`), além de títulos.
- **Relatório** por disciplina com as 28 fases: domínio, tarefas concluídas, acertos, erros (que contam para o modelo), tentativas extras e status; seção *O que falta fazer* com as tarefas pendentes; comparação dos modelos (Brier, AUC, acurácia), incluindo o Elo contrafactual. Imprimível e exportável em JSON no formato longo de datasets de KT.

### Dados e privacidade

Não há servidor: progresso e log ficam no `localStorage` de quem joga. Para usar os dados em pesquisa, o estudante exporta o JSON (ou o PDF do relatório) e envia. Uma coleta automática exigiria um destino configurado e, por envolver estudantes, aprovação ética (CEP) e consentimento livre e esclarecido.

## Tutor de IA (traga sua própria chave)

Em **Ajustes** o estudante escolhe um provedor (Anthropic, OpenAI, Google Gemini, DeepSeek, Groq/Llama, Mistral, OpenRouter ou um endpoint OpenAI-compatível próprio) e cola a chave. A chave fica só no `localStorage` do navegador e as chamadas vão direto ao provedor (o jogo não tem servidor). No simulador aparece o painel **Tutor de IA**, que recebe a teoria da fase, as tarefas (feitas ou não) e o estado atual do simulador (`sim.state()`), e é instruído a explicar o que os números mostram sem entregar os valores que completam a tarefa. Só o botão de pista marca as tarefas como "com dica" (XP pela metade). Código em `src/llm.js`.

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
src/sims.js     simuladores NN 1–5 e RL 1–2: mount(el, api) -> {check(taskId), state(), destroy()}
src/sims2.js    simuladores NN 6–14 e RL 3–14 (mesma interface) e utilidades (gráficos, MLP com Adam, jogo da velha)
src/llm.js      tutor com LLM: provedores, chave no navegador, chamada de chat
src/lang-pt.js  textos em português (interface e fases NN 1–5, RL 1–2)
src/lang-pt2.js textos em português das fases NN 6–14 e RL 3–14
src/lang-en.js  textos em inglês (interface e fases NN 1–5, RL 1–2)
src/lang-en2.js textos em inglês das fases NN 6–14 e RL 3–14
src/app.js      estado, rastreamento, telas
src/style.css   estilo (tema claro/escuro)
```

Para acrescentar uma fase: defina `sim` em `LESSONS` e suas tarefas em `TASKS` (data.js), implemente `SIMS.<id>` em sims.js ou sims2.js, e escreva `lessons.<id>` e `sims.<id>` nos dois pacotes de idioma. `node tests.js` acusa o que faltar.

## Licença

Código: MIT. Conteúdo pedagógico derivado dos materiais CC0 de GBC073/GBC063.
