// Static markup for the flagship JS vs NN demo (src/jsnn/demo.ts fills in every number live).
const stat = (k, label) => `<div class="st" data-st="${k}"><dt>${label}</dt><dd data-v>…</dd></div>`
const stats = `<dl class="stats">${stat('exact', 'Matches the JS rule')}${stat('err', 'Off from the invoices')}${stat('viol', 'Breaks a hard rule')}${stat('steps', 'Training steps')}</dl>`
export const JSNN_UI = (home = false) => `<section class="jsnn${home ? ' on-home' : ''}" aria-labelledby="jsnn-title">
  <h2 id="jsnn-title" class="jsnn-title">${home ? 'Same code, three ways, running live' : 'Three columns, one shipping rule'}</h2>
  <p class="jsnn-hook">A shipping price rule, written once in JS. Watch it run as <b class="c-js">plain JS</b>, as <b class="c-hw">a Handwired neural net</b>, and next to <b class="c-mlp">an ordinary neural net</b> trained to copy it.</p>
  <div class="beats" role="group" aria-label="Steps">
    <button type="button" class="beat" data-beat="1" aria-pressed="true"><span>1</span> Check exactness</button>
    <button type="button" class="beat" data-beat="2" aria-pressed="false"><span>2</span> Change the prices</button>
    <button type="button" class="beat" data-beat="3" aria-pressed="false"><span>3</span> Read what it learned</button>
  </div>
  <div class="beat-say" aria-live="polite" data-say>Running the network…</div>
  <div class="cols">
    <div role="group" class="col js" aria-labelledby="c1"><header><h3 id="c1"><span class="dot"></span>Plain JS</h3><p>runs exactly as written; can't learn</p></header>
      <pre class="src" tabindex="0" aria-label="Plain JS source"><code data-js></code></pre>${stats}</div>
    <div role="group" class="col hw" aria-labelledby="c2"><header><h3 id="c2"><span class="dot"></span>Same JS as a Handwired net</h3><p data-hwsub>frozen: weights are the constants</p></header>
      <pre class="src" tabindex="0" aria-label="Handwired net, shown as its source"><code data-hw></code></pre>
      <ul class="knobs" data-knobs aria-label="Network weights that are the program's constants"></ul>${stats}</div>
    <div role="group" class="col mlp" aria-labelledby="c3"><header><h3 id="c3"><span class="dot"></span>Generic neural net</h3><p data-mlpsub>1 → 16 → 1 ReLU, 49 weights</p></header>
      <div class="weights" data-weights role="img" aria-label="The generic net's 49 weights as a heatmap"></div>
      <p class="mlp-eq"><code>price = W₂ · relu(W₁ · kg + b₁) + b₂</code></p>${stats}</div>
  </div>
  <figure class="chart">
    <svg data-chart viewBox="0 0 720 300" role="group" aria-label="Price in dollars against parcel weight for all three, with invoices you can drag"></svg>
    <figcaption><span class="lg js">plain JS</span><span class="lg hw">Handwired net</span><span class="lg mlp">generic net</span><span class="lg inv">invoices (drag or use ↑↓)</span><span class="lg rule">hard rules: $0 … $60</span></figcaption>
  </figure>
  <div class="diff" data-diff hidden></div>
  <p class="fine" data-fine>Measured live in your browser over all 6,401 parcel weights from 0 to 100 kg in 1/64 kg steps. Generic net: seed 7, Adam, the same training loop and gradients (Handwired's backprop) as the Handwired net.</p>
</section>`
