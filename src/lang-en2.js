/* English texts for stages NN 6–14 and RL 3–14 (merged into LANG.en) */
(function () {
const L = {
  nn06: { client: "Metalworks calibration lab", title: "The curve that memorized the points",
    story: "The intern had 12 sensor readings and wanted the perfect curve. He raised the polynomial degree until the curve passed exactly through every point: zero training error. The next day, with new parts, the predictions were absurd. The curve had memorized the noise in those 12 readings instead of learning how the sensor behaves. His manager set aside a validation set, which the model never sees while fitting, and showed the dilemma: too simple a model misses everything; too complex a model misses what it has not seen.",
    theory: [
      ["Bias and variance", "A simple model (degree 1) errs systematically: that is bias, or underfitting. A very flexible model follows the sample's noise and changes a lot if the data change: that is variance, or overfitting. Validation error, measured on data outside the fit, draws a U against complexity; the bottom of the U is the sweet spot."],
      ["Validation, early stopping and test", "Training fits the weights; validation picks hyperparameters (degree, λ, when to stop); the test set measures the final result exactly once. Using the test set to choose contaminates it. Stopping when validation gets worse (early stopping) is an implicit form of regularization."],
      ["L2 regularization", "Adding λ‖w‖² to the loss penalizes large weights and smooths the curve even at high degree. λ = 0 is the free fit; too large a λ flattens everything and brings back underfitting. Analogy: a rubber band tying the weights to the origin; the larger λ, the stiffer the band."]
    ],
    tasks: { overfit1: { t: "With degree 1, observe underfitting: training error stays above 0.08.", h: "A straight line cannot follow a sine; even the training error is high." },
      overfit2: { t: "With degree ≥ 9 and λ = 0, make validation error exceed 5× the training error.", h: "With 12 points, a high-degree polynomial passes through all of them and oscillates in between." },
      overfit3: { t: "Keep degree ≥ 9 and choose λ > 0 that brings validation error below 0.045.", h: "Raise λ gradually: too small still oscillates, too large becomes almost a line. Look around 1e-2." },
      overfit4: { t: "With λ = 0, find the degree whose validation error is within 10% of the best possible.", h: "Look at the red curve on the right: the bottom of the U is the right degree." } } },
  nn07: { client: "Visual inspection of steel sheets", title: "A magnifier that slides over the image",
    story: "The inspection camera photographs every sheet and the team wants to detect cracks. A plain MLP would treat each pixel as an independent input, with millions of weights, and would need to relearn the same crack at every position. The idea of convolution is a small 3×3 magnifier that slides over the whole photo with the same weights. If the magnifier responds to vertical edges, it responds to them anywhere. Change the magnifier and you change what the network sees.",
    theory: [
      ["Filters and feature maps", "A filter (kernel) is a small weight matrix. At each position, multiply the filter by the pixels under it and add up: the result becomes one pixel of the feature map. Weights shared across positions give translation equivariance and drastically cut the parameter count."],
      ["Stride, padding and output size", "Stride is the step size of the magnifier; padding adds borders of zeros. The output size is ⌊(N + 2p − k)/s⌋ + 1. A larger stride lowers resolution; padding preserves the image borders."],
      ["Pooling and invariance", "2×2 max-pooling keeps the largest value of each block and halves the map. This tolerates small shifts: the crack may move one pixel and the response stays. Stacking convolution and pooling builds detectors of ever larger patterns."]
    ],
    tasks: { conv1: { t: "Make the output identical to the input (no pooling).", h: "The identity filter has a 1 in the center; with stride 1, padding 1 keeps 14×14." },
      conv2: { t: "Build a filter that responds to vertical edges at least 3× more than to horizontal edges.", h: "Negative left column, positive right column (Sobel x). Use the preset or click the filter cells." },
      conv3: { t: "Make the output map 6×6.", h: "(14 + 2p − 3)/s + 1: stride 2 and padding 0 give 6; or stride 1 without padding plus 2×2 pooling." },
      conv4: { t: "Create a blur filter (weights ≥ 0 only) with stride 1, padding 1 and no pooling that cuts the image's total variation below 60%.", h: "Positive weights average the neighbors; the Blur preset works." } } },
  nn08: { client: "Factory demand forecasting", title: "The signal that gets lost on the way",
    story: "To forecast tomorrow's demand, the network reads the series of past days one step at a time, keeping an internal state h. The problem shows up in training: today's error has to travel back to the event weeks ago that caused it. That signal goes through the same multiplication dozens of times, and multiplying many times by a number below 1 goes to almost zero; above 1, to infinity. The LSTM solved this with a memory highway guarded by gates.",
    theory: [
      ["Recurrence", "An RNN applies the same weights at every step: hₜ = tanh(w·hₜ₋₁ + u·xₜ). It is a very deep network in time, with shared weights. The state h is the memory that carries the past into the future."],
      ["Vanishing and exploding gradients", "By the chain rule, ∂h_T/∂h₁ is a product of T−1 factors w·tanh'(·). If the typical factor is below 1, the product vanishes (the network cannot learn long dependencies); above 1, it explodes (training diverges). Gradient clipping fixes explosion, not vanishing."],
      ["Gates: LSTM and GRU", "The LSTM keeps a cell c with an additive update: cₜ = f·cₜ₋₁ + i·xₜ. The learned forget gate f decides how much to keep. With f near 1, memory and gradient cross many steps almost intact. Analogy: a conveyor belt that is only changed when the gate says so."]
    ],
    tasks: { rnn1: { t: "tanh cell, T ≥ 20: make the gradient of h_T with respect to h_1 drop below 1e-3.", h: "Each step multiplies the gradient by w·tanh'(·) < 1. With w = 0.5 it vanishes fast." },
      rnn2: { t: "Linear cell, T ≥ 20: make the gradient explode above 1e3.", h: "Without tanh, the per-step factor is w. 1.5²⁰ ≈ 3300." },
      rnn3: { t: "Gated cell, T ≥ 50: keep c_T ≥ 0.5.", h: "c_T = f^(T−1). For T = 50, f needs ≈ 0.986 or more." },
      rnn4: { t: "tanh cell, T ≥ 30: keep the memory (h_T ≥ 0.5) and note that the gradient is still below 1e-2.", h: "With w > 1, tanh creates an attractor that retains the value, but it saturates: tanh' ≈ 0 kills the gradient. Try w = 2." } } },
  nn09: { client: "Work-order reader", title: "Where the network should look",
    story: "Work orders arrive as free text: 'the cat climbed on the car on the road'. To understand 'climbed', the model has to decide which other words to pay attention to. Instead of reading everything with equal weight, each word produces a query, compares it with the keys of the others and spreads 100% of its attention among them. It is a weighted average, but the weights are learned and change with every sentence.",
    theory: [
      ["Attention as a weighted average", "Given a query q and keys kᵢ, the weights are softmax(q·kᵢ/τ) and the output is the average of the values vᵢ with those weights. Keys similar to the query get more weight. Analogy: searching a filing cabinet where each folder answers with an intensity proportional to how much it resembles what you are looking for."],
      ["Temperature and the √d scale", "Dividing by τ controls how peaked the softmax is: small τ approaches argmax (hard attention); large τ spreads everything out (uniform attention). In the transformer, τ = √d keeps large dot products from saturating the softmax as the dimension grows."],
      ["Self-attention and the transformer", "In self-attention, queries, keys and values all come from the words themselves, through three learned projections. Several heads in parallel look at different relations. The cost grows with the square of the sequence length, the price of scale in LLMs."]
    ],
    tasks: { attention1: { t: "Make the query give at least 80% of its weight to 'cat'.", h: "'cat' and 'dog' are neighbors. Point the query to the side where 'cat' beats 'dog' (negative angle) and lower the temperature." },
      attention2: { t: "Make attention almost uniform: no weight above 25%.", h: "High temperature flattens the softmax." },
      attention3: { t: "Split attention: 'cat' and 'dog' with at least 40% each.", h: "Point the query between the two, with moderate norm and temperature." },
      attention4: { t: "Make 'hard' attention: 99% or more on 'car'.", h: "Point at 'car' (≈ 145°), high norm and low temperature." } } },
  nn10: { client: "Compressing sensor logs", title: "Store less without losing what matters",
    story: "Each part produces two correlated measurements and storage is full. The idea is to train a network that squeezes both measurements into a single number and then tries to rebuild them: an autoencoder. There are no labels; the input itself is the target. If the measurements live near a line, one number is enough. But some parts have measurements that form a ring, and there no line will do.",
    theory: [
      ["Autoencoder", "Encoder and decoder with a bottleneck in the middle: the network is forced to summarize the input in a few dimensions and rebuild it. The loss is the reconstruction error. It learns without labels, and the resulting code serves as pretraining or as a representation for other tasks."],
      ["Linear = PCA", "A linear autoencoder with a k-dimensional bottleneck learns the same subspace as principal component analysis: the k directions of largest variance. Projecting onto the main direction loses only the variance perpendicular to it."],
      ["Nonlinearity and embeddings", "When data live on a curve (a ring, for example), no line summarizes them, but a nonlinear code (the angle) does. Word embeddings follow the same idea: dense vectors whose geometry encodes meaning."]
    ],
    tasks: { autoenc1: { t: "Ellipse, 1-dimensional code, linear encoder: rotate the direction until the error is within 5% of the minimum.", h: "The best direction is the one of largest variance: the long axis (first principal component)." },
      autoenc2: { t: "Now find the worst direction (error within 5% of the maximum).", h: "It is perpendicular to the best one: the short axis." },
      autoenc3: { t: "On the ring, with a linear encoder and 1 dimension, find the best direction and see that the error stays near half the variance.", h: "A ring has no preferred direction: every line loses almost half the information." },
      autoenc4: { t: "On the ring, switch to the nonlinear (angle) encoder and bring the error below 10% of the best linear one.", h: "A single number, the angle, describes a point on the ring well. That is what a nonlinear autoencoder can learn." } } },
  nn11: { client: "Faded label reader", title: "A memory that completes itself",
    story: "Box labels arrive smudged, with half the pixels flipped. Instead of classifying, the idea is an associative memory: store the clean letters and, faced with a dirty version, let the network roll downhill to the nearest memory. This is the Hopfield network, tied to the physics of magnets and to the rule Hebb stated in 1949: neurons that fire together wire together.",
    theory: [
      ["Hebb's rule", "To store patterns p (with values ±1), the weights are W = Σ p·pᵀ / N, with no self-connections. Each pattern strengthens the links between pixels that agree. No gradient, no epochs: learning is adding correlations."],
      ["Energy and attractors", "The dynamics set each neuron to the sign of Σ wᵢⱼxⱼ. The energy E = −½ xᵀWx never goes up, so the network descends to a local minimum. Stored patterns are energy valleys (attractors); the inverse −p is too, because the rule is symmetric."],
      ["Capacity and modern Hopfield", "With N neurons, the classic network stores about 0.14·N random patterns; beyond that, spurious states appear and memories blend. Modern Hopfield networks use exponential energies, store far more and have the same mathematical form as transformer attention."]
    ],
    tasks: { hopfield1: { t: "Store at least 2 letters, corrupt the target letter with ≥ 20% noise and recover it exactly.", h: "Tick T and L, choose T, noise 20%, Corrupt and then Recover." },
      hopfield2: { t: "Store 5 or more letters and show a recovery failure from ≥ 20% noise.", h: "Capacity is ≈ 0.14·N = 3.5 patterns for 25 neurons. Beyond that, spurious states appear; try a few times." },
      hopfield3: { t: "With ≥ 70% noise, make the network converge to the exact inverse of the letter.", h: "If W stores p, it also stores −p. A state closer to −p falls there." },
      hopfield4: { t: "Store exactly 3 letters and recover each of them from ≥ 20% noise.", h: "Pick dissimilar letters (T, L, X) and do Corrupt → Recover for each target." } } },
  nn12: { client: "Digitizing part profiles", title: "A network that is the signal itself",
    story: "A part's profile was measured at 48 points and the team wants a continuous representation to query any position. Instead of storing the table, they train a network that takes the coordinate x and returns the height: a neural field. The surprise: the network quickly learns the overall shape, but the fine details do not appear even after thousands of steps. A simple trick changes everything: before entering the network, x becomes sines and cosines.",
    theory: [
      ["Neural fields", "A neural field is an MLP that maps coordinates to values: x → signal, (x, y) → color, (x, y, z) → density. The network is a continuous, compact representation, used for images, 3D shapes (NeRF) and solutions of equations (PINNs)."],
      ["Spectral bias", "Networks trained by gradient descent learn low-frequency components first; high frequencies take very long or never arrive. Analogy: sketching the outline first and the details later, but with an eraser that removes details faster than you can draw them."],
      ["Fourier features", "Replacing x by [sin(2πBx), cos(2πBx)], with frequencies B drawn from a normal of scale σ, gives the network direct access to high frequencies. Too small a σ stays smooth; too large a σ memorizes the points and oscillates between them, overfitting in the frequency domain."]
    ],
    tasks: { field1: { t: "Without Fourier features, train ≥ 2000 steps and see training error stay above 0.02.", h: "The network learns low frequencies first (spectral bias); the fast details take very long." },
      field2: { t: "Turn on Fourier features and bring test error below 0.005.", h: "σ between 2 and 6 usually does it. Train ×500 a few times." },
      field3: { t: "With σ ≥ 30, reach training error < 0.005 and test error > 0.03.", h: "Too-high frequencies memorize the points and oscillate between them." },
      field4: { t: "With at most 6 features, reach test error < 0.01.", h: "A few well-scaled frequencies suffice for a 3-component signal. Keep σ low." } } },
  nn13: { client: "Designing the defect classifier", title: "How much network the problem needs",
    story: "Time to design the real defect classifier. The two classes wind around each other like two spirals, and the embedded chip's budget is tight: every parameter costs memory. The design question is not 'what is the largest possible network' but 'what is the smallest network that solves this well with the data I have'. Depth, width, learning rate and amount of data all enter the same equation.",
    theory: [
      ["Depth and width", "Without hidden layers, the boundary is a line. Each layer adds folds; wider layers add folds in parallel, deeper layers compose them. Parameters of a dense layer: inputs × outputs + biases."],
      ["Data and generalization", "With little data, a large network memorizes the training set (100%) and generalizes poorly. More data, regularization or a smaller network shrink the gap between training and validation. Data augmentation and transfer learning are the same idea at scale."],
      ["Design practice", "Start small and grow until validation stops improving; watch training and validation together; tune the learning rate before touching the architecture; log every experiment. It is Karpathy's recipe: first make it overfit, then regularize."]
    ],
    tasks: { spiral1: { t: "With depth 0 (logistic regression), train ≥ 200 steps: validation stays at or below 70%.", h: "Without a hidden layer the boundary is a line; interleaved spirals are not linearly separable." },
      spiral2: { t: "Reach 95% validation accuracy.", h: "Two layers of 8 units, learning rate 0.03, train ×200 several times." },
      spiral3: { t: "Reach 90% validation accuracy with at most 70 parameters.", h: "Parameters of a layer: inputs × outputs + biases. Try 1 layer of 12 or 2 of 6." },
      spiral4: { t: "With at most 30 training points, reach 100% on training and at least 8 points less on validation.", h: "Little data and a big network: it memorizes. Use 3 layers of 24." } } },
  nn14: { client: "Wrap-up: the optimization team", title: "One function, one loss, one optimizer",
    story: "At the end of the course, the team gets a different problem: tuning two parameters of a machine whose performance has dozens of false valleys. Gradient descent, which worked so well for networks, falls into the first valley and stops. A colleague proposes another family of computational intelligence: a population of solutions that reproduces, mixes and mutates, as in evolution. Neural networks, evolutionary computation and fuzzy logic are the field's three traditions.",
    theory: [
      ["The three paradigms", "Neural networks learn representations with gradients; evolutionary computation searches with a population, selection and variation; fuzzy systems reason with graded memberships. Every problem in the course fit three choices: a function (the model), a loss and an optimizer."],
      ["Gradients and local minima", "Gradient descent uses only the local slope. On landscapes with many valleys, such as the Rastrigin function, it stops at the minimum nearest to the starting point. In large networks this hurts less, because in high dimension almost every critical point is a saddle."],
      ["Genetic algorithm", "Selection (the best reproduce), crossover (mixing parents) and mutation (noise) create new generations. Without mutation the population never leaves the region where it was born; with too much, it becomes random search. Elitism keeps the best found."]
    ],
    tasks: { evo1: { t: "Run gradient descent from (3.3, 3.1) and watch it stop at a local minimum (f > 1).", h: "The gradient only sees the neighborhood: it falls into the nearest valley." },
      evo2: { t: "With the genetic algorithm, find a point with f < 0.1.", h: "Mutation around 0.5 and 30 to 60 individuals; run +50 a few times." },
      evo3: { t: "Set mutation to zero and run ≥ 50 generations: the best stays above 1.", h: "Crossover only mixes parents: the population never leaves the square where it was born, far from the origin." },
      evo4: { t: "Find f < 0.1 in at most 60 generations.", h: "Set population and mutation before running (New population resets the generations). Start with 60 individuals and σ = 0.5." } } },

  rl03: { client: "Rover learning without a map", title: "Wait for the end or learn along the way",
    story: "The rover no longer knows the terrain's probabilities: it can only move and observe. In a corridor of five segments, A to E, it starts in the middle and moves left or right at random; exiting on the right earns 1 point, on the left nothing. What is each segment worth? One strategy waits for each trip to end and uses the total (Monte Carlo). Another adjusts the value at every step, using the estimated value of the next segment (temporal difference).",
    theory: [
      ["Monte Carlo", "Estimates V(s) by averaging the returns observed after visiting s: V(s) ← V(s) + α(G − V(s)). It is unbiased, but must wait for the episode to end and inherits all the variance of the return."],
      ["TD(0)", "Updates every step with a target that uses its own estimate: V(s) ← V(s) + α(r + γV(s') − V(s)). The term in parentheses is the TD error δ. It is biased (the target depends on a still-wrong V) but has far less variance; it usually learns faster, as in Sutton and Barto's random-walk example."],
      ["Step size and batch", "A large α reacts fast but never settles; a small α settles but is slow. In batch mode (replaying the same episodes until convergence), MC minimizes error on the observed returns while TD converges to certainty equivalence: the value of the maximum-likelihood MDP."]
    ],
    tasks: { mctd1: { t: "Bring the average RMS error of TD(0) below 0.08.", h: "α = 0.05 to 0.1 and about 100 episodes." },
      mctd2: { t: "Bring the average RMS error of Monte Carlo below 0.08.", h: "MC is noisier: use a small α (0.01 to 0.02) and more episodes." },
      mctd3: { t: "With α_TD ≥ 0.5 and ≥ 100 episodes, show TD error staying above 0.1.", h: "A large step makes the value jump every episode and never settle." },
      mctd4: { t: "With the same α (≤ 0.1) for both and ≥ 50 episodes, show TD with lower error than MC.", h: "Match the sliders (0.05), reset and run +10 a few times." } } },
  rl04: { client: "Rover at the cliff edge", title: "The optimal path and the safe path",
    story: "Between the base and the sample there is a cliff. The shortest path hugs the edge; any misstep sends the rover back to the start with −100. During training, the rover sometimes picks a random move (ε), and that is where the two algorithms disagree. Q-learning learns the optimal path assuming it will act perfectly in the future. SARSA learns the value of what it actually does, stumbles included, and prefers to stay away from the edge.",
    theory: [
      ["Model-free control", "To choose actions without knowing P, learn Q(s, a) instead of V(s). Generalized policy iteration alternates evaluation and improvement; ε-greedy ensures exploration: with probability ε, a random action."],
      ["SARSA × Q-learning", "SARSA (on-policy) uses the target r + γQ(s', a'), with a' the action that will actually be taken. Q-learning (off-policy) uses r + γ maxₐ' Q(s', a'), the value of the greedy action. With ε > 0, SARSA accounts for the risk of stumbling; Q-learning ignores it in the target."],
      ["Approximation and DQN", "With too many states for a table, Q becomes a neural network. DQN stabilizes Q-learning with experience replay and a frozen target network. The deadly triad (approximation, bootstrapping and off-policy) explains why this can diverge."]
    ],
    tasks: { cliff1: { t: "Make Q-learning's greedy path optimal (13 steps, along the cliff).", h: "Run about 100 to 300 episodes with ε = 0.1." },
      cliff2: { t: "With ε ≥ 0.05, make SARSA learn a safe path away from the cliff (more than 13 steps).", h: "SARSA evaluates the policy it actually runs, including ε's stumbles. Its path may take 300 to 500 episodes to settle." },
      cliff3: { t: "With ε ≥ 0.05 and ≥ 200 episodes, show SARSA with higher online average reward than Q-learning.", h: "Q-learning learns the optimal path but falls off during training because of ε." },
      cliff4: { t: "Reset with ε ≤ 0.01 and train: SARSA also finds the 13-step path.", h: "Without random exploration, behavior is greedy and SARSA becomes Q-learning. Set ε to zero before training." } } },
  rl05: { client: "Rover sampling strategy", title: "Push the policy toward what worked",
    story: "Instead of estimating values, the team decides to adjust the rover's policy directly: the probabilities of choosing each of three routes. After each trip, the chosen route becomes more likely if the reward was good. It works, but it is noisy: if all rewards are high, every chosen route gets reinforced and only chance separates the best ones. Subtracting a baseline, what one expected to earn, removes much of the noise.",
    theory: [
      ["Why parameterize the policy", "Parameterized policies πθ(a|s) handle continuous actions, can be stochastic and change smoothly with θ. The goal is to maximize J(θ) = E[R] directly, without going through Q."],
      ["The likelihood-ratio trick", "∇J = E[R · ∇log πθ(a)]. Just sample actions and weight the score function ∇log π by the reward: that is REINFORCE. For a softmax, ∇log π(a) = 1ₐ − π."],
      ["Baseline and entropy", "Subtracting b from R does not change the expected gradient (E[∇log π] = 0), but it can cut variance a lot; the natural choice is b ≈ E[R]. An entropy bonus keeps the policy from collapsing onto a single action too early. The next step is actor-critic: a learned critic plays the baseline's role."]
    ],
    tasks: { reinforce1: { t: "Make the policy choose the best action (arm 2) with ≥ 90%.", h: "α = 0.1 and a few hundred updates." },
      reinforce2: { t: "With offset ≥ 10 and the baseline on, reach 90% in at most 400 updates.", h: "Turn on the baseline before training (the checkbox resets the policy)." },
      reinforce3: { t: "With offset ≥ 10 and ≥ 50 updates, show the variance without baseline ≥ 10× the variance with baseline.", h: "Adding a constant to the reward does not change the expected gradient, but it inflates the noise of R·∇log π." },
      reinforce4: { t: "With an entropy bonus β > 0, after ≥ 500 updates, keep the most likely action between 40% and 80%.", h: "Entropy pushes toward more spread-out policies. Try β ≈ 1 with the baseline." } } },
  rl06: { client: "Stable controller training", title: "Improve without straying too far",
    story: "Policy gradient worked, but one step that was too large ruined in a minute a controller that took hours to train. The problem: the data were collected by the old policy, and after a big step they no longer represent the new one. PPO offers a simple brake: measure how much the new policy changed each action's probability (the ratio r) and stop rewarding changes beyond a ±ε band.",
    theory: [
      ["Reusing data: importance sampling", "With data from πold, the new policy's gain can be estimated by the surrogate objective E[r·Â], with r = πnew(a|s)/πold(a|s). The estimate is reliable only while r stays near 1; far from it, variance explodes."],
      ["PPO's clip", "L = min(r·Â, clip(r, 1−ε, 1+ε)·Â). With a positive advantage, the incentive ends once r exceeds 1+ε; with a negative advantage, once it drops below 1−ε. The min always picks the more pessimistic term, so the clip never prevents correcting a mistake."],
      ["Trust regions", "TRPO explicitly limits the KL divergence between policies; PPO gets a similar effect with the clip, far simpler to implement. Relative performance bounds guarantee improvement when policies stay close."]
    ],
    tasks: { ppo1: { t: "With Â > 0, put r above 1 + ε and watch the gradient become zero.", h: "The action is already likely enough; the clip removes the incentive to go further." },
      ppo2: { t: "With Â < 0, put r below 1 − ε and watch the gradient become zero.", h: "Mirror of the previous case." },
      ppo3: { t: "With Â > 0, put r below 1 − ε: the gradient does NOT become zero.", h: "The min picks the pessimistic term; here it is r·Â, which still pulls upward." },
      ppo4: { t: "With Â < 0, put r above 1 + ε: the gradient does NOT become zero.", h: "The policy became more prone to a bad action: PPO corrects it without clipping." } } },
  rl07: { client: "The controller's critic", title: "One knob between bias and variance",
    story: "The actor needs to know whether an action was better than expected: the advantage. Looking only at the next step relies heavily on the critic, which may be wrong. Looking at the whole trajectory uses only real rewards, but accumulates all the noise along the way. Generalized advantage estimation (GAE) blends every option with a single knob, λ, and the best setting depends on how much you trust the critic and how noisy the rewards are.",
    theory: [
      ["The TD error as a one-step advantage", "δₜ = rₜ + γV(sₜ₊₁) − V(sₜ) estimates the advantage with low variance, but inherits the critic's error in future states. The current state's V(s₀) acts as a baseline and does not bias the gradient."],
      ["GAE(λ)", "Âₜ = Σₗ (γλ)ˡ δₜ₊ₗ. With λ = 0, Â = δ (one-step TD); with λ = 1, the intermediate values cancel and Â becomes the Monte Carlo return minus V(sₜ). Intermediate values weight horizons exponentially."],
      ["Choosing λ", "A poor critic calls for larger λ (less trust in bootstrapping); noisy rewards call for smaller λ (less summed noise). In practice, λ ≈ 0.95 with γ ≈ 0.99 is PPO's default, but the optimum depends on the problem."]
    ],
    tasks: { gae1: { t: "Set λ = 0 and see Â_t become δ_t (one-step TD).", h: "With λ = 0 the sum has only its first term." },
      gae2: { t: "Set λ = 1 and see Â become the Monte Carlo return minus V̂(s₀).", h: "With λ = 1 the intermediate V̂ cancel out (telescoping sum)." },
      gae3: { t: "With critic error ≥ 0.4 and noise ≥ 0.2, set λ within 0.1 of the best λ (which must lie strictly between 0.05 and 0.95).", h: "Find the bottom of the red curve. A poor critic pushes λ toward 1; high noise pushes it toward 0. Try error 0.6 and noise 0.3." },
      gae4: { t: "With a perfect critic (error 0) and noise ≥ 0.2, set λ ≤ 0.05 and confirm it is the best.", h: "If V̂ is exact, one-step TD is unbiased and has the lowest variance." } } },
  rl08: { client: "Maintenance assistant", title: "Learning what people prefer",
    story: "The maintenance assistant writes answers, and nobody can grade them on an absolute scale, but it is easy to say which of two is better. The team collects comparisons, fits a reward model that explains those preferences, and then optimizes the assistant against that model. There are two traps: noisy annotators, and an assistant that, unchecked, exploits the reward model's flaws instead of genuinely improving.",
    theory: [
      ["Bradley–Terry", "Assume P(i ≻ j) = σ(rᵢ − rⱼ). Fitting r by maximum likelihood on the comparisons gives one number per answer. Only differences matter; noisy annotators compress the learned differences."],
      ["RLHF with a KL penalty", "Maximize E[r̂] − β·KL(π‖πref). The solution is π ∝ πref·exp(r̂/β): a large β keeps the policy close to the reference; a small β drives it to the argmax of r̂, where reward-model errors turn into reward hacking."],
      ["DPO", "Direct preference optimization uses the same closed-form solution to train the policy straight from comparisons, with no explicit reward model and no RL. Imitation and inverse RL are the other routes to 'where does the reward come from'."]
    ],
    tasks: { rlhf1: { t: "Collect ≥ 30 comparisons and reach Kendall's τ ≥ 0.8 between r̂ and true quality.", h: "With noise 0.5, about 40 comparisons are enough." },
      rlhf2: { t: "With ≥ 10 comparisons, tune β for KL ≤ 0.3 and expected quality at least 0.5 above the reference.", h: "A large β ties the policy to the reference; a small β lets it loose. Look for β ≈ 2." },
      rlhf3: { t: "With ≥ 10 comparisons and β ≤ 0.05, show the policy drifting from the reference (KL ≥ 1.5).", h: "Without the KL brake, the policy becomes the argmax of r̂ and trusts the reward model blindly." },
      rlhf4: { t: "With annotator noise ≥ 2 and ≥ 60 comparisons, see r̂'s range fall below 60% of the true one (3.4).", h: "Very noisy annotators make preferences look balanced: Bradley–Terry compresses the differences. Reset after changing the noise." } } },
  rl09: { client: "Choosing a parts supplier", title: "Explore or exploit",
    story: "Five suppliers deliver parts of varying quality, and the plant buys from one per day. Always buying from the one that looks best so far can trap the plant with a mediocre supplier that got lucky early. Testing everyone all the time wastes purchases. Regret measures the total cost of not having picked the best from the start, and the question is how to make it grow as slowly as possible.",
    theory: [
      ["Multi-armed bandits and regret", "Each arm a has an unknown mean μₐ. Regret after T steps is Σₜ (μ* − μₐₜ). Bad strategies have regret linear in T; good ones, logarithmic. Greedy fails because it never revisits an underestimated arm."],
      ["ε-greedy", "With probability ε, explore at random. It fixes getting stuck, but keeps exploring forever at the same rate, including arms that are clearly bad: regret stays linear (with a smaller slope)."],
      ["Optimism in the face of uncertainty: UCB", "Choose argmax Q(a) + c√(ln t / n(a)): the bonus is large for rarely tried arms and shrinks with use. UCB has O(log T) regret, close to the Lai–Robbins lower bound. Too large a c explores too much."]
    ],
    tasks: { bandit1: { t: "Run greedy and show it picks the optimal arm less than 60% of the time (last 100 steps).", h: "Without exploration, it gets stuck with the first arm that looked good." },
      bandit2: { t: "Run an ε-greedy with ε between 0.05 and 0.2 that has lower regret than greedy.", h: "Run greedy first to compare." },
      bandit3: { t: "Run a UCB with lower regret than every ε-greedy already run.", h: "c ≈ 1 usually does well." },
      bandit4: { t: "Show that too much exploration hurts: a UCB with c ≥ 5 worse than a UCB with c ≤ 2.", h: "Run both; a large c spends steps on arms already ruled out." } } },
  rl10: { client: "Supplier audit", title: "How many tests to be sure",
    story: "The audit wants to state, with 95% confidence, that supplier 1 is better than supplier 2. Each test is a good or bad part. With few tests, the observed averages overlap; with many, the confidence intervals shrink and separate. Hoeffding's inequality says exactly how fast the intervals shrink, assuming nothing about the distribution beyond values between 0 and 1.",
    theory: [
      ["Concentration: Hoeffding", "For n samples in [0, 1], P(|μ̂ − μ| ≥ ε) ≤ 2·exp(−2nε²). Inverting: with probability ≥ 1 − δ, |μ̂ − μ| ≤ √(ln(2/δ)/(2n)). Width falls as 1/√n: halving the interval takes 4× the samples."],
      ["How many samples (PAC)", "For half-width ε with confidence 1 − δ: n ≥ ln(2/δ)/(2ε²). Separating arms with gap Δ needs ε ≈ Δ/2, so n ∝ 1/Δ². Similar arms are expensive. This is the PAC criterion: probably approximately correct."],
      ["Reading the UCB bound", "UCB's bonus is this same width, with δ shrinking with t. Adding up the steps spent on each bad arm (≈ ln T / Δ²) yields regret O(Σ ln T / Δ). Higher confidence (smaller δ) is cheap, because ln(2/δ) grows slowly."]
    ],
    tasks: { hoeffding1: { t: "With Δ ≥ 0.2, pull until the intervals separate.", h: "About 100 pulls per arm." },
      hoeffding2: { t: "With Δ ≤ 0.1, separate the intervals.", h: "Width falls as 1/√n: half the gap takes 4× the pulls." },
      hoeffding3: { t: "Compute: how many pulls per arm for half-width ≤ 0.05 with δ = 0.05? Type n.", h: "Solve √(ln(2/δ)/(2n)) ≤ ε: n ≥ ln(2/δ)/(2ε²)." },
      hoeffding4: { t: "With δ ≤ 0.01 and Δ ≥ 0.3, separate the arms with at most 200 pulls per arm.", h: "Higher confidence widens the interval only a little, because ln(2/δ) grows slowly." } } },
  rl11: { client: "A/B test of a new material", title: "Sample in proportion to belief",
    story: "Three metal alloys are being tested, and every part produced is a success-or-failure experiment. Instead of an optimism bonus, the team keeps a belief about each alloy's success rate: a Beta distribution that narrows with every result. For each part, draw one rate from each belief and use the alloy whose draw was highest. Promising but uncertain alloys still get chances; clearly worse ones almost never.",
    theory: [
      ["Bayesian inference in one line", "With a Beta(α, β) prior and Bernoulli outcomes, the posterior stays Beta: add 1 to α on each success and 1 to β on each failure. The mean is α/(α+β) and the width shrinks with the number of observations."],
      ["Thompson sampling", "Draw θₐ ~ Beta(αₐ, βₐ) for each arm and choose argmax θₐ. Each arm is chosen with the probability of being the best under the current belief: exploration in proportion to uncertainty. Bayesian regret is O(log T), competitive with UCB."],
      ["Where it fails and what comes next", "Bad priors slow it down, very close arms need many steps, and in MDPs exploration must be deep (PSRL). The Gittins index solves the discounted Bayesian problem optimally, but is expensive."]
    ],
    tasks: { thompson1: { t: "On the easy preset, after ≥ 200 Thompson steps, pull the best arm (3) ≥ 70% of the time.", h: "Run +500. Thompson concentrates pulls as the posteriors narrow." },
      thompson2: { t: "Pull arm 1 by hand ≥ 20 times until the posterior mean is within 0.05 of the true value.", h: "Each pull adds 1 to α (success) or to β (failure). The true value is the dashed line." },
      thompson3: { t: "On the close preset, reach P(arm 3 is best) ≥ 90%.", h: "Similar arms need many steps. If the search gets stuck on arm 2, reset." },
      thompson4: { t: "Run the comparison and confirm Thompson has lower regret than greedy.", h: "Greedy-by-mean never revisits an arm that was unlucky early." } } },
  rl12: { client: "Rover swimming upstream", title: "The reward nobody sees",
    story: "A water rover sits in a river of six segments. At the starting bank there is a tiny, certain reward. At the source, upstream, there is a big one, but the current makes most attempts to swim up fail. Random exploration almost never makes the rover persist long enough to get there. Unlike bandits, exploring here requires planning several steps in a row: this is RiverSwim, the classic example from the lectures on fast learning in MDPs.",
    theory: [
      ["Why MDPs are different", "In a bandit, testing an arm costs one step. In an MDP, reaching a rarely visited state may require a long sequence of actions that only pays off if the agent already believes something is there. ε-greedy produces random walks and takes exponential time on RiverSwim."],
      ["Optimism: MBIE-EB", "Estimate the model (transitions and mean rewards) from counts and add a bonus β/√n(s,a) to the reward before planning. Rarely visited pairs look valuable, and planning builds deliberate routes to visit them: deep exploration. It has PAC guarantees."],
      ["Posterior sampling (PSRL)", "The Bayesian version: sample an MDP from the posterior each episode and follow its optimal policy. The simulation lemma links model error to value error and underlies the proofs of these algorithms."]
    ],
    tasks: { riverswim1: { t: "With ε-greedy (ε ≥ 0.05) and ≥ 200 episodes, see the agent almost never reach s5 (≤ 2 visits).", h: "Reaching s5 takes many 'right' moves in a row against the current; ε rarely produces that." },
      riverswim2: { t: "With the exploration bonus, make the agent visit s5.", h: "β ≈ 0.1 to 0.5: rarely visited pairs look valuable until they are tried." },
      riverswim3: { t: "With the bonus, make the greedy policy choose right in every state.", h: "Run +200 episodes with a moderate β." },
      riverswim4: { t: "With β ≤ 0.01 and ≥ 200 episodes, show that a tiny bonus is not enough (s5 never visited).", h: "Optimism must outweigh the small, certain reward at the bank." } } },
  rl13: { client: "Planning at decision time", title: "Simulate before you play",
    story: "Instead of learning a policy for every state in the world, the agent can plan only from the state it is in right now. In tic-tac-toe, before each move, it simulates many games to the end with random moves and keeps the statistics in a tree. Moves that look good get more simulations, but none is ever abandoned for good. This Monte Carlo tree search led computers to win at Go.",
    theory: [
      ["Decision-time planning", "Instead of solving the whole MDP, spend computation only on the current state. Simple Monte Carlo search scores each action by the average of rollouts; the tree reuses those statistics and goes deeper where it matters."],
      ["MCTS in four phases", "Selection (descend the tree choosing children), expansion (add a new node), simulation (random rollout to the end) and backpropagation (update wins and visits along the path). The final decision is the most visited move."],
      ["The UCT rule", "During selection, pick argmax Q + c√(ln N / n): UCB applied at each node. c balances deepening the best move against checking the others. With few iterations, the statistics are noisy and the decision is unreliable."]
    ],
    tasks: { mcts1: { t: "Position A: after ≥ 100 iterations, the most visited move must be the win (cell 2).", h: "X has two in a row on the top row." },
      mcts2: { t: "Position B: after ≥ 100 iterations, the most visited move must be the block (cell 2).", h: "O threatens to complete the top row." },
      mcts3: { t: "Position B with at most 20 iterations: find a search in which the most visited move is NOT yet the block.", h: "Few iterations = noisy statistics. Use Reset and +10 a few times." },
      mcts4: { t: "Position A with c ≥ 2.5 and ≥ 1000 iterations: bring the best move's share of visits below 95%.", h: "More exploration spends visits on bad moves, just to be sure." } } },
  rl14: { client: "The loop that makes its own data", title: "A network that suggests, a search that corrects",
    story: "Pure MCTS treats every move as equally promising at first. AlphaZero adds a network that looks at the board and suggests probabilities (the prior) and a value. The search uses these suggestions to decide where to spend simulations; then the search's visit distribution becomes the training target for the network itself. Playing against itself, the network learns what the search discovered, and the next search starts from a better place.",
    theory: [
      ["PUCT: search guided by a network", "Selection uses Q + c·P(a)·√N / (1 + n): moves with a high prior are explored first, and the term shrinks with visits. A good prior saves simulations; a bad one wastes them, but the search still corrects it given enough budget."],
      ["Self-play", "The network plays itself with search; the visit distribution becomes the policy target and the game's outcome becomes the value target. It is an improvement loop: search amplifies the network, and the network distills the search."],
      ["A critical look", "AlphaZero mastered chess, shogi and Go with no human knowledge; MuZero even dropped the rules, learning the model. But search needs reliable simulators, and there is debate about whether UCT is the right rule outside two-player games."]
    ],
    tasks: { alphazero1: { t: "With a good network (quality ≥ 0.5), find the block with at most 50 simulations.", h: "A good prior focuses the search from the start." },
      alphazero2: { t: "With a bad network (quality ≤ −0.8), find the block with ≥ 800 simulations.", h: "Search corrects the network when it has the budget." },
      alphazero3: { t: "Start from a bad network (≤ −0.5) and train by self-play ≥ 3 times until the network itself prefers the block.", h: "Each cycle: simulate (+100) and then 'train': the prior learns the visit distribution." },
      alphazero4: { t: "With a bad network (≤ −0.8) and at most 50 simulations, show the search choosing wrong.", h: "Too little search inherits the prior's mistake." } } }
};
const SIM = {
  overfit: { degree: "Polynomial degree", newData: "New data", fitT: "fit (●train ○validation)", curveT: "error × degree (log scale)", train: "train", val: "validation" },
  conv: { preset: "Filter", pId: "Identity", pVert: "Vertical edge (Sobel x)", pHor: "Horizontal edge (Sobel y)", pBlur: "Blur", pSharp: "Sharpen", pool: "2×2 max-pooling", tip: "Click the filter cells to change the weights (0 → 1 → 2 → −2 → −1).", input: "input", kernel: "3×3 filter", output: "output", size: "Output size" },
  rnn: { recurrent: "recurrent weight", forget: "forget gate", cell: "Cell", mTanh: "RNN with tanh", mLin: "Linear RNN", mGate: "Gated (LSTM)", steps: "Steps T", memT: "memory: state over time (pulse at t=1)", gradT: "|gradient back to t=1| (log)" },
  attention: { words: "cat,dog,car,road,the", angle: "Query angle", temp: "Temperature", wT: "attention weights" },
  autoenc: { data: "Data", dEll: "Ellipse", dRing: "Ring", enc: "Encoder", eLin: "Linear (projection)", ePolar: "Nonlinear (angle)", code: "Code size", angle: "Code direction", pts: "●data ○reconstruction", curveT: "error × direction (linear, 1D)", err: "Error", varT: "total variance", lost: "lost" },
  hopfield: { store: "Store:", target: "Target letter", noise: "Noise", corrupt: "Corrupt", run: "Recover", tip: "Noise flips each pixel's sign with this probability.", state: "network state", targetL: "target", okRec: "Letter recovered", invRec: "Fell into the letter's inverse", noRec: "Spurious state (not the letter)", ready: "Ready", before: "before", storedN: "stored letters" },
  field: { useFF: "Use Fourier features", scale: "frequency scale", nfeat: "Number of features (m)", train500: "Train ×500", reinit: "Reset", legend: "dashed: true signal · ●training samples · line: network", trainE: "train", testE: "test", stepsL: "steps" },
  spiral: { depth: "Hidden layers", width: "Width", ntrain: "Training points", lr: "Learning rate", train200: "Train ×200", reinit: "Reset", arch: "architecture", params: "parameters", trainAcc: "train accuracy", valAcc: "validation accuracy", stepsL: "steps" },
  evo: { pop: "Population", mut: "Mutation σ", gen10: "+10 generations", gen50: "+50 generations", newPop: "New population", gd: "Run gradient descent", genL: "generations", bestGA: "best f (genetic)", gdL: "final f (gradient)", globalL: "global minimum" },
  mctd: { reset: "Reset", tip: "Curves: average of 20 independent runs. Left: the estimates of one run.", vT: "V(s): dashed true · TD · MC", rmsT: "average RMS error × episodes", episodes: "Episodes", avg20: "average of 20 runs" },
  cliff: { ep: "episodes", reset: "Reset", steps: "steps", noPath: "no path yet", online: "average reward (last 100)", rewT: "reward per episode (moving average)", episodes: "Episodes" },
  reinforce: { offset: "Reward offset", entropy: "entropy", baseline: "Use baseline b = mean of R", reset: "Reset", arms: "action 1,action 2,action 3", pBestT: "π(best action) during training", varNB: "gradient variance without baseline", varB: "with baseline", ratio: "ratio", updates: "Updates", best: "best" },
  ppo: { adv: "Advantage", ratio: "Ratio", objT: "L_clip(r) (solid) · r·Â (dashed) · band [1−ε, 1+ε]", zero: "zero gradient" },
  gae: { critic: "Critic error", noise: "Reward noise", resample: "New trajectory", mseT: "error of Â₀ × λ", bias2: "bias²", varL: "variance", bestL: "best λ" },
  rlhf: { noise: "Annotator noise", cmp: "comparisons", reset: "Reset", tip: "Answers A–F. The annotator prefers the better one with probability σ((qᵢ − qⱼ)/noise).", trueQ: "true quality (hidden from the model)", rhat: "reward model r̂ (Bradley–Terry)", range: "range" },
  bandit: { alg: "Strategy", greedy: "Greedy", run: "Run 200 runs", clear: "Clear", regT: "average cumulative regret", regretL: "regret", optL: "optimal arm", empty: "Run a strategy to see its curve.", arms: "Arms", runs: "runs", stepsL: "steps" },
  hoeffding: { gap: "Gap", each: "per arm", reset: "Reset", askN: "Your answer: n =", arm: "Arm", separated: "Intervals separated: arm 1 is better with confidence 1 − δ", overlap: "Intervals overlap" },
  thompson: { preset: "Arms", easy: "Easy", close: "Close", reset: "Reset", manual: "Pull by hand:", arm: "Arm", compare: "Compare with greedy (50 runs)", postT: "Beta posteriors (dashed: true value)", man: "manual", best: "best", cmpRes: "average regret", greedyL: "greedy", pulls: "pulls", shareBest: "on the best arm" },
  riverswim: { method: "Method", greedy: "greedy", bonusM: "Exploration bonus (MBIE-EB)", bonus: "bonus", ep: "episodes", reset: "Reset", vis: "visits", current: "Arrows: current greedy policy. Color: how often each segment was visited.", episodes: "Episodes", avgRet: "average return (last 50)" },
  mcts: { pos: "Position", posA: "A: X can win", posB: "B: X must block", reset: "Reset", xmove: "X to move.", iters: "iterations", topMove: "Most visited move", cell: "cell", legend: "N visits · Q average value for X", ofVisits: "of visits" },
  alphazero: { netQ: "Network quality (prior)", sims: "simulations", reset: "Reset search", train: "Train the network on the visits (self-play)", tip: "Position B: X must block at cell 2. Negative quality = a network that steers away from the block.", xmove: "X to move.", simsL: "simulations", netPick: "Network's choice", searchPick: "Search's choice", cell: "cell", trainedL: "self-play cycles" }
};
for (const id in L) LANG.en.lessons[id] = Object.assign(LANG.en.lessons[id] || {}, L[id]);
Object.assign(LANG.en.sims, SIM);
})();
