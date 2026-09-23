/* Textos em português das fases NN 6–14 e RL 3–14 (mesclados em LANG.pt) */
(function () {
const L = {
  nn06: { client: "Laboratório de calibração da Metalúrgica", title: "A curva que decorou os pontos",
    story: "O estagiário tinha 12 medições do sensor e queria a curva perfeita. Subiu o grau do polinômio até a curva passar exatamente por todos os pontos: erro zero no treino. No dia seguinte, com peças novas, as previsões foram absurdas. A curva tinha decorado o ruído das 12 medições em vez de aprender o comportamento do sensor. A chefe separou um conjunto de validação, que o modelo nunca vê no ajuste, e mostrou o dilema: modelo simples demais erra tudo; complexo demais erra o que não viu.",
    theory: [
      ["Viés e variância", "Um modelo simples (grau 1) erra de forma sistemática: é viés, ou subajuste. Um modelo muito flexível acompanha o ruído da amostra e muda muito se os dados mudarem: é variância, ou sobreajuste. O erro de validação, medido em dados fora do ajuste, desenha um U em função da complexidade; o fundo do U é o ponto de equilíbrio."],
      ["Validação, parada antecipada e teste", "Treino ajusta os pesos; validação escolhe hiperparâmetros (grau, λ, época de parar); teste mede o resultado final uma única vez. Usar o teste para escolher é contaminá-lo. Parar o treino quando a validação piora (early stopping) é uma forma implícita de regularização."],
      ["Regularização L2", "Somar λ‖w‖² à perda penaliza pesos grandes e suaviza a curva, mesmo com grau alto. λ = 0 é o ajuste livre; λ grande demais achata tudo e volta ao subajuste. Analogia: um elástico preso à origem que puxa os pesos; quanto maior λ, mais duro o elástico."]
    ],
    tasks: { overfit1: { t: "Com grau 1, observe o subajuste: o erro de treino fica acima de 0,08.", h: "Uma reta não acompanha uma senoide; até o erro de treino é alto." },
      overfit2: { t: "Com grau ≥ 9 e λ = 0, faça o erro de validação passar de 5× o de treino.", h: "Com 12 pontos, um polinômio de grau alto passa por todos e oscila entre eles." },
      overfit3: { t: "Mantenha grau ≥ 9 e escolha λ > 0 que leve o erro de validação abaixo de 0,045.", h: "Aumente λ aos poucos: pequeno demais ainda oscila, grande demais vira quase uma reta. Procure por volta de 1e-2." },
      overfit4: { t: "Com λ = 0, encontre o grau com erro de validação a até 10% do melhor possível.", h: "Olhe a curva vermelha à direita: o fundo do U é o grau certo." } } },
  nn07: { client: "Inspeção visual das chapas", title: "Uma lupa que desliza pela imagem",
    story: "A câmera da linha de inspeção fotografa cada chapa e o time quer detectar trincas. Uma MLP comum trataria cada pixel como uma entrada independente, com milhões de pesos, e precisaria reaprender a mesma trinca em cada posição da imagem. A ideia da convolução é usar uma pequena lupa de 3×3 que desliza pela foto inteira com os mesmos pesos. Se a lupa responde a bordas verticais, ela responde a elas em qualquer lugar. Muda a lupa, muda o que a rede enxerga.",
    theory: [
      ["Filtro e mapa de características", "Um filtro (kernel) é uma matriz pequena de pesos. Em cada posição, multiplica-se o filtro pelos pixels embaixo dele e soma-se: o resultado vira um pixel do mapa de características. Pesos compartilhados em todas as posições dão equivariância à translação e reduzem muito os parâmetros."],
      ["Stride, padding e tamanho da saída", "Stride é o tamanho do passo da lupa; padding acrescenta bordas de zeros. O tamanho da saída é ⌊(N + 2p − k)/s⌋ + 1. Stride maior reduz a resolução; padding preserva as bordas da imagem."],
      ["Pooling e invariância", "Max-pooling 2×2 guarda o maior valor de cada bloco e reduz o mapa pela metade. Isso dá uma tolerância a pequenos deslocamentos: a trinca pode mover um pixel e a resposta continua. Empilhar convolução e pooling constrói detectores de padrões cada vez maiores."]
    ],
    tasks: { conv1: { t: "Faça a saída ficar idêntica à entrada (sem pooling).", h: "O filtro identidade tem 1 no centro; com stride 1, padding 1 mantém 14×14." },
      conv2: { t: "Monte um filtro que responda a bordas verticais pelo menos 3× mais que a bordas horizontais.", h: "Coluna esquerda negativa, direita positiva (Sobel x). Use o preset ou clique nas células do filtro." },
      conv3: { t: "Deixe o mapa de saída com 6×6.", h: "(14 + 2p − 3)/s + 1: stride 2 e padding 0 dão 6; ou stride 1 sem padding e pooling 2×2." },
      conv4: { t: "Crie um filtro de desfoque (só pesos ≥ 0) com stride 1, padding 1 e sem pooling que reduza a variação total da imagem para menos de 60%.", h: "Pesos positivos fazem uma média dos vizinhos; o preset Desfoque serve." } } },
  nn08: { client: "Previsão de demanda da fábrica", title: "O sinal que se perde no caminho",
    story: "Para prever a demanda de amanhã, a rede lê a série dos últimos dias, um passo por vez, guardando um estado interno h. O problema aparece no treino: o erro de hoje precisa voltar até o evento de semanas atrás que o causou. Esse sinal atravessa a mesma multiplicação dezenas de vezes, e multiplicar muitas vezes por um número menor que 1 leva a quase zero; por um número maior que 1, ao infinito. A LSTM resolveu isso com uma estrada de memória protegida por portas.",
    theory: [
      ["Recorrência", "Uma RNN aplica os mesmos pesos a cada passo: hₜ = tanh(w·hₜ₋₁ + u·xₜ). É uma rede muito profunda no tempo, com pesos compartilhados. O estado h é a memória que carrega o passado para o futuro."],
      ["Gradiente que some ou explode", "Pela regra da cadeia, ∂h_T/∂h₁ é o produto de T−1 fatores w·tanh'(·). Se o fator típico é menor que 1, o produto some (a rede não aprende dependências longas); se é maior, explode (o treino diverge). Recortar o gradiente (clipping) resolve a explosão, não o sumiço."],
      ["Portas: LSTM e GRU", "A LSTM guarda uma célula c com atualização aditiva: cₜ = f·cₜ₋₁ + i·xₜ. A porta de esquecimento f, aprendida, decide quanto manter. Com f perto de 1, a memória e o gradiente atravessam muitos passos quase intactos. Analogia: uma esteira que só é alterada quando a porta manda."]
    ],
    tasks: { rnn1: { t: "Célula tanh, T ≥ 20: faça o gradiente de h_T em relação a h_1 cair abaixo de 1e-3.", h: "Cada passo multiplica o gradiente por w·tanh'(·) < 1. Com w = 0,5 ele some rápido." },
      rnn2: { t: "Célula linear, T ≥ 20: faça o gradiente explodir acima de 1e3.", h: "Sem tanh, o fator por passo é w. 1,5²⁰ ≈ 3300." },
      rnn3: { t: "Célula com porta, T ≥ 50: mantenha c_T ≥ 0,5.", h: "c_T = f^(T−1). Para T = 50, f precisa de ≈ 0,986 ou mais." },
      rnn4: { t: "Célula tanh, T ≥ 30: guarde a memória (h_T ≥ 0,5) e observe que o gradiente mesmo assim fica abaixo de 1e-2.", h: "Com w > 1, tanh cria um atrator que retém o valor, mas satura: tanh' ≈ 0 mata o gradiente. Tente w = 2." } } },
  nn09: { client: "Leitor de ordens de serviço", title: "Onde a rede deve olhar",
    story: "As ordens de serviço chegam em texto livre: 'o gato subiu no carro na estrada'. Para entender a palavra 'subiu', o modelo precisa decidir em que outras palavras prestar atenção. Em vez de ler tudo com o mesmo peso, cada palavra gera uma consulta, compara com as chaves das outras e distribui 100% de atenção entre elas. É uma média ponderada, mas os pesos são aprendidos e mudam a cada frase.",
    theory: [
      ["Atenção como média ponderada", "Dada uma consulta q e chaves kᵢ, os pesos são softmax(q·kᵢ/τ) e a saída é a média dos valores vᵢ com esses pesos. Chaves parecidas com a consulta recebem mais peso. Analogia: uma busca num arquivo em que cada pasta responde com intensidade proporcional à semelhança com o que se procura."],
      ["Temperatura e escala √d", "Dividir por τ controla o quão concentrado é o softmax: τ pequeno aproxima o argmax (atenção dura); τ grande espalha tudo (atenção uniforme). No transformer, τ = √d evita que produtos internos grandes saturem o softmax quando a dimensão cresce."],
      ["Self-attention e transformer", "Na self-attention, consultas, chaves e valores vêm das próprias palavras, por três projeções aprendidas. Várias cabeças em paralelo olham para relações diferentes. O custo cresce com o quadrado do comprimento da sequência, o preço da escala dos LLMs."]
    ],
    tasks: { attention1: { t: "Faça a consulta dar pelo menos 80% do peso a 'gato'.", h: "'gato' e 'cachorro' são vizinhos. Aponte a consulta para o lado em que 'gato' ganha de 'cachorro' (ângulo negativo) e baixe a temperatura." },
      attention2: { t: "Deixe a atenção quase uniforme: nenhum peso acima de 25%.", h: "Temperatura alta achata o softmax." },
      attention3: { t: "Divida a atenção: 'gato' e 'cachorro' com pelo menos 40% cada.", h: "Aponte a consulta entre os dois, com norma e temperatura moderadas." },
      attention4: { t: "Faça uma atenção 'dura': 99% ou mais em 'carro'.", h: "Aponte para 'carro' (≈ 145°), norma alta e temperatura baixa." } } },
  nn10: { client: "Compressão de registros de sensores", title: "Guardar menos sem perder o essencial",
    story: "Cada peça gera duas medidas correlacionadas, e o armazenamento está lotado. A ideia é treinar uma rede que comprime as duas medidas num único número e depois tenta reconstruí-las: um autoencoder. Não há rótulos, a própria entrada é o alvo. Se as medidas vivem perto de uma reta, um número basta. Mas há peças cujas medidas formam um anel, e aí nenhuma reta resolve.",
    theory: [
      ["Autoencoder", "Codificador e decodificador com um gargalo no meio: a rede é obrigada a resumir a entrada em poucas dimensões e reconstruí-la. A perda é o erro de reconstrução. Aprende-se sem rótulos, e o código resultante serve de pré-treino ou de representação para outras tarefas."],
      ["Linear = PCA", "Um autoencoder linear com gargalo de dimensão k aprende o mesmo subespaço da análise de componentes principais: as k direções de maior variância. Projetar na direção principal perde só a variância perpendicular a ela."],
      ["Não linearidade e embeddings", "Quando os dados vivem numa curva (um anel, por exemplo), nenhuma reta os resume, mas um código não linear (o ângulo) sim. Embeddings de palavras seguem a mesma ideia: vetores densos em que a geometria codifica significado."]
    ],
    tasks: { autoenc1: { t: "Elipse, código de 1 dimensão, codificador linear: gire a direção até o erro ficar a até 5% do mínimo.", h: "A melhor direção é a de maior variância: o eixo longo (primeira componente principal)." },
      autoenc2: { t: "Agora encontre a pior direção (erro a até 5% do máximo).", h: "É perpendicular à melhor: o eixo curto." },
      autoenc3: { t: "No anel, com codificador linear e 1 dimensão, encontre a melhor direção e constate que o erro continua perto de metade da variância.", h: "Um anel não tem direção preferida: toda reta perde quase metade da informação." },
      autoenc4: { t: "No anel, troque para o codificador não linear (ângulo) e leve o erro abaixo de 10% do melhor linear.", h: "Um único número, o ângulo, descreve bem um ponto do anel. É isso que um autoencoder não linear pode aprender." } } },
  nn11: { client: "Leitor de etiquetas desbotadas", title: "Uma memória que se completa sozinha",
    story: "As etiquetas das caixas chegam borradas, com metade dos pixels trocados. Em vez de classificar, a ideia é uma memória associativa: guarde as letras limpas e, diante de uma versão suja, deixe a rede rolar ladeira abaixo até a lembrança mais próxima. É a rede de Hopfield, ligada à física de ímãs e à regra que Hebb formulou em 1949: neurônios que disparam juntos se conectam.",
    theory: [
      ["Regra de Hebb", "Para guardar padrões p (com valores ±1), os pesos são W = Σ p·pᵀ / N, sem autoconexões. Cada padrão reforça as ligações entre pixels que concordam. Não há gradiente nem época: aprender é somar correlações."],
      ["Energia e atratores", "A dinâmica atualiza cada neurônio para o sinal de Σ wᵢⱼxⱼ. A energia E = −½ xᵀWx nunca sobe, então a rede desce até um mínimo local. Os padrões guardados são vales de energia (atratores); o inverso −p também é, porque a regra é simétrica."],
      ["Capacidade e Hopfield moderno", "Com N neurônios, a rede clássica guarda cerca de 0,14·N padrões aleatórios; acima disso aparecem estados espúrios e as memórias se misturam. Hopfield moderno usa energias exponenciais, guarda muito mais e tem a mesma forma matemática da atenção dos transformers."]
    ],
    tasks: { hopfield1: { t: "Guarde pelo menos 2 letras, corrompa a letra-alvo com ruído ≥ 20% e recupere-a exatamente.", h: "Marque T e L, escolha T, ruído 20%, Corromper e depois Recuperar." },
      hopfield2: { t: "Guarde 5 ou mais letras e mostre uma falha de recuperação a partir de ruído ≥ 20%.", h: "A capacidade é ≈ 0,14·N = 3,5 padrões para 25 neurônios. Acima disso aparecem estados espúrios; tente algumas vezes." },
      hopfield3: { t: "Com ruído ≥ 70%, faça a rede convergir para o inverso exato da letra.", h: "Se W guarda p, também guarda −p. Um estado mais perto de −p cai lá." },
      hopfield4: { t: "Guarde exatamente 3 letras e recupere cada uma delas a partir de ruído ≥ 20%.", h: "Escolha letras pouco parecidas (T, L, X) e faça Corromper → Recuperar para cada alvo." } } },
  nn12: { client: "Digitalização do perfil de peças", title: "Uma rede que é o próprio sinal",
    story: "O perfil de uma peça foi medido em 48 pontos e o time quer uma representação contínua para consultar qualquer posição. Em vez de guardar a tabela, treina-se uma rede que recebe a coordenada x e devolve a altura: um campo neural. A surpresa: a rede aprende rápido a forma geral, mas os detalhes finos não aparecem nem depois de milhares de passos. Um truque simples muda tudo: antes de entrar na rede, x vira senos e cossenos.",
    theory: [
      ["Campos neurais", "Um campo neural é uma MLP que mapeia coordenadas para valores: x → sinal, (x, y) → cor, (x, y, z) → densidade. A rede é uma representação contínua e compacta, usada em imagens, formas 3D (NeRF) e soluções de equações (PINNs)."],
      ["Viés espectral", "Redes treinadas por gradiente aprendem primeiro as componentes de baixa frequência; as altas demoram muito ou nunca chegam. Analogia: desenhar primeiro o contorno e só depois os detalhes, mas com uma borracha que apaga os detalhes mais rápido do que se desenha."],
      ["Fourier features", "Trocar x por [sen(2πBx), cos(2πBx)], com frequências B sorteadas de uma normal de escala σ, dá à rede acesso direto às altas frequências. σ pequeno demais continua suave; σ grande demais decora os pontos e oscila entre eles, o sobreajuste no domínio da frequência."]
    ],
    tasks: { field1: { t: "Sem Fourier features, treine ≥ 2000 passos e observe o erro de treino ficar acima de 0,02.", h: "A rede aprende primeiro as baixas frequências (viés espectral); os detalhes rápidos demoram muito." },
      field2: { t: "Ligue as Fourier features e leve o erro de teste abaixo de 0,005.", h: "σ entre 2 e 6 costuma bastar. Treine ×500 algumas vezes." },
      field3: { t: "Com σ ≥ 30, chegue a erro de treino < 0,005 e erro de teste > 0,03.", h: "Frequências altas demais decoram os pontos e oscilam entre eles." },
      field4: { t: "Com no máximo 6 features, chegue a erro de teste < 0,01.", h: "Poucas frequências bem escalonadas bastam para um sinal de 3 componentes. Mantenha σ baixo." } } },
  nn13: { client: "Projeto do classificador de defeitos", title: "Quanto de rede o problema pede",
    story: "Chegou a hora de projetar o classificador de defeitos de verdade. As duas classes se enrolam como duas espirais, e o orçamento do chip embarcado é curto: cada parâmetro custa memória. A pergunta de projeto não é 'qual a maior rede possível', é 'qual a menor rede que resolve bem, com os dados que eu tenho'. Profundidade, largura, taxa de aprendizado e quantidade de dados entram na mesma conta.",
    theory: [
      ["Profundidade e largura", "Sem camadas ocultas, a fronteira é uma reta. Cada camada acrescenta dobras; camadas mais largas acrescentam dobras em paralelo, camadas mais profundas as compõem. Parâmetros de uma camada densa: entradas × saídas + vieses."],
      ["Dados e generalização", "Com poucos dados, uma rede grande decora o treino (100%) e generaliza mal. Mais dados, regularização ou uma rede menor reduzem a distância entre treino e validação. Aumento de dados e transferência de aprendizado são a mesma ideia em escala."],
      ["Boas práticas de projeto", "Comece pequeno e cresça até a validação parar de melhorar; acompanhe treino e validação juntos; ajuste a taxa de aprendizado antes de mexer na arquitetura; registre cada experimento. É a receita de Karpathy: primeiro fazer sobreajustar, depois regularizar."]
    ],
    tasks: { spiral1: { t: "Com profundidade 0 (regressão logística), treine ≥ 200 passos: a validação não passa de 70%.", h: "Sem camada oculta a fronteira é uma reta; espirais entrelaçadas não são linearmente separáveis." },
      spiral2: { t: "Chegue a 95% de acurácia de validação.", h: "Duas camadas de 8 unidades, taxa 0,03, treine várias vezes ×200." },
      spiral3: { t: "Chegue a 90% de validação com no máximo 70 parâmetros.", h: "Parâmetros de uma camada: entradas × saídas + vieses. Tente 1 camada de 12 ou 2 de 6." },
      spiral4: { t: "Com até 30 pontos de treino, faça 100% no treino e pelo menos 8 pontos a menos na validação.", h: "Poucos dados e rede grande: ela decora. Use 3 camadas de 24." } } },
  nn14: { client: "Encerramento: o time de otimização", title: "Uma função, uma perda, um otimizador",
    story: "No fim do curso, o time recebe um problema diferente: ajustar dois parâmetros de uma máquina cujo desempenho tem dezenas de vales falsos. A descida de gradiente, que funcionou tão bem nas redes, cai no primeiro vale e para. Um colega propõe outra família da inteligência computacional: uma população de soluções que se reproduz, mistura e sofre mutações, como na evolução. Redes neurais, computação evolutiva e lógica fuzzy são as três tradições da área.",
    theory: [
      ["Os três paradigmas", "Redes neurais aprendem representações com gradiente; computação evolutiva busca por população, seleção e variação; sistemas fuzzy raciocinam com pertinências graduais. Todo problema do curso coube em três escolhas: uma função (o modelo), uma perda e um otimizador."],
      ["Gradiente e mínimos locais", "A descida de gradiente usa só a inclinação local. Em terrenos com muitos vales, como a função de Rastrigin, ela para no mínimo mais próximo do ponto de partida. Em redes grandes isso incomoda menos, porque em alta dimensão quase todo ponto crítico é sela."],
      ["Algoritmo genético", "Seleção (os melhores se reproduzem), cruzamento (misturar pais) e mutação (ruído) criam novas gerações. Sem mutação, a população nunca sai da região onde nasceu; com mutação demais vira busca aleatória. O elitismo guarda o melhor encontrado."]
    ],
    tasks: { evo1: { t: "Rode a descida de gradiente a partir de (3,3; 3,1) e veja-a parar num mínimo local (f > 1).", h: "O gradiente só enxerga a vizinhança: cai no vale mais próximo." },
      evo2: { t: "Com o algoritmo genético, encontre um ponto com f < 0,1.", h: "Mutação por volta de 0,5 e 30 a 60 indivíduos; rode algumas vezes +50." },
      evo3: { t: "Zere a mutação e rode ≥ 50 gerações: o melhor fica acima de 1.", h: "Só o cruzamento mistura pais: a população nunca sai do quadrado onde nasceu, longe da origem." },
      evo4: { t: "Encontre f < 0,1 em no máximo 60 gerações.", h: "Ajuste população e mutação antes de rodar (Nova população zera as gerações). Comece por 60 indivíduos e σ = 0,5." } } },

  rl03: { client: "Rover aprendendo sem mapa", title: "Esperar o fim ou aprender no caminho",
    story: "O rover agora não conhece as probabilidades do terreno: só pode andar e observar. Num corredor de cinco trechos, de A a E, ele começa no meio e anda para um lado ou outro ao acaso; se sair pela direita, ganha 1 ponto; pela esquerda, nada. Quanto vale cada trecho? Uma estratégia espera o fim de cada viagem e usa o total (Monte Carlo). Outra ajusta o valor a cada passo, usando o valor estimado do próximo trecho (diferença temporal).",
    theory: [
      ["Monte Carlo", "Estima V(s) pela média dos retornos observados depois de visitar s: V(s) ← V(s) + α(G − V(s)). É não enviesado, mas precisa esperar o episódio terminar e herda toda a variância do retorno."],
      ["TD(0)", "Atualiza a cada passo com um alvo que usa a própria estimativa: V(s) ← V(s) + α(r + γV(s') − V(s)). O termo entre parênteses é o erro TD δ. Tem viés (o alvo depende de V ainda errado) e muito menos variância; costuma aprender mais rápido, como no exemplo do passeio aleatório de Sutton e Barto."],
      ["Taxa de aprendizado e lote", "α grande reage rápido mas nunca assenta; α pequeno assenta mas demora. Em lote (repetindo os mesmos episódios até convergir), MC minimiza o erro nos retornos vistos e TD converge para a equivalência de certeza: o valor do MDP de máxima verossimilhança."]
    ],
    tasks: { mctd1: { t: "Faça o erro RMS médio do TD(0) ficar abaixo de 0,08.", h: "α = 0,05 a 0,1 e umas 100 episódios." },
      mctd2: { t: "Faça o erro RMS médio de Monte Carlo ficar abaixo de 0,08.", h: "MC é mais ruidoso: use α pequeno (0,01 a 0,02) e mais episódios." },
      mctd3: { t: "Com α_TD ≥ 0,5 e ≥ 100 episódios, mostre que o erro do TD fica acima de 0,1.", h: "Passo grande faz o valor pular a cada episódio e nunca assentar." },
      mctd4: { t: "Com o mesmo α (≤ 0,1) para os dois e ≥ 50 episódios, mostre TD com erro menor que MC.", h: "Iguale os sliders (0,05), reinicie e rode +10 algumas vezes." } } },
  rl04: { client: "Rover na beira do penhasco", title: "O caminho ótimo e o caminho seguro",
    story: "Entre a base e a amostra há um penhasco. O caminho mais curto passa colado à borda; qualquer passo em falso manda o rover de volta ao início com −100. Durante o treino, o rover às vezes escolhe um movimento ao acaso (ε), e é aí que os dois algoritmos discordam. O Q-learning aprende o caminho ótimo supondo que no futuro vai agir perfeitamente. O SARSA aprende o valor do que realmente faz, tropeços incluídos, e prefere se afastar da borda.",
    theory: [
      ["Controle sem modelo", "Para escolher ações sem conhecer P, aprende-se Q(s, a) em vez de V(s). A melhoria de política generalizada alterna avaliar e melhorar; ε-guloso garante exploração: com probabilidade ε, uma ação aleatória."],
      ["SARSA × Q-learning", "SARSA (on-policy) usa o alvo r + γQ(s', a'), com a' a ação que será de fato tomada. Q-learning (off-policy) usa r + γ maxₐ' Q(s', a'), o valor da ação gulosa. Com ε > 0, o SARSA incorpora o risco de tropeçar; o Q-learning ignora esse risco no alvo."],
      ["Aproximação e DQN", "Com estados demais para uma tabela, Q vira uma rede neural. O DQN estabiliza o Q-learning com replay de experiências e uma rede-alvo congelada. A tríade mortal (aproximação, bootstrapping e off-policy) explica por que isso pode divergir."]
    ],
    tasks: { cliff1: { t: "Faça o caminho guloso do Q-learning ser o ótimo (13 passos, rente ao penhasco).", h: "Rode umas 100 a 300 episódios com ε = 0,1." },
      cliff2: { t: "Com ε ≥ 0,05, faça o SARSA aprender um caminho seguro, afastado do penhasco (mais de 13 passos).", h: "O SARSA avalia a política que realmente executa, com os tropeços do ε. Pode levar 300 a 500 episódios para o caminho dele se firmar." },
      cliff3: { t: "Com ε ≥ 0,05 e ≥ 200 episódios, mostre o SARSA com recompensa média online maior que a do Q-learning.", h: "O Q-learning aprende o caminho ótimo mas cai no penhasco durante o treino por causa do ε." },
      cliff4: { t: "Reinicie com ε ≤ 0,01 e treine: o SARSA também acha o caminho de 13 passos.", h: "Sem exploração aleatória, o comportamento é guloso e o SARSA vira Q-learning. Zere ε antes de treinar." } } },
  rl05: { client: "Estratégia de coleta do rover", title: "Empurrar a política na direção do que deu certo",
    story: "Em vez de estimar valores, o time decide ajustar diretamente a política do rover: probabilidades de escolher cada uma de três rotas. Depois de cada viagem, a rota escolhida fica mais provável se a recompensa foi boa. Funciona, mas é ruidoso: se todas as recompensas forem altas, todas as rotas escolhidas são reforçadas, e só o acaso separa as melhores. Subtrair uma linha de base, o que se esperava ganhar, resolve boa parte do ruído.",
    theory: [
      ["Por que parametrizar a política", "Políticas parametrizadas πθ(a|s) lidam com ações contínuas, podem ser estocásticas e mudam suavemente com θ. O objetivo é maximizar J(θ) = E[R] diretamente, sem passar por Q."],
      ["O truque da razão de verossimilhança", "∇J = E[R · ∇log πθ(a)]. Basta amostrar ações e ponderar a função escore ∇log π pela recompensa: é o REINFORCE. Para softmax, ∇log π(a) = 1ₐ − π."],
      ["Linha de base e entropia", "Subtrair b de R não muda o gradiente esperado (E[∇log π] = 0), mas pode reduzir muito a variância; a escolha natural é b ≈ E[R]. Um bônus de entropia evita que a política colapse cedo demais numa única ação. O passo seguinte é o ator-crítico: um crítico aprendido faz o papel da linha de base."]
    ],
    tasks: { reinforce1: { t: "Faça a política escolher a melhor ação (braço 2) com ≥ 90%.", h: "α = 0,1 e algumas centenas de atualizações." },
      reinforce2: { t: "Com deslocamento ≥ 10 e linha de base ligada, chegue a 90% em no máximo 400 atualizações.", h: "Ligue a linha de base antes de treinar (a caixa reinicia a política)." },
      reinforce3: { t: "Com deslocamento ≥ 10 e ≥ 50 atualizações, mostre a variância sem linha de base ≥ 10× a com linha de base.", h: "Somar uma constante à recompensa não muda o gradiente esperado, mas infla o ruído de R·∇log π." },
      reinforce4: { t: "Com bônus de entropia β > 0, após ≥ 500 atualizações, mantenha a ação mais provável entre 40% e 80%.", h: "A entropia empurra para políticas mais espalhadas. Tente β ≈ 1 com linha de base." } } },
  rl06: { client: "Treino estável do controlador", title: "Melhorar sem se afastar demais",
    story: "O gradiente de política funcionou, mas um passo grande demais estragou num minuto o controlador que levou horas para treinar. O problema: os dados foram coletados pela política antiga, e depois de um passo grande eles já não representam a nova. O PPO propõe um freio simples: medir quanto a nova política mudou a probabilidade de cada ação (a razão r) e parar de recompensar mudanças além de uma faixa de ±ε.",
    theory: [
      ["Reaproveitar dados: amostragem por importância", "Com dados de πold, o ganho da nova política pode ser estimado pelo objetivo substituto E[r·Â], com r = πnew(a|s)/πold(a|s). A estimativa só é confiável se r ficar perto de 1; longe disso, a variância explode."],
      ["O clip do PPO", "L = min(r·Â, clip(r, 1−ε, 1+ε)·Â). Com vantagem positiva, o incentivo acaba quando r passa de 1+ε; com vantagem negativa, quando cai abaixo de 1−ε. O min escolhe sempre o termo mais pessimista, então o clip nunca impede a correção de um erro."],
      ["Regiões de confiança", "O TRPO limita explicitamente a divergência KL entre políticas; o PPO obtém efeito parecido com o clip, muito mais simples de implementar. Os limites de desempenho relativo garantem melhoria quando as políticas ficam próximas."]
    ],
    tasks: { ppo1: { t: "Com Â > 0, coloque r acima de 1 + ε e veja o gradiente zerar.", h: "A ação já ficou mais provável o suficiente; o clip retira o incentivo de ir além." },
      ppo2: { t: "Com Â < 0, coloque r abaixo de 1 − ε e veja o gradiente zerar.", h: "Espelho do caso anterior." },
      ppo3: { t: "Com Â > 0, coloque r abaixo de 1 − ε: o gradiente NÃO zera.", h: "O min escolhe o termo pessimista; aqui é r·Â, que ainda puxa para cima." },
      ppo4: { t: "Com Â < 0, coloque r acima de 1 + ε: o gradiente NÃO zera.", h: "A política ficou mais propensa a uma ação ruim: o PPO corrige sem clipar." } } },
  rl07: { client: "Crítico do controlador", title: "Um botão entre viés e variância",
    story: "O ator precisa saber se uma ação foi melhor que o esperado: a vantagem. Olhar só o passo seguinte usa muito o crítico, que pode estar errado. Olhar a trajetória inteira usa só recompensas reais, mas acumula todo o ruído do caminho. A estimativa de vantagem generalizada (GAE) mistura todas as opções com um único botão, λ, e o melhor ajuste depende de quanto se confia no crítico e de quanto ruído há nas recompensas.",
    theory: [
      ["O erro TD como vantagem de um passo", "δₜ = rₜ + γV(sₜ₊₁) − V(sₜ) estima a vantagem com baixa variância, mas herda o erro do crítico nos estados futuros. O V(s₀) do estado atual funciona como linha de base e não enviesa o gradiente."],
      ["GAE(λ)", "Âₜ = Σₗ (γλ)ˡ δₜ₊ₗ. Com λ = 0, Â = δ (TD de um passo); com λ = 1, os valores intermediários se cancelam e Â vira o retorno Monte Carlo menos V(sₜ). Valores intermediários ponderam exponencialmente os horizontes."],
      ["Escolhendo λ", "Crítico ruim pede λ maior (menos confiança no bootstrap); recompensas ruidosas pedem λ menor (menos soma de ruído). Na prática, λ ≈ 0,95 com γ ≈ 0,99 é o padrão do PPO, mas o ponto ótimo depende do problema."]
    ],
    tasks: { gae1: { t: "Coloque λ = 0 e veja Â_t virar δ_t (TD de um passo).", h: "Com λ = 0 a soma só tem o primeiro termo." },
      gae2: { t: "Coloque λ = 1 e veja Â virar retorno Monte Carlo menos V̂(s₀).", h: "Com λ = 1 os V̂ intermediários se cancelam (soma telescópica)." },
      gae3: { t: "Com erro do crítico ≥ 0,4 e ruído ≥ 0,2, ajuste λ a até 0,1 do melhor λ (que deve ficar estritamente entre 0,05 e 0,95).", h: "Procure o fundo da curva vermelha. Crítico ruim empurra λ para 1; ruído alto empurra para 0. Tente erro 0,6 e ruído 0,3." },
      gae4: { t: "Com crítico perfeito (erro 0) e ruído ≥ 0,2, coloque λ ≤ 0,05 e confirme que é o melhor.", h: "Se V̂ é exato, o TD de um passo não tem viés e tem a menor variância." } } },
  rl08: { client: "Assistente de manutenção", title: "Aprender o que as pessoas preferem",
    story: "O assistente de manutenção escreve respostas e ninguém consegue dar nota absoluta a elas, mas é fácil dizer qual de duas é melhor. O time coleta comparações, ajusta um modelo de recompensa que explique essas preferências e depois otimiza o assistente contra esse modelo. Há duas armadilhas: anotadores ruidosos e um assistente que, sem freio, explora os defeitos do modelo de recompensa em vez de melhorar de verdade.",
    theory: [
      ["Bradley–Terry", "Supõe-se P(i ≻ j) = σ(rᵢ − rⱼ). Ajustar r por máxima verossimilhança nas comparações dá um número por resposta. Só as diferenças importam; anotadores ruidosos comprimem as diferenças aprendidas."],
      ["RLHF com penalidade KL", "Maximiza-se E[r̂] − β·KL(π‖πref). A solução é π ∝ πref·exp(r̂/β): β grande mantém a política perto da referência; β pequeno a leva ao argmax de r̂, onde erros do modelo de recompensa viram exploração indevida (reward hacking)."],
      ["DPO", "A otimização direta de preferências usa a mesma solução fechada para treinar a política direto nas comparações, sem um modelo de recompensa explícito nem RL. A imitação e o RL inverso são as outras rotas para 'de onde vem a recompensa'."]
    ],
    tasks: { rlhf1: { t: "Colete ≥ 30 comparações e chegue a τ de Kendall ≥ 0,8 entre r̂ e a qualidade real.", h: "Com ruído 0,5, umas 40 comparações bastam." },
      rlhf2: { t: "Com ≥ 10 comparações, ajuste β para KL ≤ 0,3 e qualidade esperada pelo menos 0,5 acima da referência.", h: "β grande prende a política à referência; β pequeno a solta. Procure β ≈ 2." },
      rlhf3: { t: "Com ≥ 10 comparações e β ≤ 0,05, mostre a política se afastando da referência (KL ≥ 1,5).", h: "Sem freio de KL, a política vira argmax de r̂ e confia cegamente no modelo de recompensa." },
      rlhf4: { t: "Com ruído do anotador ≥ 2 e ≥ 60 comparações, veja a amplitude de r̂ ficar abaixo de 60% da real (3,4).", h: "Anotadores muito ruidosos fazem as preferências parecerem equilibradas: o Bradley–Terry comprime as diferenças. Reinicie após mudar o ruído." } } },
  rl09: { client: "Escolha do fornecedor de peças", title: "Explorar ou aproveitar",
    story: "Cinco fornecedores entregam peças com qualidade variável, e a fábrica compra de um por dia. Comprar sempre do que parece melhor até agora pode prender a fábrica num fornecedor mediano que teve sorte no início. Testar todos o tempo todo desperdiça compras. O arrependimento mede o custo total de não ter escolhido o melhor desde o começo, e a pergunta é como fazê-lo crescer o mais devagar possível.",
    theory: [
      ["Bandidos multibraço e arrependimento", "Cada braço a tem média μₐ desconhecida. O arrependimento após T passos é Σₜ (μ* − μₐₜ). Estratégias ruins têm arrependimento linear em T; as boas, logarítmico. O guloso falha porque nunca revisita um braço subestimado."],
      ["ε-guloso", "Com probabilidade ε, explora ao acaso. Resolve o travamento, mas explora para sempre na mesma taxa, inclusive braços já claramente ruins: o arrependimento continua linear (com inclinação menor)."],
      ["Otimismo diante da incerteza: UCB", "Escolha argmax Q(a) + c√(ln t / n(a)): o bônus é grande para braços pouco testados e encolhe com o uso. O UCB tem arrependimento O(log T), perto do limite inferior de Lai–Robbins. c grande demais explora demais."]
    ],
    tasks: { bandit1: { t: "Rode o guloso e mostre que ele escolhe o braço ótimo em menos de 60% das vezes (últimos 100 passos).", h: "Sem exploração, fica preso ao primeiro braço que pareceu bom." },
      bandit2: { t: "Rode um ε-guloso com ε entre 0,05 e 0,2 que tenha arrependimento menor que o guloso.", h: "Rode o guloso primeiro para comparar." },
      bandit3: { t: "Rode um UCB com arrependimento menor que todos os ε-gulosos já rodados.", h: "c ≈ 1 costuma ir bem." },
      bandit4: { t: "Mostre que exploração demais atrapalha: um UCB com c ≥ 5 pior que um UCB com c ≤ 2.", h: "Rode os dois; c alto gasta passos em braços já descartados." } } },
  rl10: { client: "Auditoria de fornecedores", title: "Quantos testes para ter certeza",
    story: "A auditoria quer afirmar, com 95% de confiança, que o fornecedor 1 é melhor que o 2. Cada teste é uma peça boa ou ruim. Com poucos testes, as médias observadas se confundem; com muitos, os intervalos de confiança encolhem e se separam. A desigualdade de Hoeffding diz exatamente quanto os intervalos encolhem, sem supor nada sobre a distribuição além de valores entre 0 e 1.",
    theory: [
      ["Concentração: Hoeffding", "Para n amostras em [0, 1], P(|μ̂ − μ| ≥ ε) ≤ 2·exp(−2nε²). Invertendo: com probabilidade ≥ 1 − δ, |μ̂ − μ| ≤ √(ln(2/δ)/(2n)). A largura cai com 1/√n: para dividir o intervalo por 2, são precisas 4× as amostras."],
      ["Quantas amostras (PAC)", "Para meia-largura ε com confiança 1 − δ: n ≥ ln(2/δ)/(2ε²). Separar braços com gap Δ exige ε ≈ Δ/2, logo n ∝ 1/Δ². Braços parecidos custam caro. Esse é o critério PAC: quase certamente, quase ótimo."],
      ["Como ler a cota do UCB", "O bônus do UCB é essa mesma largura, com δ diminuindo com t. Somando os passos gastos em cada braço ruim (≈ ln T / Δ²) chega-se ao arrependimento O(Σ ln T / Δ). Confiança maior (δ menor) custa pouco, porque ln(2/δ) cresce devagar."]
    ],
    tasks: { hoeffding1: { t: "Com Δ ≥ 0,2, puxe até os intervalos se separarem.", h: "Umas 100 puxadas por braço." },
      hoeffding2: { t: "Com Δ ≤ 0,1, separe os intervalos.", h: "A largura cai com 1/√n: metade do gap pede 4× as puxadas." },
      hoeffding3: { t: "Calcule: quantas puxadas por braço para meia-largura ≤ 0,05 com δ = 0,05? Digite n.", h: "Resolva √(ln(2/δ)/(2n)) ≤ ε: n ≥ ln(2/δ)/(2ε²)." },
      hoeffding4: { t: "Com δ ≤ 0,01 e Δ ≥ 0,3, separe os braços com no máximo 200 puxadas por braço.", h: "Confiança maior alarga pouco o intervalo, porque ln(2/δ) cresce devagar." } } },
  rl11: { client: "Teste A/B do novo material", title: "Sortear na proporção da crença",
    story: "Três ligas metálicas estão em teste, e cada peça produzida é um experimento de sucesso ou falha. Em vez de um bônus de otimismo, o time mantém uma crença sobre a taxa de sucesso de cada liga: uma distribuição Beta que se estreita a cada resultado. A cada peça, sorteia-se uma taxa de cada crença e usa-se a liga cujo sorteio foi maior. Ligas promissoras mas incertas ainda ganham chances; ligas claramente piores quase nunca.",
    theory: [
      ["Inferência bayesiana em uma linha", "Com prior Beta(α, β) e resultados de Bernoulli, a posterior continua Beta: soma-se 1 a α a cada sucesso e 1 a β a cada falha. A média é α/(α+β) e a largura encolhe com o número de observações."],
      ["Amostragem de Thompson", "Sorteie θₐ ~ Beta(αₐ, βₐ) para cada braço e escolha argmax θₐ. Cada braço é escolhido com a probabilidade de ser o melhor segundo a crença atual: exploração proporcional à incerteza. O arrependimento bayesiano é O(log T), competitivo com o UCB."],
      ["Onde falha e o que vem depois", "Priors ruins atrasam, braços muito próximos pedem muitos passos, e em MDPs a exploração precisa ser profunda (PSRL). O índice de Gittins resolve o problema bayesiano descontado de forma ótima, mas é caro."]
    ],
    tasks: { thompson1: { t: "No preset fácil, após ≥ 200 passos de Thompson, puxe o melhor braço (3) em ≥ 70% das vezes.", h: "Rode +500. O Thompson concentra as puxadas à medida que as posteriores se estreitam." },
      thompson2: { t: "Puxe o braço 1 manualmente ≥ 20 vezes até a média da posterior ficar a menos de 0,05 do valor real.", h: "Cada puxada soma 1 a α (sucesso) ou a β (falha). O valor real está na linha tracejada." },
      thompson3: { t: "No preset próximo, chegue a P(braço 3 é o melhor) ≥ 90%.", h: "Braços parecidos pedem muitos passos. Se a busca se prender no braço 2, reinicie." },
      thompson4: { t: "Rode a comparação e confirme o Thompson com arrependimento menor que o guloso.", h: "O guloso pela média nunca revisita um braço azarado no início." } } },
  rl12: { client: "Rover subindo o rio", title: "A recompensa que ninguém vê",
    story: "Um rover aquático está num rio de seis trechos. Na margem de partida há uma recompensa minúscula e garantida. Na nascente, rio acima, há uma grande, mas a correnteza faz cada tentativa de subir falhar na maioria das vezes. Exploração ao acaso quase nunca faz o rover insistir o suficiente para chegar lá. Diferente dos bandidos, aqui explorar exige planejar vários passos seguidos: é o RiverSwim, exemplo clássico das aulas de aprendizagem rápida em MDPs.",
    theory: [
      ["Por que MDPs são diferentes", "Num bandido, testar um braço custa um passo. Num MDP, alcançar um estado pouco visitado pode exigir uma sequência longa de ações que só vale a pena se o agente já acreditar que há algo lá. ε-guloso produz caminhadas aleatórias e leva tempo exponencial no RiverSwim."],
      ["Otimismo: MBIE-EB", "Estima-se o modelo (transições e recompensas médias) pelas contagens e soma-se um bônus β/√n(s,a) à recompensa antes de planejar. Pares pouco visitados parecem valiosos, e o planejamento cria planos deliberados para visitá-los: exploração profunda. Tem garantias PAC."],
      ["Amostragem posterior (PSRL)", "A versão bayesiana: sorteia-se um MDP da posterior a cada episódio e segue-se a política ótima dele. O lema da simulação liga o erro do modelo ao erro de valor, e é a base das provas desses algoritmos."]
    ],
    tasks: { riverswim1: { t: "Com ε-guloso (ε ≥ 0,05) e ≥ 200 episódios, veja o agente quase nunca chegar a s5 (≤ 2 visitas).", h: "Chegar a s5 exige muitas escolhas 'direita' seguidas contra a correnteza; ε raramente produz isso." },
      riverswim2: { t: "Com o bônus de exploração, faça o agente visitar s5.", h: "β ≈ 0,1 a 0,5: pares pouco visitados parecem valiosos até serem testados." },
      riverswim3: { t: "Com bônus, faça a política gulosa escolher a direita em todos os estados.", h: "Rode +200 episódios com β moderado." },
      riverswim4: { t: "Com β ≤ 0,01 e ≥ 200 episódios, mostre que o bônus pequeno não basta (s5 não visitado).", h: "O otimismo precisa superar a recompensa pequena e certa da margem." } } },
  rl13: { client: "Planejamento na hora da decisão", title: "Simular antes de jogar",
    story: "Em vez de aprender uma política para todos os estados do mundo, o agente pode planejar só a partir do estado em que está agora. No jogo da velha, antes de cada lance, ele simula muitas partidas até o fim, com jogadas aleatórias, e guarda as estatísticas numa árvore. Os lances que parecem bons recebem mais simulações, mas nenhum é abandonado de vez. Essa busca em árvore de Monte Carlo levou computadores a vencer no Go.",
    theory: [
      ["Planejamento em tempo de decisão", "Em vez de resolver o MDP inteiro, gasta-se computação só no estado atual. A busca de Monte Carlo simples avalia cada ação pela média de rollouts; a árvore reaproveita essas estatísticas e aprofunda onde importa."],
      ["MCTS em quatro fases", "Seleção (descer pela árvore escolhendo filhos), expansão (acrescentar um nó novo), simulação (rollout aleatório até o fim) e retropropagação (atualizar vitórias e visitas no caminho). A decisão final é a jogada mais visitada."],
      ["A regra UCT", "Na seleção, escolhe-se argmax Q + c√(ln N / n): o UCB aplicado a cada nó. c controla o equilíbrio entre aprofundar a melhor jogada e checar as outras. Com poucas iterações, as estatísticas são ruidosas e a decisão não é confiável."]
    ],
    tasks: { mcts1: { t: "Posição A: após ≥ 100 iterações, a jogada mais visitada deve ser a vitória (célula 2).", h: "X tem dois em linha na fileira de cima." },
      mcts2: { t: "Posição B: após ≥ 100 iterações, a jogada mais visitada deve ser o bloqueio (célula 2).", h: "O ameaça fechar a fileira de cima." },
      mcts3: { t: "Posição B com no máximo 20 iterações: encontre uma busca em que a jogada mais visitada ainda NÃO é o bloqueio.", h: "Poucas iterações = estatísticas ruidosas. Use Reiniciar e +10 algumas vezes." },
      mcts4: { t: "Posição A com c ≥ 2,5 e ≥ 1000 iterações: faça a participação da melhor jogada cair abaixo de 95%.", h: "Mais exploração gasta visitas em jogadas ruins, só para ter certeza." } } },
  rl14: { client: "O laço que fabrica os próprios dados", title: "Uma rede que sugere, uma busca que corrige",
    story: "O MCTS puro trata todas as jogadas como igualmente promissoras no começo. O AlphaZero acrescenta uma rede que olha o tabuleiro e sugere probabilidades (o prior) e um valor. A busca usa essas sugestões para decidir onde gastar simulações; depois, a distribuição de visitas da busca vira o alvo de treino da própria rede. Jogando contra si mesma, a rede aprende o que a busca descobriu, e a busca seguinte começa de um ponto melhor.",
    theory: [
      ["PUCT: busca guiada por uma rede", "A seleção usa Q + c·P(a)·√N / (1 + n): jogadas com prior alto são exploradas primeiro, e o termo encolhe com as visitas. Um prior bom economiza simulações; um prior ruim desperdiça, mas a busca ainda corrige se tiver orçamento."],
      ["Auto-jogo", "A rede joga contra si mesma com a busca; a distribuição de visitas vira o alvo da política e o resultado da partida vira o alvo do valor. É um laço de melhoria: a busca amplifica a rede, e a rede destila a busca."],
      ["Um olhar crítico", "O AlphaZero dominou xadrez, shogi e Go sem conhecimento humano; o MuZero dispensou até as regras, aprendendo o modelo. Mas a busca precisa de simuladores confiáveis, e há debate sobre se o UCT é a regra certa fora de jogos de dois jogadores."]
    ],
    tasks: { alphazero1: { t: "Com rede boa (qualidade ≥ 0,5), acerte o bloqueio com no máximo 50 simulações.", h: "Um bom prior concentra a busca desde o início." },
      alphazero2: { t: "Com rede ruim (qualidade ≤ −0,8), acerte o bloqueio com ≥ 800 simulações.", h: "A busca corrige a rede quando tem orçamento." },
      alphazero3: { t: "Parta de uma rede ruim (≤ −0,5) e treine por auto-jogo ≥ 3 vezes até a própria rede preferir o bloqueio.", h: "Cada ciclo: simule (+100) e depois 'treinar' — o prior aprende a distribuição de visitas." },
      alphazero4: { t: "Com rede ruim (≤ −0,8) e no máximo 50 simulações, mostre a busca escolhendo errado.", h: "Pouca busca herda o erro do prior." } } }
};
const SIM = {
  overfit: { degree: "Grau do polinômio", newData: "Novos dados", fitT: "ajuste (●treino ○validação)", curveT: "erro × grau (escala log)", train: "treino", val: "validação" },
  conv: { preset: "Filtro", pId: "Identidade", pVert: "Borda vertical (Sobel x)", pHor: "Borda horizontal (Sobel y)", pBlur: "Desfoque", pSharp: "Nitidez", pool: "Max-pooling 2×2", tip: "Clique nas células do filtro para mudar os pesos (0 → 1 → 2 → −2 → −1).", input: "entrada", kernel: "filtro 3×3", output: "saída", size: "Tamanho da saída" },
  rnn: { recurrent: "peso recorrente", forget: "porta de esquecimento", cell: "Célula", mTanh: "RNN com tanh", mLin: "RNN linear", mGate: "Com porta (LSTM)", steps: "Passos T", memT: "memória: estado ao longo do tempo (pulso em t=1)", gradT: "|gradiente de volta até t=1| (log)" },
  attention: { words: "gato,cachorro,carro,estrada,o", angle: "Ângulo da consulta", temp: "Temperatura", wT: "pesos de atenção" },
  autoenc: { data: "Dados", dEll: "Elipse", dRing: "Anel", enc: "Codificador", eLin: "Linear (projeção)", ePolar: "Não linear (ângulo)", code: "Dimensão do código", angle: "Direção do código", pts: "●dados ○reconstrução", curveT: "erro × direção (linear, 1D)", err: "Erro", varT: "variância total", lost: "perdido" },
  hopfield: { store: "Guardar:", target: "Letra-alvo", noise: "Ruído", corrupt: "Corromper", run: "Recuperar", tip: "O ruído troca o sinal de cada pixel com essa probabilidade.", state: "estado da rede", targetL: "alvo", okRec: "Recuperou a letra", invRec: "Caiu no inverso da letra", noRec: "Estado espúrio (não é a letra)", ready: "Pronto", before: "antes", storedN: "letras guardadas" },
  field: { useFF: "Usar Fourier features", scale: "escala das frequências", nfeat: "Número de features (m)", train500: "Treinar ×500", reinit: "Reiniciar", legend: "tracejado: sinal real · ●amostras de treino · linha: rede", trainE: "treino", testE: "teste", stepsL: "passos" },
  spiral: { depth: "Camadas ocultas", width: "Largura", ntrain: "Pontos de treino", lr: "Taxa de aprendizado", train200: "Treinar ×200", reinit: "Reiniciar", arch: "arquitetura", params: "parâmetros", trainAcc: "acurácia treino", valAcc: "acurácia validação", stepsL: "passos" },
  evo: { pop: "População", mut: "Mutação σ", gen10: "+10 gerações", gen50: "+50 gerações", newPop: "Nova população", gd: "Rodar descida de gradiente", genL: "gerações", bestGA: "melhor f (genético)", gdL: "f final (gradiente)", globalL: "mínimo global" },
  mctd: { reset: "Reiniciar", tip: "Curvas: média de 20 execuções independentes. À esquerda, as estimativas de uma execução.", vT: "V(s): tracejado real · TD · MC", rmsT: "erro RMS médio × episódios", episodes: "Episódios", avg20: "média de 20 execuções" },
  cliff: { ep: "episódios", reset: "Reiniciar", steps: "passos", noPath: "sem caminho ainda", online: "recompensa média (100 últ.)", rewT: "recompensa por episódio (média móvel)", episodes: "Episódios" },
  reinforce: { offset: "Deslocamento da recompensa", entropy: "entropia", baseline: "Usar linha de base b = média de R", reset: "Reiniciar", arms: "ação 1,ação 2,ação 3", pBestT: "π(melhor ação) ao longo do treino", varNB: "variância do gradiente sem linha de base", varB: "com linha de base", ratio: "razão", updates: "Atualizações", best: "melhor" },
  ppo: { adv: "Vantagem", ratio: "Razão", objT: "L_clip(r) (sólido) · r·Â (tracejado) · faixa [1−ε, 1+ε]", zero: "gradiente zero" },
  gae: { critic: "Erro do crítico", noise: "Ruído nas recompensas", resample: "Nova trajetória", mseT: "erro de Â₀ × λ", bias2: "viés²", varL: "variância", bestL: "melhor λ" },
  rlhf: { noise: "Ruído do anotador", cmp: "comparações", reset: "Reiniciar", tip: "Respostas A–F. O anotador prefere a melhor com probabilidade σ((qᵢ − qⱼ)/ruído).", trueQ: "qualidade real (oculta ao modelo)", rhat: "modelo de recompensa r̂ (Bradley–Terry)", range: "amplitude" },
  bandit: { alg: "Estratégia", greedy: "Guloso", run: "Rodar 200 execuções", clear: "Limpar", regT: "arrependimento médio acumulado", regretL: "arrependimento", optL: "braço ótimo", empty: "Rode uma estratégia para ver a curva.", arms: "Braços", runs: "execuções", stepsL: "passos" },
  hoeffding: { gap: "Diferença", each: "por braço", reset: "Reiniciar", askN: "Sua resposta: n =", arm: "Braço", separated: "Intervalos separados: braço 1 é melhor com confiança 1 − δ", overlap: "Intervalos se sobrepõem" },
  thompson: { preset: "Braços", easy: "Fáceis", close: "Próximos", reset: "Reiniciar", manual: "Puxar à mão:", arm: "Braço", compare: "Comparar com guloso (50 rodadas)", postT: "posteriores Beta (tracejado: valor real)", man: "manual", best: "melhor", cmpRes: "arrependimento médio", greedyL: "guloso", pulls: "puxadas", shareBest: "no melhor braço" },
  riverswim: { method: "Método", greedy: "guloso", bonusM: "Bônus de exploração (MBIE-EB)", bonus: "bônus", ep: "episódios", reset: "Reiniciar", vis: "visitas", current: "Setas: política gulosa atual. Cor: quanto cada trecho foi visitado.", episodes: "Episódios", avgRet: "retorno médio (50 últ.)" },
  mcts: { pos: "Posição", posA: "A: X pode vencer", posB: "B: X precisa bloquear", reset: "Reiniciar", xmove: "X joga agora.", iters: "iterações", topMove: "Jogada mais visitada", cell: "célula", legend: "N visitas · Q valor médio para X", ofVisits: "das visitas" },
  alphazero: { netQ: "Qualidade da rede (prior)", sims: "simulações", reset: "Reiniciar busca", train: "Treinar a rede com as visitas (auto-jogo)", tip: "Posição B: X precisa bloquear na célula 2. Qualidade negativa = rede que desvia do bloqueio.", xmove: "X joga agora.", simsL: "simulações", netPick: "Escolha da rede", searchPick: "Escolha da busca", cell: "célula", trainedL: "ciclos de auto-jogo" }
};
for (const id in L) LANG.pt.lessons[id] = Object.assign(LANG.pt.lessons[id] || {}, L[id]);
Object.assign(LANG.pt.sims, SIM);
})();
