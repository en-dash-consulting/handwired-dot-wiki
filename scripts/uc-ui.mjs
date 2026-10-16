// Static markup for the use-case demos (filled in by src/uc/*-ui.ts). Kept server-rendered so the layout doesn't jump.
const fine = `Shoppers are simulated with a hidden taste (<code>2·match + 1·pop + 4·fresh + 3·rating</code>, hidden from both models), attention that fades with position (1 / (1 + 0.35 × position)), and less interest in out-of-stock items. Rates are measured live on seeded test lists of 20 results each.`
export function RANKING(home = false) {
  const step = (n, t, body, cls = '') => `<section class="uc-step${cls}" aria-labelledby="rk-s${n}"><h2 id="rk-s${n}" class="uc-h"><span class="uc-n">${n}</span> ${t}</h2>${body}</section>`
  const train = `<p class="buttons rk-train"><button id="rk-sim" type="button" class="button">Simulate 1,000 shoppers</button> <button id="rk-learn" type="button" class="button secondary" disabled>Learn from the clicks</button> <button id="rk-reset" type="button" class="button secondary">Reset</button></p>
    <p class="hint rk-status" aria-live="polite"><output id="rk-clicks">0 clicks logged</output> <output id="rk-learn-msg"></output></p><p class="rk-wline" aria-hidden="true"><code id="rk-wline"></code></p>`
  const board = `<div class="rk-board">
    <div class="rk-col" role="group" aria-labelledby="rk-code-h"><p id="rk-code-h" class="card-kicker">your ranking code <span class="hand">runs as a Handwired net</span></p><pre class="big-code rk-code" tabindex="0"><code id="rk-code"></code></pre>
      <ul class="rk-rules" aria-live="polite"><li><span class="r-label">pinned result on top</span> <output id="rk-pin" class="ok">✓</output></li><li><span class="r-label">out-of-stock in top 10</span> <output id="rk-oos" class="ok">0</output></li><li><span class="r-label">shoppers' favourite in top 3</span> <output id="rk-top3">–</output></li></ul></div>
    <div class="rk-col" role="group" aria-labelledby="rk-list-h">${train}<p id="rk-list-h" class="card-kicker">results for “wireless headphones” <span class="hint">· or click one yourself</span></p><ol id="rk-list" class="rk-list"></ol></div>
  </div>`
  if (home) return `<div class="uc uc-home" data-uc-ranking data-home>${board}<p class="hint uc-fine">${fine} <a href="/pages/ranking.html">Full walkthrough, including the generic model that breaks the rules →</a></p></div>`
  return `<div class="uc" data-uc-ranking>
  ${step(1, 'A ranking formula someone guessed', `<p>Every search box has one: a few weights, picked by gut, plus two business rules that must never break. Here it is, running as an exact Handwired net.</p>${board}`)}
  ${step(2, 'Predict', `<fieldset class="predict" id="rk-predict"><legend>Ranked as a neural net, will this list come out in exactly the same order as the plain JavaScript?</legend><div class="choices">
    <button type="button" class="choice" data-v="always">Always the same</button><button type="button" class="choice" data-v="mostly">Mostly; nets are approximate</button><button type="button" class="choice" data-v="no">No, it needs training first</button></div></fieldset>
    <p id="rk-reveal" class="reveal" aria-live="polite" hidden></p>`)}
  ${step(3, 'Let shoppers vote, then let the code learn', `<p>Simulate 1,000 shoppers, or click results yourself. Then watch the four weights in the code above move while the list re-sorts. The rules never move.</p>`)}
  ${step(4, 'The foil: a generic model on the same clicks', `<p>The usual move is to train a small neural net on the click log. Same clicks, same optimizer, same loss.</p>
    <p class="buttons"><button id="rk-mlp" type="button" class="button" disabled>Train the generic model</button> <output id="rk-mlp-msg" class="hint" aria-live="polite"></output></p>
    <div class="rk-foil" role="group" aria-label="Generic model results"><ol id="rk-mlp-list" class="rk-list small"></ol><ul class="rk-rules"><li><span class="r-label">test lists where the pinned result is not on top</span> <output id="rk-mlp-pin">–</output></li><li><span class="r-label">test lists with out-of-stock in the top 10</span> <output id="rk-mlp-oos">–</output></li><li><span class="r-label">favourite in top 3</span> <output id="rk-mlp-top3">–</output></li><li><span class="r-label">what you can read in it</span> <output id="rk-mlp-w">–</output></li></ul></div>`)}
  ${step(5, 'The diff you\u2019d actually review', `<pre class="big-code rk-diff" tabindex="0"><code id="rk-diff">Learn first (step 3) to see the diff.</code></pre>
    <p class="takeaway"><strong>Reach for Handwired when</strong> you already have a formula people understand, rules that must hold exactly, and data that should tune the numbers, not replace the code.</p>
    <p class="hint uc-fine">${fine} The generic model is a 6→8→1 ReLU net, also trained with Adam, in a Web Worker so the page stays responsive. Both train on the clicks of non-pinned, in-stock results, since the rules decide the others.</p>`)}
</div>`
}

export function GPUSEARCH() {
  const step = (n, t, body) => `<section class="uc-step" aria-labelledby="gs-s${n}"><h2 id="gs-s${n}" class="uc-h"><span class="uc-n">${n}</span> ${t}</h2>${body}</section>`
  return `<div class="uc" data-uc-gpu>
  ${step(1, 'The job', `<p>You need to search 100,000 JSON documents with a regular expression on every keystroke, and highlight the JSON. In plain JavaScript that is a loop: one document after another, on one thread. On a GPU, you would have to rewrite it all as shaders.</p>`)}
  ${step(2, 'Predict', `<fieldset class="predict" id="gs-predict"><legend>Cheng Lou wrote the matcher and the JSON parser as Handwired programs, then turned them into WebGPU shaders. Against the browser's native, heavily optimized RegExp, how does it do?</legend><div class="choices">
    <button type="button" class="choice" data-v="slower">Slower: RegExp is native code</button><button type="button" class="choice" data-v="same">About the same</button><button type="button" class="choice" data-v="faster">Faster, on many patterns</button></div></fieldset>
    <p id="gs-reveal" class="reveal" aria-live="polite" hidden>Measure it yourself below: the line under the search box reads “This program: … ms on the GPU. Native RegExp: … ms.”, both timed live in your browser. Try the pattern that makes RegExp backtrack: <code>([a-z]+)+x</code>. The fixed program takes the same time on any pattern; RegExp can take seconds. Timings vary by machine and GPU, so we don't print a number here.</p>`)}
  ${step(3, 'Poke it', `<p id="gs-gpu" class="hint" aria-live="polite">Checking for WebGPU…</p>
    <iframe class="embed gs-embed" src="/pages/json-search-embed.html" title="Cheng Lou's JSON search demo: search 100,000 JSON documents with a regular expression on the GPU" loading="lazy"></iframe>
    <p class="hint uc-fine">Embedded unmodified from <a href="https://github.com/chenglou/handwired/tree/main/src/json-search">chenglou/handwired · src/json-search</a>, MIT license, © 2026 Cheng Lou. <a href="/pages/json-search-embed.html">Open it full screen</a>. Upstream also runs it on <a href="https://chenglou.me/handwired/">chenglou.me/handwired</a>.</p>`)}
  ${step(4, 'Is it the same answer?', `<p>The counter you'd want is “0 differences from plain JavaScript”. This page doesn't compute that live; upstream's test suite does, comparing the search programs against plain-JavaScript references over edge cases and fuzzed inputs (<a href="https://github.com/chenglou/handwired/tree/main/tests/json-search">tests/json-search</a>: <code>search.test.ts</code>, <code>searcher.test.ts</code>, <code>edge-cases.test.ts</code>, <code>writer-fuzz.ts</code>). The CPU toggle in the demo runs the very same programs as generated JavaScript, so you can flip it and see the same matches.</p>
    <p class="takeaway"><strong>Reach for Handwired when</strong> the same small piece of logic has to run on a huge number of inputs at once, and you want to write it once as readable code instead of hand-writing GPU shaders.</p>`)}
</div>`
}

export function LAYOUT() {
  const step = (n, t, body) => `<section class="uc-step" aria-labelledby="ly-s${n}"><h2 id="ly-s${n}" class="uc-h"><span class="uc-n">${n}</span> ${t}</h2>${body}</section>`
  return `<div class="uc" data-uc-layout>
  ${step(1, 'A sizing function nobody can quite tune', `<p>A designer wants the important cards bigger, and everything to scale with the screen. An engineer wrote three constants. They're wrong, and every round of “a bit wider on tablets?” is another guess.</p>
  <div class="rk-board"><div class="rk-col" role="group" aria-labelledby="ly-code-h"><p id="ly-code-h" class="card-kicker">the layout code <span class="hand">runs as a Handwired net</span></p><pre class="big-code rk-code" tabindex="0"><code id="ly-code"></code></pre>
    <ul class="rk-rules" aria-live="polite"><li><span class="r-label">cards out of bounds (50 screen widths × 20 cards)</span> <output id="ly-oob" class="ok">0</output></li><li><span class="r-label">furthest from your drags</span> <output id="ly-err">–</output></li><li><span class="r-label">net vs plain JS, max difference</span> <output id="ly-jsdiff">–</output></li></ul></div>
  <div class="rk-col" role="group" aria-labelledby="ly-vp-l"><p class="buttons rk-train"><button id="ly-sim" type="button" class="button">Simulate a designer's 12 drags</button> <button id="ly-learn" type="button" class="button secondary" disabled>Learn from the drags</button> <button id="ly-reset" type="button" class="button secondary">Reset</button></p>
    <p class="hint rk-status" aria-live="polite"><output id="ly-drags">0 drags logged</output> <output id="ly-msg"></output></p>
    <div class="controls"><label id="ly-vp-l" for="ly-vp">screen width</label><input id="ly-vp" type="range" min="320" max="1440" step="10" value="1280" /><output id="ly-vp-out" for="ly-vp">1280 px</output></div>
    <div class="ly-screen-wrap"><div id="ly-screen" class="ly-screen" role="group" aria-label="Simulated screen. Each card has a width handle: drag it, or focus it and use the arrow keys."></div></div></div></div>`)}
  ${step(2, 'Predict', `<fieldset class="predict" id="ly-predict"><legend>You'll drag cards at one or two screen widths. After learning, at a screen width you never touched, will any card overflow the screen?</legend><div class="choices">
    <button type="button" class="choice" data-v="never">Never: the clamp is still in the code</button><button type="button" class="choice" data-v="some">A few: learned things extrapolate badly</button></div></fieldset>
    <p id="ly-reveal" class="reveal" aria-live="polite" hidden></p>`)}
  ${step(3, 'Drag, then learn', `<p>Drag the right edge of a few cards to the width you want (or simulate a designer). Try two or three screen widths, so it can tell “fixed size” from “grows with the screen”. Then learn: three constants move in the code, and every card at every width follows.</p>`)}
  ${step(4, 'The foil: a generic model on the same drags', `<p>Train a small neural net (2→12→1) on the same drags. It fits them, but it has no idea that “never wider than the screen” is a rule.</p>
    <p class="buttons"><button id="ly-mlp" type="button" class="button" disabled>Train the generic model</button> <span class="switch-field"><input id="ly-show-mlp" type="checkbox" role="switch" disabled /><label for="ly-show-mlp">show its layout above</label></span></p>
    <p id="ly-mlp-msg" class="hint" aria-live="polite"></p>
    <p class="takeaway"><strong>Reach for Handwired when</strong> a designer can show you what they want faster than they can describe it, and the layout still has hard limits.</p>
    <p class="hint uc-fine">The simulated designer drags 4 importance levels at 1280, 900 and 420 px, aiming at hidden constants (BASE 140, PER_LEVEL 70, SHARE 0.16) with ±6 px of hand wobble. The bounds check covers 50 screen widths from 320 to 1440 px with 20 seeded cards each. Widths are float32 in the net and float64 in JavaScript, so they agree to a fraction of a pixel, not bit for bit; the clamp itself is exact. Row packing is ordinary JavaScript.</p>`)}
</div>`
}

export function PHYSICS() {
  const step = (n, t, body) => `<section class="uc-step" aria-labelledby="ph-s${n}"><h2 id="ph-s${n}" class="uc-h"><span class="uc-n">${n}</span> ${t}</h2>${body}</section>`
  return `<div class="uc" data-uc-physics>
  ${step(1, 'A recording, and a game engine that doesn\u2019t match it', `<p>You filmed a real ball (the dots). Your game's physics has three constants that someone eyeballed, and its ball (the line) lands in the wrong place.</p>
  <div class="rk-board"><div class="rk-col" role="group" aria-labelledby="ph-code-h"><p id="ph-code-h" class="card-kicker">the physics code <span class="hand">unrolled into one Handwired net</span></p><pre class="big-code rk-code" tabindex="0"><code id="ph-code"></code></pre>
    <ul class="rk-rules" aria-live="polite"><li><span class="r-label">furthest from the recording</span> <output id="ph-fit">–</output></li><li><span class="r-label">net replay vs plain JS, max difference</span> <output id="ph-js">–</output></li><li><span class="r-label">frames below the floor</span> <output id="ph-floor" class="ok">0</output></li></ul></div>
  <div class="rk-col" role="group" aria-label="Ball paths"><p class="buttons rk-train"><button id="ph-learn" type="button" class="button">Learn from the recording</button> <button id="ph-play" type="button" class="button secondary">▶ Replay</button> <button id="ph-reset" type="button" class="button secondary">Reset</button></p>
    <p id="ph-msg" class="hint rk-status" aria-live="polite"></p>
    <svg id="ph-svg" class="chart ph-svg" viewBox="0 0 640 300" role="img" aria-label="Side view: the recorded ball as dots, the simulated path as a line, and the floor"></svg>
    <p class="hint"><span class="ph-k k1">● recording</span> <span class="ph-k k2">— your physics</span> <span class="ph-k k3">- - generic model</span> <span class="ph-k k4">··· real ball (new throw)</span></p></div></div>`)}
  ${step(2, 'Predict', `<fieldset class="predict" id="ph-predict"><legend>Learning moves only GRAVITY, DRAG and BOUNCE. Then you throw a <em>new</em> ball, harder and from lower down, that was never recorded. Will the learned physics follow the real ball?</legend><div class="choices">
    <button type="button" class="choice" data-v="yes">Yes, closely</button><button type="button" class="choice" data-v="no">No, it only learned that one throw</button></div></fieldset>
    <p id="ph-reveal" class="reveal" aria-live="polite" hidden></p>`)}
  ${step(3, 'Throw a new ball', `<p class="buttons"><button id="ph-new" type="button" class="button" disabled>Throw a new ball</button> <span class="hint">(learn first)</span></p><p id="ph-new-msg" class="hint" aria-live="polite"></p>`)}
  ${step(4, 'The foil: a generic model of the path', `<p>A common shortcut: fit a neural net (frame number and throw → position, 5→16→2) to the recording.</p>
    <p class="buttons"><button id="ph-mlp" type="button" class="button">Train the generic model</button></p><p id="ph-mlp-msg" class="hint" aria-live="polite"></p>
    <p class="takeaway"><strong>Reach for Handwired when</strong> you have a simulation you believe in and measurements it should match: fit its constants, and keep the simulation.</p>
    <p class="hint uc-fine">The “recording” is simulated: the same step with hidden constants (GRAVITY 0.5, DRAG 0.012, BOUNCE 0.72) and ±0.4 px of camera jitter, 72 frames. The step is unrolled 72 times into one circuit (2,379 operations); the floor is an exact comparison and select. A bounce is differentiable in its height but not its timing, and gradients through many frames can explode, so learning starts on the first 12 frames and lengthens the window to all 72. Replay is float32 in the net and float64 in JavaScript, so the paths agree to the stated difference, not bit for bit.</p>`)}
</div>`
}
