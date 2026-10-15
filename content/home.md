---
slug: index
title: "Handwired — Learn Cheng Lou's JavaScript-to-Neural-Net Library | handwired.wiki"
nav: Home
h1: "What if your JavaScript <span class=\"copper\">was</span> a neural net?"
sub: "Not a copy that approximates it. The same function, exactly, and it can still learn. Here is a 3-minute way to see it."
description: "Handwired by Cheng Lou turns ordinary JavaScript logic into an exact, fully differentiable neural net that runs in the browser without a GPU. Live demos, tutorials and FAQ."
type: home
---
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

- **Run UI logic as a network.** Upstream's *Mini OS* is a small desktop — windows, dragging, stacking, springs, a photo gallery — driven by one compiled program with 9,909 weights in 130 layers and zero training.
- **Unfreeze the weights and train them.** The *Learned gallery* trains a program's coefficients in real time with its own gradients.
- **Get GPU-scale parallelism from single-threaded-style code.** The *JSON search* demo writes its programs as WebGPU shaders and searches 100,000 JSON documents at each keystroke.

## Live demos on this site

<div class="card-grid">
<a class="card" href="/pages/soft-switch.html"><h3>Soft switch</h3><p>Drag <code>a</code> and watch <code>a &gt; 4 ? 10 : 12</code> computed by ReLUs.</p></a>
<a class="card" href="/pages/compare-explorer.html"><h3>Exact comparisons</h3><p><code>emitCompare</code>, <code>emitSelect</code>, <code>emitMinimumExact</code> vs plain JS, fuzzed.</p></a>
<a class="card" href="/pages/circuit-graph.html"><h3>Code → network</h3><p>See the operations and layers a program becomes.</p></a>
<a class="card" href="/pages/train.html"><h3>Unfreeze &amp; train</h3><p>Gradient descent on a handwired program's constants.</p></a>
<a class="card" href="/pages/toggle.html"><h3>Toggle switch</h3><p>Upstream's template app, a spring-animated switch run as one program.</p></a>
</div>

## Where do I start?

Read [Why Handwired](/pages/why-handwired.html) for the idea, [Concepts](/pages/concepts.html) for how conditionals become ReLUs and why the result is both exact and differentiable, then [Getting started](/pages/getting-started.html) to run it yourself. Common questions are answered in the [FAQ](/pages/faq.html).
