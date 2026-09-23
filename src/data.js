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
  {id:"nn06", world:"nn", n:6, pre:["nn05"], gate:300, sim:"overfit", x:540, y:180},
  {id:"nn07", world:"nn", n:7, pre:["nn06"], gate:360, sim:"conv", x:420, y:180},
  {id:"nn08", world:"nn", n:8, pre:["nn07"], gate:420, sim:"rnn", x:300, y:180},
  {id:"nn09", world:"nn", n:9, pre:["nn08"], gate:480, sim:"attention", x:180, y:180},
  {id:"nn10", world:"nn", n:10, pre:["nn09"], gate:540, sim:"autoenc", x:60, y:180},
  {id:"nn11", world:"nn", n:11, pre:["nn10"], gate:600, sim:"hopfield", x:60, y:290},
  {id:"nn12", world:"nn", n:12, pre:["nn11"], gate:660, sim:"field", x:180, y:290},
  {id:"nn13", world:"nn", n:13, pre:["nn12"], gate:720, sim:"spiral", x:300, y:290},
  {id:"nn14", world:"nn", n:14, pre:["nn13"], gate:780, sim:"evo", x:420, y:290},
  /* ---- Mundo 2: aprendizagem por reforço (GBC063) ---- */
  {id:"rl01", world:"rl", n:1, pre:[], gate:0, sim:"rover", x:60, y:70},
  {id:"rl02", world:"rl", n:2, pre:["rl01"], gate:60, sim:"gridworld", x:180, y:70},
  {id:"rl03", world:"rl", n:3, pre:["rl02"], gate:120, sim:"mctd", x:300, y:70},
  {id:"rl04", world:"rl", n:4, pre:["rl03"], gate:180, sim:"cliff", x:420, y:70},
  {id:"rl05", world:"rl", n:5, pre:["rl04"], gate:240, sim:"reinforce", x:540, y:70},
  {id:"rl06", world:"rl", n:6, pre:["rl05"], gate:300, sim:"ppo", x:540, y:180},
  {id:"rl07", world:"rl", n:7, pre:["rl06"], gate:360, sim:"gae", x:420, y:180},
  {id:"rl08", world:"rl", n:8, pre:["rl07"], gate:420, sim:"rlhf", x:300, y:180},
  {id:"rl09", world:"rl", n:9, pre:["rl08"], gate:480, sim:"bandit", x:180, y:180},
  {id:"rl10", world:"rl", n:10, pre:["rl09"], gate:540, sim:"hoeffding", x:60, y:180},
  {id:"rl11", world:"rl", n:11, pre:["rl10"], gate:600, sim:"thompson", x:60, y:290},
  {id:"rl12", world:"rl", n:12, pre:["rl11"], gate:660, sim:"riverswim", x:180, y:290},
  {id:"rl13", world:"rl", n:13, pre:["rl12"], gate:720, sim:"mcts", x:300, y:290},
  {id:"rl14", world:"rl", n:14, pre:["rl13"], gate:780, sim:"alphazero", x:420, y:290}
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
  gridworld:  [{id:"w1",d:1},{id:"w2",d:2},{id:"w3",d:2},{id:"w4",d:3}],
  overfit: [{id:"overfit1",k:"o1",d:1},{id:"overfit2",k:"o2",d:2},{id:"overfit3",k:"o3",d:2},{id:"overfit4",k:"o4",d:3}],
  conv: [{id:"conv1",k:"c1",d:1},{id:"conv2",k:"c2",d:2},{id:"conv3",k:"c3",d:2},{id:"conv4",k:"c4",d:3}],
  rnn: [{id:"rnn1",k:"r1",d:1},{id:"rnn2",k:"r2",d:2},{id:"rnn3",k:"r3",d:2},{id:"rnn4",k:"r4",d:3}],
  attention: [{id:"attention1",k:"a1",d:1},{id:"attention2",k:"a2",d:1},{id:"attention3",k:"a3",d:2},{id:"attention4",k:"a4",d:3}],
  autoenc: [{id:"autoenc1",k:"e1",d:1},{id:"autoenc2",k:"e2",d:1},{id:"autoenc3",k:"e3",d:2},{id:"autoenc4",k:"e4",d:3}],
  hopfield: [{id:"hopfield1",k:"h1",d:1},{id:"hopfield2",k:"h2",d:2},{id:"hopfield3",k:"h3",d:2},{id:"hopfield4",k:"h4",d:3}],
  field: [{id:"field1",k:"f1",d:1},{id:"field2",k:"f2",d:2},{id:"field3",k:"f3",d:2},{id:"field4",k:"f4",d:3}],
  spiral: [{id:"spiral1",k:"s1",d:1},{id:"spiral2",k:"s2",d:2},{id:"spiral3",k:"s3",d:3},{id:"spiral4",k:"s4",d:2}],
  evo: [{id:"evo1",k:"e1",d:1},{id:"evo2",k:"e2",d:1},{id:"evo3",k:"e3",d:2},{id:"evo4",k:"e4",d:3}],
  mctd: [{id:"mctd1",k:"t1",d:1},{id:"mctd2",k:"t2",d:1},{id:"mctd3",k:"t3",d:2},{id:"mctd4",k:"t4",d:3}],
  cliff: [{id:"cliff1",k:"q1",d:1},{id:"cliff2",k:"q2",d:2},{id:"cliff3",k:"q3",d:2},{id:"cliff4",k:"q4",d:3}],
  reinforce: [{id:"reinforce1",k:"g1",d:1},{id:"reinforce2",k:"g2",d:2},{id:"reinforce3",k:"g3",d:2},{id:"reinforce4",k:"g4",d:3}],
  ppo: [{id:"ppo1",k:"c1",d:1},{id:"ppo2",k:"c2",d:1},{id:"ppo3",k:"c3",d:2},{id:"ppo4",k:"c4",d:3}],
  gae: [{id:"gae1",k:"l1",d:1},{id:"gae2",k:"l2",d:1},{id:"gae3",k:"l3",d:3},{id:"gae4",k:"l4",d:2}],
  rlhf: [{id:"rlhf1",k:"h1",d:1},{id:"rlhf2",k:"h2",d:2},{id:"rlhf3",k:"h3",d:2},{id:"rlhf4",k:"h4",d:3}],
  bandit: [{id:"bandit1",k:"b1",d:1},{id:"bandit2",k:"b2",d:2},{id:"bandit3",k:"b3",d:2},{id:"bandit4",k:"b4",d:3}],
  hoeffding: [{id:"hoeffding1",k:"s1",d:1},{id:"hoeffding2",k:"s2",d:2},{id:"hoeffding3",k:"s3",d:2},{id:"hoeffding4",k:"s4",d:3}],
  thompson: [{id:"thompson1",k:"t1",d:1},{id:"thompson2",k:"t2",d:1},{id:"thompson3",k:"t3",d:2},{id:"thompson4",k:"t4",d:3}],
  riverswim: [{id:"riverswim1",k:"x1",d:1},{id:"riverswim2",k:"x2",d:2},{id:"riverswim3",k:"x3",d:2},{id:"riverswim4",k:"x4",d:3}],
  mcts: [{id:"mcts1",k:"m1",d:1},{id:"mcts2",k:"m2",d:2},{id:"mcts3",k:"m3",d:2},{id:"mcts4",k:"m4",d:3}],
  alphazero: [{id:"alphazero1",k:"z1",d:1},{id:"alphazero2",k:"z2",d:2},{id:"alphazero3",k:"z3",d:2},{id:"alphazero4",k:"z4",d:3}]
};
const GUESS = 0.05;   // chute assumido numa verificação de estado do simulador

/* Material de apoio por fase. pdf/handout/extras/sim apontam para os repositórios abertos do Prof. Albertini;
   links são leituras, vídeos e interativos complementares (kind: "read" | "video" | "play" | "paper"). */
const GH = { nn: "https://github.com/albertiniufu/gbc073/blob/main/", rl: "https://github.com/albertiniufu/gbc063/blob/main/" };
const GP = { nn: "https://albertiniufu.github.io/gbc073/", rl: "https://albertiniufu.github.io/gbc063/" };
const LK = (title, url, kind) => ({ title, url, kind });
const COMMON = {
  nn: [LK("Neural Networks: Zero to Hero (Andrej Karpathy)", "https://karpathy.ai/zero-to-hero.html", "video"), LK("3Blue1Brown: Neural networks", "https://www.3blue1brown.com/topics/neural-networks", "video"), LK("Deep Learning (Goodfellow, Bengio e Courville)", "https://www.deeplearningbook.org/", "read")],
  rl: [LK("Reinforcement Learning: An Introduction (Sutton e Barto)", "http://incompleteideas.net/book/the-book-2nd.html", "read"), LK("David Silver: RL lectures (UCL/DeepMind)", "https://www.davidsilver.uk/teaching/", "video"), LK("OpenAI Spinning Up in Deep RL", "https://spinningup.openai.com/", "read")]
};
const MAT = {
  nn01: { sim: [["Perceptron", "aula01/simulador-perceptron.html"]], links: [LK("TensorFlow Playground", "https://playground.tensorflow.org/", "play"), LK("Rosenblatt (1958): The perceptron", "https://en.wikipedia.org/wiki/Perceptron", "read")] },
  nn02: { sim: [["Representatividade", "aula02/aula02-simulador-representatividade.html"]], links: [LK("A visual proof that neural nets can compute any function (Nielsen)", "http://neuralnetworksanddeeplearning.com/chap4.html", "read"), LK("TensorFlow Playground", "https://playground.tensorflow.org/", "play")] },
  nn03: { sim: [["Lab: aprendendo a rede", "aula03/aula03-lab.html"]], links: [LK("3Blue1Brown: Gradient descent", "https://www.3blue1brown.com/lessons/gradient-descent", "video"), LK("An overview of gradient descent optimization algorithms (Ruder)", "https://www.ruder.io/optimizing-gradient-descent/", "read")] },
  nn04: { sim: [["Lab: retropropagação", "aula04/aula04-lab.html"]], links: [LK("3Blue1Brown: Backpropagation calculus", "https://www.3blue1brown.com/lessons/backpropagation-calculus", "video"), LK("micrograd (Karpathy)", "https://github.com/karpathy/micrograd", "play"), LK("CS231n: Backpropagation, intuitions", "https://cs231n.github.io/optimization-2/", "read")] },
  nn05: { sim: [["Lab: convergência", "aula05/aula05-lab-convergencia.html"]], links: [LK("Why momentum really works (Distill)", "https://distill.pub/2017/momentum/", "play"), LK("Adam: a method for stochastic optimization", "https://arxiv.org/abs/1412.6980", "paper"), LK("CS231n: Neural nets 3 (learning and evaluation)", "https://cs231n.github.io/neural-networks-3/", "read")] },
  nn06: { links: [LK("Dropout (Srivastava et al., JMLR 2014)", "https://jmlr.org/papers/v15/srivastava14a.html", "paper"), LK("CS231n: Neural nets 2 (regularization)", "https://cs231n.github.io/neural-networks-2/", "read"), LK("Deep Learning, cap. 7: Regularization", "https://www.deeplearningbook.org/contents/regularization.html", "read")] },
  nn07: { links: [LK("CS231n: Convolutional networks", "https://cs231n.github.io/convolutional-networks/", "read"), LK("ConvNetJS: demos no navegador (Karpathy)", "https://cs.stanford.edu/people/karpathy/convnetjs/", "play"), LK("3Blue1Brown: But what is a convolution?", "https://www.3blue1brown.com/lessons/convolutions", "video")] },
  nn08: { links: [LK("Understanding LSTM networks (Olah)", "https://colah.github.io/posts/2015-08-Understanding-LSTMs/", "read"), LK("The unreasonable effectiveness of RNNs (Karpathy)", "https://karpathy.github.io/2015/05/21/rnn-effectiveness/", "read"), LK("Deep Learning, cap. 10: Sequence modeling", "https://www.deeplearningbook.org/contents/rnn.html", "read")] },
  nn09: { links: [LK("Attention is all you need", "https://arxiv.org/abs/1706.03762", "paper"), LK("The illustrated Transformer (Alammar)", "https://jalammar.github.io/illustrated-transformer/", "read"), LK("3Blue1Brown: Attention in transformers", "https://www.3blue1brown.com/lessons/attention", "video")] },
  nn10: { links: [LK("From autoencoder to beta-VAE (Weng)", "https://lilianweng.github.io/posts/2018-08-12-vae/", "read"), LK("Efficient estimation of word representations (word2vec)", "https://arxiv.org/abs/1301.3781", "paper"), LK("Embedding Projector (TensorFlow)", "https://projector.tensorflow.org/", "play")] },
  nn11: { links: [LK("Hopfield (1982): Neural networks and physical systems", "https://www.pnas.org/doi/10.1073/pnas.79.8.2554", "paper"), LK("Self-organizing map (Kohonen)", "https://en.wikipedia.org/wiki/Self-organizing_map", "read"), LK("Hebbian theory", "https://en.wikipedia.org/wiki/Hebbian_theory", "read")] },
  nn12: { links: [LK("Neural Fields in Visual Computing (survey e site)", "https://neuralfields.cs.brown.edu/", "read"), LK("NeRF: representing scenes as neural radiance fields", "https://arxiv.org/abs/2003.08934", "paper"), LK("Fourier features let networks learn high frequency functions", "https://arxiv.org/abs/2006.10739", "paper")] },
  nn13: { links: [LK("ImageNet classification with deep CNNs (AlexNet)", "https://papers.nips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html", "paper"), LK("Deep residual learning (ResNet)", "https://arxiv.org/abs/1512.03385", "paper"), LK("A recipe for training neural networks (Karpathy)", "https://karpathy.github.io/2019/04/25/recipe/", "read")] },
  nn14: { links: [LK("Computational intelligence (visão geral)", "https://en.wikipedia.org/wiki/Computational_intelligence", "read"), LK("The bitter lesson (Sutton)", "http://www.incompleteideas.net/IncIdeas/BitterLesson.html", "read")] },
  rl01: { sim: [["Mars Rover", "aula01/aula01-iterativa-mars-rover.html"]], extras: [["Nota sobre a equação de Bellman", "aula01/nota-bellman.pdf"]], links: [LK("Sutton e Barto, cap. 3: Finite MDPs", "http://incompleteideas.net/book/RLbook2020.pdf", "read"), LK("David Silver: Lecture 1 e 2", "https://www.davidsilver.uk/teaching/", "video")] },
  rl02: { sim: [["MDPs", "aula02/interativo-aula02.html"]], links: [LK("Sutton e Barto, cap. 4: Dynamic programming", "http://incompleteideas.net/book/RLbook2020.pdf", "read"), LK("Hugging Face Deep RL Course, unidade 1", "https://huggingface.co/learn/deep-rl-course/unit1/introduction", "read")] },
  rl03: { sim: [["Avaliação de política", "aula03/simulador-avaliacao.html"]], extras: [["Referência da aula 3", "aula03/referencia-aula03.pdf"]], links: [LK("Sutton e Barto, cap. 5 e 6: Monte Carlo e TD", "http://incompleteideas.net/book/RLbook2020.pdf", "read"), LK("Sutton (1988): Learning to predict by the methods of temporal differences", "https://link.springer.com/article/10.1007/BF00115009", "paper")] },
  rl04: { sim: [["Demos", "aula04/aula04-demos.html"], ["Q-Learning", "simuladores/q-learning-simulador.html"], ["Crawler Bot", "aula04/aula04-lab-crawler.html"], ["DQN", "simuladores/dqn.html"]], links: [LK("Playing Atari with deep RL (DQN)", "https://arxiv.org/abs/1312.5602", "paper"), LK("Hugging Face Deep RL Course, unidade 2 e 3", "https://huggingface.co/learn/deep-rl-course/unit2/introduction", "read")] },
  rl05: { sim: [["Lab: gradiente de política", "aula05/aula05-laboratorio-gradiente-de-politica.html"]], links: [LK("Sutton e Barto, cap. 13: Policy gradient methods", "http://incompleteideas.net/book/RLbook2020.pdf", "read"), LK("Policy gradient algorithms (Weng)", "https://lilianweng.github.io/posts/2018-04-08-policy-gradient/", "read")] },
  rl06: { links: [LK("Proximal Policy Optimization algorithms", "https://arxiv.org/abs/1707.06347", "paper"), LK("Trust Region Policy Optimization", "https://arxiv.org/abs/1502.05477", "paper"), LK("Spinning Up: PPO", "https://spinningup.openai.com/en/latest/algorithms/ppo.html", "read")] },
  rl07: { links: [LK("High-dimensional continuous control using GAE", "https://arxiv.org/abs/1506.02438", "paper"), LK("The 37 implementation details of PPO", "https://iclr-blog-track.github.io/2022/03/25/ppo-implementation-details/", "read"), LK("Hugging Face Deep RL Course, unidade 8 (PPO)", "https://huggingface.co/learn/deep-rl-course/unit8/introduction", "read")] },
  rl08: { links: [LK("Illustrating RLHF (Hugging Face)", "https://huggingface.co/blog/rlhf", "read"), LK("Deep RL from human preferences", "https://arxiv.org/abs/1706.03741", "paper"), LK("Training language models to follow instructions (InstructGPT)", "https://arxiv.org/abs/2203.02155", "paper")] },
  rl09: { links: [LK("Sutton e Barto, cap. 2: Multi-armed bandits", "http://incompleteideas.net/book/RLbook2020.pdf", "read"), LK("The multi-armed bandit problem and its solutions (Weng)", "https://lilianweng.github.io/posts/2018-01-23-multi-armed-bandit/", "read")] },
  rl10: { links: [LK("Bandit Algorithms (Lattimore e Szepesvári)", "https://tor-lattimore.com/downloads/book/book.pdf", "read"), LK("Finite-time analysis of the multiarmed bandit problem (UCB1)", "https://link.springer.com/article/10.1023/A:1013689704352", "paper")] },
  rl11: { sim: [["Bandits", "aula11/interativo-aula11.html"]], links: [LK("A tutorial on Thompson sampling (Russo et al.)", "https://arxiv.org/abs/1707.02038", "paper"), LK("Bandit Algorithms, parte VII: Bayesian bandits", "https://tor-lattimore.com/downloads/book/book.pdf", "read")] },
  rl12: { links: [LK("Sutton e Barto, cap. 8: Planning and learning", "http://incompleteideas.net/book/RLbook2020.pdf", "read"), LK("Deep exploration via bootstrapped DQN", "https://arxiv.org/abs/1602.04621", "paper"), LK("Unifying count-based exploration and intrinsic motivation", "https://arxiv.org/abs/1606.01868", "paper")] },
  rl13: { sim: [["MCTS", "aula13/lab13-mcts.html"]], links: [LK("Monte Carlo tree search: beginners guide (int8)", "https://int8.io/monte-carlo-tree-search-beginners-guide/", "read"), LK("A survey of MCTS methods (Browne et al.)", "https://ieeexplore.ieee.org/document/6145622", "paper")] },
  rl14: { sim: [["Lig-4 com MCTS", "aula14/laboratorio-mcts.html"]], links: [LK("Mastering chess and shogi by self-play (AlphaZero)", "https://arxiv.org/abs/1712.01815", "paper"), LK("A simple Alpha(Go) Zero tutorial", "https://suragnair.github.io/posts/alphazero.html", "read")] }
};
