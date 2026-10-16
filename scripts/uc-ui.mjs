// Static markup for the use-case demos (filled in by src/uc/*-ui.ts). Kept server-rendered so the layout doesn't jump.
const fine = `Shoppers are simulated with a hidden taste (<code>2·match + 1·pop + 4·fresh + 3·rating</code>, hidden from both models), attention that fades with position (1 / (1 + 0.35 × position)), and less interest in out-of-stock items. Rates are measured live on seeded test lists of 20 results each.`
export function RANKING(home = false) {
  const step = (n, t, body) => `<section class="uc-step" aria-labelledby="rk-s${n}"><h2 id="rk-s${n}" class="uc-h"><span class="uc-n">${n}</span> ${t}</h2>${body}</section>`
  const col = (id, title, sub, body) => `<div class="rk2-col" role="group" aria-labelledby="${id}-h"><h3 id="${id}-h" class="rk2-title">${title}</h3><p class="rk2-sub">${sub}</p>${body}
      <figure class="rk2-chart"><svg id="${id}-chart" viewBox="0 0 300 90" role="img" aria-label="How often a shopper's favourite is in the top 3, as shoppers arrive"></svg><figcaption>favourite in the top 3: <output id="${id}-top3">–</output></figcaption></figure>
      <ul class="rk2-rules" aria-live="polite"><li id="${id}-pin">📌 pinned result first</li><li id="${id}-oos">no out-of-stock in the top 10</li></ul>
      <ol id="${id}-list" class="rk-list rk2-list"></ol></div>`
  const arena = `<div class="rk2" data-uc-ranking${home ? ' data-home' : ''}>
    <div class="rk2-bar"><button id="rk-play" type="button" class="button">▶ Let 1,000 shoppers in</button> <button id="rk-one" type="button" class="button secondary">+1 shopper</button> <button id="rk-reset" type="button" class="button secondary">Reset</button>
      <p id="rk-ticker" class="rk2-ticker" aria-live="polite">No shoppers yet. Left: the guessed formula. Right: a generic net, starting from random numbers as they do.</p></div>
    <p id="rk-explain" class="rk2-explain">Each shopper sees the list on the left and clicks what they like. After every 25 shoppers, <strong>both</strong> models take a few learning steps on all the clicks so far.</p>
    <div class="rk2-cols">
      ${col('rk-hw', 'Your formula, as a Handwired net', 'Learning moves only these four numbers:', '<pre class="rk2-code" tabindex="0"><code id="rk-code"></code></pre>')}
      ${col('rk-mlp', 'A generic neural net', 'Learning moves 65 numbers nobody can read:', '<div id="rk-mlp-w" class="rk2-weights" aria-hidden="true"></div>')}
    </div>
  </div>`
  if (home) return `<div class="uc uc-home">${arena}<p class="hint uc-fine">Shoppers are simulated (hidden taste: <code>2·match + 1·pop + 4·fresh + 3·rating</code>). Measured live on 200 seeded test searches. <a href="/pages/ranking.html">How this works, step by step →</a></p></div>`
  return `<div class="uc">
  ${step(1, 'A ranking formula someone guessed', `<p>Every store's search has one: four weights picked by gut, plus two rules that must never break: the <strong>pinned</strong> result goes first, and <strong>out-of-stock</strong> items never reach the top 10.</p>
    <fieldset class="predict" id="rk-predict"><legend>Run as a neural net, does this formula rank results in exactly the same order as the JavaScript?</legend><div class="choices">
    <button type="button" class="choice" data-v="always">Always the same</button><button type="button" class="choice" data-v="mostly">Mostly; nets are approximate</button></div></fieldset>
    <p id="rk-reveal" class="reveal" aria-live="polite" hidden></p>`)}
  ${step(2, 'Let shoppers in, and watch both models learn', `<p>Press play. Shoppers arrive one by one; their clicks are the training data. Watch the left column's four numbers settle while its rules stay green. The right column learns the taste too, but nothing in it knows the rules, and the clicks never teach them.</p>${arena}`)}
  ${step(3, 'What changed in the code', `<pre class="big-code rk-diff" tabindex="0"><code id="rk-diff">Let the shoppers in first.</code></pre>
    <p class="takeaway"><strong>Reach for Handwired when</strong> you already have a formula people understand, rules that must hold exactly, and data that should tune the numbers, not replace the code.</p>
    <p class="hint uc-fine">Shoppers are simulated with a hidden taste (<code>2·match + 1·pop + 4·fresh + 3·rating</code>, hidden from both models), attention that fades down the list, and less interest in out-of-stock items. Both models learn with the same optimizer (Adam), loss (which of the 10 shown results was clicked) and clicks, six steps after every 25 shoppers. The generic model is a 6→8→1 ReLU net given the same six facts, including “pinned” and “in stock”. Pinned and out-of-stock clicks aren't used for training, since the rules decide those. Rates and rule checks are measured live on 200 seeded test searches of 20 results.</p>`)}
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
    <p class="hint uc-fine">Embedded unmodified from <a href="https://github.com/chenglou/handwired/tree/main/src/json-search">chenglou/handwired · src/json-search</a>, MIT license, © 2026 Cheng Lou. <a href="/pages/json-search-embed.html">Open it full screen</a>. Cheng Lou's handwired repo also runs it on <a href="https://chenglou.me/handwired/">chenglou.me/handwired</a>.</p>`)}
  ${step(4, 'Is it the same answer?', `<p>The counter you'd want is “0 differences from plain JavaScript”. This page doesn't compute that live; handwired's own test suite does, comparing the search programs against plain-JavaScript references over edge cases and fuzzed inputs (<a href="https://github.com/chenglou/handwired/tree/main/tests/json-search">tests/json-search</a>: <code>search.test.ts</code>, <code>searcher.test.ts</code>, <code>edge-cases.test.ts</code>, <code>writer-fuzz.ts</code>). The CPU toggle in the demo runs the very same programs as generated JavaScript, so you can flip it and see the same matches.</p>
    <p class="takeaway"><strong>Reach for Handwired when</strong> the same small piece of logic has to run on a huge number of inputs at once, and you want to write it once as readable code instead of hand-writing GPU shaders.</p>`)}
</div>`
}

export function LAYOUT() {
  const step = (n, t, body) => `<section class="uc-step" aria-labelledby="ly-s${n}"><h2 id="ly-s${n}" class="uc-h"><span class="uc-n">${n}</span> ${t}</h2>${body}</section>`
  return `<div class="uc" data-uc-layout>
  ${step(1, 'A sizing function nobody can quite tune', `<p>A designer wants the important cards bigger, and everything to scale with the screen. An engineer wrote three constants. They're wrong, and every round of “a bit wider on tablets?” is another guess.</p>
  <div class="rk-board"><div class="rk-col" role="group" aria-labelledby="ly-code-h"><p id="ly-code-h" class="card-kicker">the layout code <span class="hand">runs as a Handwired net</span></p><pre class="big-code rk-code" tabindex="0"><code id="ly-code"></code></pre>
    <ul class="rk-rules" aria-live="polite"><li><span class="r-label">cards out of bounds (50 screen widths × 20 cards)</span> <output id="ly-oob" class="ok">0</output></li><li><span class="r-label">furthest from your examples</span> <output id="ly-err">–</output></li><li><span class="r-label">net vs plain JS, max difference</span> <output id="ly-jsdiff">–</output></li></ul></div>
  <div class="rk-col" role="group" aria-labelledby="ly-try-h"><p id="ly-try-h" class="card-kicker">try it</p>
    <ol class="ly-howto"><li><strong>Drag the right edge of the screen</strong> to resize it. Cards follow the code.</li><li><strong>Drag a card's grip</strong> <span class="ly-grip-ico" aria-hidden="true"></span> to the width you'd want at this size. That's a training example.</li><li>Or load the designer's three mockups, then press <em>Learn</em>.</li></ol>
    <p class="buttons rk-train"><button id="ly-sim" type="button" class="button secondary">Load the designer's 3 mockups</button> <button id="ly-learn" type="button" class="button" disabled>Learn from the examples</button> <button id="ly-reset" type="button" class="button secondary">Reset</button></p>
    <p class="hint rk-status" aria-live="polite"><output id="ly-drags">0 examples</output> <output id="ly-msg"></output></p>
    <div id="ly-mocks" class="ly-mocks" role="group" aria-label="Screen widths with examples"></div>
    <svg id="ly-loss" class="ly-loss" viewBox="0 0 300 50" role="img" aria-label="Training error over learning steps" hidden></svg></div></div>
  <div class="ly-stage"><p class="r-label">screen <output id="ly-vp-out">1280 px</output> wide</p><div class="ly-screen-wrap"><div id="ly-frame" class="ly-frame"><div id="ly-screen" class="ly-screen" role="group" aria-label="Simulated screen. Each card has a width grip: drag it, or focus it and use the arrow keys."></div><div id="ly-edge" class="ly-edge" role="slider" tabindex="0" aria-label="Screen width" aria-valuemin="320" aria-valuemax="1440"><span>drag ⟷</span></div></div></div></div>`)}
  ${step(2, 'Predict', `<fieldset class="predict" id="ly-predict"><legend>You'll drag cards at one or two screen widths. After learning, at a screen width you never touched, will any card overflow the screen?</legend><div class="choices">
    <button type="button" class="choice" data-v="never">Never: the clamp is still in the code</button><button type="button" class="choice" data-v="some">A few: learned things extrapolate badly</button></div></fieldset>
    <p id="ly-reveal" class="reveal" aria-live="polite" hidden></p>`)}
  ${step(3, 'Drag, then learn', `<p>Give examples at two or three screen widths, so it can tell “fixed size” from “grows with the screen”. Press <em>Learn</em>: the error line drops, three constants move in the code, and the screen sweeps through every width to show all cards following. Then drag the screen edge yourself.</p>`)}
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

export function COLOR() {
  const step = (n, t, body) => `<section class="uc-step" aria-labelledby="co-s${n}"><h2 id="co-s${n}" class="uc-h"><span class="uc-n">${n}</span> ${t}</h2>${body}</section>`
  const pick = (mode, role, label) => `<label class="co-pick"><input type="color" id="co-${mode}-${role}" data-mode="${mode}" data-role="${role}" /> <span>${label}</span></label>`
  return `<div class="uc" data-uc-color>
  ${step(1, 'A theme function, and a designer with opinions', `<p>One function turns a brand hue and seven constants per mode into a whole light and dark theme. The designer doesn't want to edit constants; they want to point at colours. And every text colour has to stay readable: WCAG AA, at least 4.5:1.</p>
  <div class="rk-board"><div class="rk-col" role="group" aria-labelledby="co-code-h"><p id="co-code-h" class="card-kicker">the theme code <span class="hand">runs as a Handwired net</span></p><pre class="big-code rk-code" tabindex="0"><code id="co-code"></code></pre>
    <ul class="rk-rules" aria-live="polite"><li><span class="r-label">contrast failures (36 brand hues × 2 modes × 8 pairs)</span> <output id="co-viol" class="ok">0</output></li><li><span class="r-label">furthest from the picks (8-bit units)</span> <output id="co-err">–</output></li><li><span class="r-label">net vs plain JS, different hex colours</span> <output id="co-js">–</output></li></ul></div>
  <div class="rk-col" role="group" aria-labelledby="co-picks-h"><p id="co-picks-h" class="card-kicker">the designer's picks</p>
    <p class="buttons co-presets" role="group" aria-label="Brand presets"></p>
    <div class="co-picks"><div><p class="r-label">light</p>${pick('light', 'bg', 'background')}${pick('light', 'text', 'text')}${pick('light', 'accent', 'accent')}</div><div><p class="r-label">dark</p>${pick('dark', 'bg', 'background')}${pick('dark', 'text', 'text')}${pick('dark', 'accent', 'accent')}</div></div>
    <p class="buttons rk-train"><button id="co-learn" type="button" class="button">Learn from the picks</button> <button id="co-reset" type="button" class="button secondary">Reset</button></p>
    <p id="co-msg" class="hint rk-status" aria-live="polite"></p>
    <svg id="co-ui" class="co-ui" viewBox="0 0 640 250" role="img" aria-label="Preview of the theme: a product card in light and dark mode, with heading, body text, caption, link, button and badge. Contrast ratios are listed in the table below."></svg>
    <div class="co-table"><table><thead><tr><th scope="col">pair (at the brand hue)</th><th scope="col">light</th><th scope="col">dark</th></tr></thead><tbody id="co-pairs"></tbody></table></div></div></div>`)}
  ${step(2, 'Predict', `<fieldset class="predict" id="co-predict"><legend>The Garden shop designer picked a soft grey-green for light-mode text, <code>#8a9a88</code>: only 2.8:1 on their background. After learning, the light theme's text will be…</legend><div class="choices">
    <button type="button" class="choice" data-v="exact">exactly that grey-green</button><button type="button" class="choice" data-v="close">as close to it as AA allows</button></div></fieldset>
    <p id="co-reveal" class="reveal" aria-live="polite" hidden></p>`)}
  ${step(3, 'Pick, then learn', `<p>Choose a brand above or pick your own colours (the colour inputs work from the keyboard). Press <em>Learn</em>: fourteen constants move in the code, the whole theme follows, and contrast is checked across 36 brand hues after every step.</p>`)}
  ${step(4, 'The foil: a generic model on the same picks', `<p>Fit a small neural net (hue and mode → all five colours, 4→16→15) to the same picks. It nails them, including the ones that are unreadable.</p>
    <p class="buttons"><button id="co-mlp" type="button" class="button">Train the generic model</button> <span class="switch-field"><input id="co-show-mlp" type="checkbox" role="switch" disabled /><label for="co-show-mlp">show its theme above</label></span></p>
    <p id="co-mlp-msg" class="hint" aria-live="polite"></p>`)}
  ${step(5, 'The diff you\u2019d review', `<pre class="big-code rk-diff" tabindex="0"><code id="co-diff">Learn first to see the diff.</code></pre>
    <p class="takeaway"><strong>Reach for Handwired when</strong> a designer's taste should set the numbers, but accessibility is a rule, not a suggestion.</p>
    <p class="hint uc-fine">How the rule is exact: every colour is built in linear RGB as a luminance Y plus a push along the brand hue inside the plane where luminance doesn't change, capped at the exact edge of the sRGB gamut. So each colour's WCAG luminance is exactly Y, and “contrast ≥ r” becomes a straight-line bound on Y, which the net applies with exact min/max operations (a clamp, i.e. a projection onto the allowed range). The net enforces 4.6:1, a little above AA's 4.5:1, to leave room for rounding to 8-bit hex; the counter then measures the real WCAG formula on the hex colours the browser paints. Large-text and UI pairs need only 3:1, so 4.6:1 covers them too. The generic model's outputs are clamped to [0, 1] before painting. Hue here is an angle in that luminance-neutral plane, not OKLCH hue. The preview is drawn as an image so that its deliberately failing colours (in the foil) don't make this page itself inaccessible; the table gives every ratio as text.</p>`)}
</div>`
}
