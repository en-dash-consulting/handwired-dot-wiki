# Demo gallery

> Every Handwired demo in one place: live in-browser demos on handwired.wiki plus Cheng Lou's Mini OS, Learned gallery and 100,000-document JSON search.

Source: https://handwired.wiki/pages/gallery.html

<p class="lede">Every demo below runs the real Handwired runtime in your browser — no server, no GPU required. Handwired's own demos link to Cheng Lou's site.</p>

## Which demos run on this site?

<div class="card-grid">
<a class="card feature" href="/pages/ranking.html"><h3>★ Ranking from clicks</h3><p>A search formula learns its weights from 1,000 shoppers while its business rules stay exact; a generic net on the same clicks breaks them.</p></a>
<a class="card" href="/pages/layout.html"><h3>Layout from a designer's drags</h3><p>Drag cards to the sizes you want; the sizing function learns its constants and nothing overflows.</p></a>
<a class="card" href="/pages/physics.html"><h3>Physics from a recording</h3><p>Fit gravity, drag and bounce to a recorded path, then replay it as code.</p></a>
<a class="card" href="/pages/color-themes.html"><h3>Accessible colour themes</h3><p>A theme learns from a designer's picks while WCAG AA contrast stays exact; a generic net on the same picks fails it.</p></a>
<a class="card" href="/pages/gpu-search.html"><h3>GPU JSON search (by Cheng Lou)</h3><p>Handwired's own 100,000-document search, embedded with credit: GPU timings next to plain JavaScript.</p></a>
<a class="card" href="/pages/js-vs-nn.html"><h3>Beginner lesson: the cat is a neural net</h3><p>A 7-step lesson. A tiny JS rule becomes an exact neural net; try to break it, then watch it learn new constants in its own code, next to a regular net.</p></a>
<a class="card" href="/pages/soft-switch.html"><h3>Soft switch</h3><p>The README's <code>a &gt; 4 ? 10 : 12</code> as two ReLUs and a select. Editable <code>a</code>, branches and live plot.</p></a>
<a class="card" href="/pages/compare-explorer.html"><h3>Exact comparison explorer</h3><p>Pick a relation, toggle the integer grid, fuzz 5,000 random pairs against plain JS.</p></a>
<a class="card" href="/pages/circuit-graph.html"><h3>Code → network graph</h3><p>Visualize the operations and layers behind a select, a comparison and an exact clamp.</p></a>
<a class="card" href="/pages/train.html"><h3>Unfreeze &amp; train</h3><p>Start from the exact program, then fit its threshold, slope and branch values by gradient descent.</p></a>
<a class="card" href="/pages/toggle.html"><h3>Toggle switch template</h3><p>Handwired's own <code>template/</code> app: a spring-animated switch run as one numeric program.</p></a>
</div>

## What are handwired's own demos?

<div class="card-grid">
<a class="card ext" href="https://chenglou.me/handwired/"><h3>Mini OS (HandwiredOS)</h3><p>A small desktop with three windows and a dock — focus, stacking, dragging, resizing, springs, a photo gallery — run by one program: 234 source cells, 4,646 live operations in 130 layers, 9,909 weights, zero training.</p></a>
<a class="card ext" href="https://chenglou.me/handwired/"><h3>Learned gallery</h3><p>A photo layout drawn by a small network inside a program (6,320 operations in 8 layers, 244 trained source cells), trained with Adam using the program's own gradients while you edit the sketch.</p></a>
<a class="card ext" href="https://chenglou.me/handwired/"><h3>Search 100,000 JSON documents</h3><p>Regex matching, JSON parsing and highlighting written as numeric programs, then emitted as WebGPU shaders that search every document at each keystroke.</p></a>
</div>

Figures above are from [the official handwired READMEs](https://github.com/chenglou/handwired) at the pinned commit.
