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
