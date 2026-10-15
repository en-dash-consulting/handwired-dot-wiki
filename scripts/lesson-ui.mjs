// The flagship lesson: "The cat is a neural net". Static text and structure; src/cat/lesson.ts runs it.
const term = (id, word, def) => `<span class="term"><button type="button" class="term-btn" aria-describedby="def-${id}">${word}</button><span role="tooltip" id="def-${id}" class="term-tip">${def}</span></span>`
const NET = term('net', 'neural net', 'A chain of weighted sums and simple on/off switches. Its numbers are usually learned from examples.')
const WEIGHTS = term('w', 'weights', 'The numbers inside a neural net. In a Handwired net they are your constants.')
const predict = (id, q, opts) => `<fieldset class="predict" data-predict="${id}"><legend>${q}</legend><div class="choices">${opts.map(([v, l]) => `<button type="button" class="choice" data-v="${v}">${l}</button>`).join('')}</div><p class="verdict-line" data-verdict aria-live="polite"></p></fieldset>`
const scene = (id, extra = '') => `<div class="scene-wrap" data-wrap="${id}"><svg class="scene" data-scene="${id}" viewBox="0 0 420 300" role="img" aria-label="A cat jumping toward a shelf"></svg>${extra}</div>`
const shelfCtl = (id) => `<label class="shelf-ctl"><span>Shelf height</span><input type="range" min="0" max="100" step="1" value="62" data-shelf="${id}" /><output data-shelf-out="${id}">62 cm</output></label>`
const next = (n, label) => `<button type="button" class="next" data-next="${n}" hidden>${label} <span aria-hidden="true">↓</span></button>`

export const STEP1 = (home = false) => `<section class="step" id="step-1" data-step="1" aria-labelledby="s1">
  <p class="step-n">Step 1 of 7</p>
  <h2 id="s1">Here's a tiny JavaScript function.</h2>
  <p class="say">It decides how hard a cat should jump to land on a shelf. Drag the shelf and watch.</p>
  <div class="duo">
    <div><pre class="code" tabindex="0" aria-label="The jumpPower function" data-code="1"></pre><p class="trace" data-trace="1" aria-live="polite"></p></div>
    <div class="vis">${scene('1')}${shelfCtl('1')}</div>
  </div>
  ${home ? `<p class="continue"><a class="button" href="/pages/js-vs-nn.html#step-2">Next: the same function, as a neural net →</a></p>` : next(2, 'Now, a twist')}
</section>`

export const LESSON = () => `<div class="lesson" data-lesson>
  <div class="lesson-bar"><button type="button" class="sound" data-sound aria-pressed="false">Sound off</button></div>
  ${STEP1()}
  <section class="step" id="step-2" data-step="2" aria-labelledby="s2" hidden>
    <p class="step-n">Step 2 of 7</p>
    <h2 id="s2">The same function is also a ${NET}.</h2>
    <p class="say">Handwired rebuilt <code>jumpPower</code> out of the parts neural nets are made of. Nobody trained it: its ${WEIGHTS} are your constants.</p>
    ${predict('2', 'Before you look: will the network give the same answer as the JavaScript?', [['exact', 'Exactly the same'], ['close', 'Very close'], ['no', 'Different']])}
    <div class="reveal" data-reveal="2" hidden>
      <div class="duo net-duo">
        <pre class="code small" tabindex="0" aria-label="The jumpPower function" data-code="2"></pre>
        <svg class="net" data-net viewBox="0 0 520 300" role="img" aria-label="The function as a network: 41 operations wired in layers"></svg>
      </div>
      <div class="answers" aria-live="polite"><div><span class="who js">JavaScript says</span><b data-ans="js">…</b></div><div class="eq" data-eq>=</div><div><span class="who hw">The network says</span><b data-ans="hw">…</b></div></div>
      ${shelfCtl('2')}
      <p class="aside">Every dot is one operation: a weighted sum, or a sum through an on/off switch. Bright dots are busy for this shelf.</p>
    </div>
    ${next(3, 'Try to break it')}
  </section>
  <section class="step" id="step-3" data-step="3" aria-labelledby="s3" hidden>
    <p class="step-n">Step 3 of 7</p>
    <h2 id="s3">Try to catch it being wrong.</h2>
    <p class="say">One shelf matching could be luck. Let's try every shelf from 0 to 100 cm, in steps of 1/32 cm.</p>
    ${predict('3', 'How many of those 3,201 shelves will get a different answer?', [['0', 'None'], ['few', 'A handful'], ['many', 'Lots']])}
    <div class="reveal" data-reveal="3" hidden>
      <div class="race"><span class="big" data-race>0</span><span class="of">of 3,201 shelves give the same answer</span></div>
      <canvas class="tiles" data-tiles width="800" height="160" role="img" aria-label="One square per shelf height; green means the network and JavaScript agree exactly"></canvas>
      <p class="aside" data-race-note></p>
    </div>
    ${next(4, 'Now change the world')}
  </section>
  <section class="step" id="step-4" data-step="4" aria-labelledby="s4" hidden>
    <p class="step-n">Step 4 of 7</p>
    <h2 id="s4">Then the cat had a very big dinner.</h2>
    <p class="say">A heavier cat needs more power. Plain JavaScript doesn't know that, and it can't find out.</p>
    <button type="button" class="button primary" data-feed>Feed the cat</button>
    <div class="reveal" data-reveal="4" hidden>
      ${scene('4', '<p class="tally" aria-live="polite"><span class="big" data-tally4>0</span> <span>of 12 jumps landed</span></p>')}
      <p class="aside">Each miss is the old rule giving the heavier cat too little power, or too much. The code is still the code: to fix it, someone would have to work out new numbers by hand.</p>
    </div>
    ${next(5, 'Let the network learn')}
  </section>
  <section class="step" id="step-5" data-step="5" aria-labelledby="s5" hidden>
    <p class="step-n">Step 5 of 7</p>
    <h2 id="s5">But the network can learn from those 12 jumps.</h2>
    <p class="say">Because it's a neural net, we can ${term('nudge', 'nudge', 'One small training step: measure how wrong the 12 answers are, and move each weight a little in the direction that makes them less wrong. Hundreds of nudges take a second or two.')} its weights toward the right answers, the usual way nets are trained. Its weights are the constants, so watch the numbers in the code.</p>
    <button type="button" class="button primary" data-learn>Unfreeze and learn</button>
    <div class="reveal" data-reveal="5" hidden>
      <div class="duo">
        <pre class="code live" tabindex="0" aria-label="The network, shown as its code, while it learns" data-code="5"></pre>
        <div class="vis">${scene('5', '<p class="tally" aria-live="polite"><span class="big" data-tally5>0</span> <span>of 12 jumps land</span></p>')}</div>
      </div>
      <p class="nudges" data-nudges></p>
      <div class="learned" data-learned hidden></div>
    </div>
    ${next(6, 'Compare with a regular neural net')}
  </section>
  <section class="step" id="step-6" data-step="6" aria-labelledby="s6" hidden>
    <p class="step-n">Step 6 of 7</p>
    <h2 id="s6">Why not just train a regular neural net?</h2>
    <p class="say">Give a regular net the same 12 jumps. It's a standard design with 49 weights. We first trained it to copy the original rule, so both start from the same behavior.</p>
    <button type="button" class="button primary" data-race6>Train both on the 12 jumps</button>
    <div class="reveal" data-reveal="6" hidden>
      <div class="vs">
        <div class="side hw"><h3>Handwired net</h3><svg class="mini" data-mini="hw" viewBox="0 0 300 170" role="img" aria-label="Jump power for every shelf, Handwired net"></svg>
          <p class="metric"><span class="big" data-m="hw-miss">0</span> <span>shelves it would miss, out of 3,201</span></p><p class="metric sm"><b data-m="hw-steps">0</b> nudges · <b data-m="hw-bad">0</b> impossible jumps</p><p class="cap">What it learned:</p><pre class="code xs" tabindex="0" data-m="hw-code" aria-label="What it learned"></pre></div>
        <div class="side mlp"><h3>Regular neural net</h3><svg class="mini" data-mini="mlp" viewBox="0 0 300 170" role="img" aria-label="Jump power for every shelf, regular net"></svg>
          <p class="metric"><span class="big" data-m="mlp-miss">0</span> <span>shelves it would miss, out of 3,201</span></p><p class="metric sm"><b data-m="mlp-steps">0</b> nudges · <b data-m="mlp-bad">0</b> impossible jumps</p><p class="cap">What it learned: 49 numbers. Which one means &ldquo;heavier cat&rdquo;?</p><div class="heat" data-m="mlp-heat" role="img" aria-label="What it learned: 49 numbers"></div></div>
      </div>
      <p class="aside">Both saw only the 12 white dots. The miss count checks every shelf from 0 to 100 cm against what the heavier cat really needs. An impossible jump asks for under 0% or over 100%; the Handwired net can't, because <code>Math.min</code> and <code>Math.max</code> are still in it, exactly.</p>
    </div>
    ${next(7, 'So what?')}
  </section>
  <section class="step recap" id="step-7" data-step="7" aria-labelledby="s7" hidden>
    <p class="step-n">Step 7 of 7</p>
    <h2 id="s7">Handwired turns code you trust into a neural net you can train, and it stays your code.</h2>
    <p class="say">That's the idea behind Cheng Lou's demos: a whole desktop UI running as one net, a photo layout that learns from your sketch, and a JSON search running on the GPU.</p>
    <p class="ctas"><a class="button" href="https://chenglou.me/handwired/" rel="noopener">See Cheng Lou's demos</a> <a class="button secondary" href="/pages/getting-started.html">Write your own</a> <a class="button secondary" href="/pages/soft-switch.html">How the wiring works</a></p>
  </section>
  <details class="fineprint"><summary>Fine print: what's measured, and what isn't</summary>
    <ul>
      <li>Everything is computed live in your browser. JavaScript runs the source shown, through <code>new Function</code>. The network is the same rule built with Handwired's builder: 41 operations, using <code>emitCompare</code> for <code>shelf &gt; 50</code> and <code>emitClampExact</code> for the min/max.</li>
      <li>"Same answer" means the identical number with no tolerance, for all 3,201 shelves (0 to 100 cm in 1/32 cm steps). That holds because the inputs and constants are values 32-bit floats store exactly. For arbitrary fractions, JavaScript's 64-bit math and the network's 32-bit math can differ in the last digits.</li>
      <li>The heavier cat is a simulation: its "right" powers come from the same rule with BASE 12, PER_CM 1 and EXTRA 16. A jump lands if the power is within 0.75% of what the cat needed.</li>
      <li>Learning uses Adam on the gradients from <code>circuit.backpropagateReference</code>. Only BASE, PER_CM and EXTRA learn. The 50 cm threshold can't learn, because a comparison has no slope. The learned constants are shown rounded (whole numbers, quarters for PER_CM); the page re-checks the rounded code against the network.</li>
      <li>The regular net is 1 → 16 → 1 with ReLUs (49 weights), run on the same Handwired runtime with the same training code. It starts from seed 7 and is pre-trained for 2,500 steps on random shelves priced by the original rule. Its results depend on that setup, and you could bolt a clamp onto it. The Handwired net is shaped like the rule, which is exactly why it learns this change quickly; it couldn't learn an unrelated pattern.</li>
    </ul>
  </details>
</div>`
