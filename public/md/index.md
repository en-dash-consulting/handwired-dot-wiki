# Handwired: your JavaScript, running as a neural net that can learn

> Handwired by Cheng Lou turns JavaScript into an exact, differentiable neural net that runs in the browser. Live demos, plain-English guides and FAQ.

Source: https://handwired.wiki/

## When would you use this?

<div class="uc-cards">
<a class="card feature" href="/pages/ranking.html"><h3>Ranking from clicks</h3><p>Your hand-tuned search formula learns its weights from shoppers. "Pinned first" and "never show out-of-stock" stay exact. A generic model breaks both.</p></a>
<a class="card" href="/pages/layout.html"><h3>Layout from a designer's drags</h3><p>Drag a few cards to the sizes you want; the layout function's constants update and every card follows, with zero overflows.</p></a>
<a class="card" href="/pages/physics.html"><h3>Physics from a recording</h3><p>Fit gravity, drag and bounce so a simulated ball matches a recorded path, then replay it as code.</p></a>
<a class="card" href="/pages/color-themes.html"><h3>Accessible colour themes</h3><p>Point at the colours you like; the theme function learns its constants for light and dark, and every text pair stays WCAG AA.</p></a>
<a class="card" href="/pages/gpu-search.html"><h3>Search 100,000 JSON docs on the GPU</h3><p>Cheng Lou's demo: plain-looking matching code run as GPU programs, with the same answers as JavaScript.</p></a>
</div>

New to the idea? The <a href="/pages/js-vs-nn.html">beginner lesson</a> (a cat deciding how hard to jump) explains it from scratch in three minutes.

<p class="lede"><strong>Handwired</strong> is an open-source project by <a href="https://chenglou.me">Cheng Lou</a> that turns regular JavaScript code into a neural net: no training, exact, yet fully differentiable, and runnable in a browser without a GPU. This site is an independent, hands-on guide with live demos that run the real Handwired runtime.</p>

## What is Handwired?

Handwired is a way to write a program as **a fixed list of 32-bit float operations** — weighted sums, products with a ReLU, and a few exact helpers — so the program *is* a neural network. Its weights are written by hand (hence the name) instead of learned, which is why it is exact. Because it only uses differentiable primitives, you can still compute gradients through it and train its numbers later.

The canonical example from the [Handwired homepage](https://chenglou.me/handwired/):

```js
// your code
const result = a > 4 ? 10 : 12

// turns into (relu(x) is Math.max(0, x))
const above4 = relu(a - 4) - relu(a - 5)
const result = above4 * 10 + (1 - above4) * 12
```

For any integer `a`, both versions return the same number. [Try it live →](/pages/soft-switch.html)

## What can you do with it?

- **Run UI logic as a network.** [Handwired's own](https://github.com/chenglou/handwired) *Mini OS* is a small desktop — windows, dragging, stacking, springs, a photo gallery — driven by one compiled program with 9,909 weights in 130 layers and zero training.
- **Unfreeze the weights and train them.** The *Learned gallery* trains a program's coefficients in real time with its own gradients.
- **Get GPU-scale parallelism from single-threaded-style code.** The *JSON search* demo writes its programs as WebGPU shaders and searches 100,000 JSON documents at each keystroke.

## Live demos on this site

<div class="card-grid">
<a class="card" href="/pages/soft-switch.html"><h3>Soft switch</h3><p>Drag <code>a</code> and watch <code>a &gt; 4 ? 10 : 12</code> computed by ReLUs.</p></a>
<a class="card" href="/pages/compare-explorer.html"><h3>Exact comparisons</h3><p><code>emitCompare</code>, <code>emitSelect</code>, <code>emitMinimumExact</code> vs plain JS, fuzzed.</p></a>
<a class="card" href="/pages/circuit-graph.html"><h3>Code → network</h3><p>See the operations and layers a program becomes.</p></a>
<a class="card" href="/pages/train.html"><h3>Unfreeze &amp; train</h3><p>Gradient descent on a handwired program's constants.</p></a>
<a class="card" href="/pages/toggle.html"><h3>Toggle switch</h3><p>Handwired's own template app, a spring-animated switch run as one program.</p></a>
</div>

## Where do I start?

Read [Why Handwired](/pages/why-handwired.html) for the idea, [Concepts](/pages/concepts.html) for how conditionals become ReLUs and why the result is both exact and differentiable, then [Getting started](/pages/getting-started.html) to run it yourself. Common questions are answered in the [FAQ](/pages/faq.html).
