# Critique log: use-case demos (feat/use-cases)

Two hats: top UX designer + top teacher. Each pass: look at desktop (1280) and mobile (390) screenshots in screenshots-review/, then fix.

## Pass 1
- Ranking, model: "393 out-of-stock breaks" appeared for every ranker. That was a bug in the data (a pinned item could be out of stock, so the two rules conflicted), not a real break. Fixed: the pinned item is always in stock.
- Ranking, model: the weights hit the clip of 10, so the "learned code" was unreadable. Cause: pairwise loss on position-biased clicks has no counter-evidence. Switched to the standard click-choice loss with known position bias, and dropped rule-governed rows from the training data. The learned weights are now ≈ 1.5 × the hidden taste (3.05/1.33/6.37/4.64 vs 3/1.5/6/4.5).
- Ranking, model: the generic model took 55 s. Now it uses minibatches and runs in a Web Worker (~3 s, disclosed).
- Home 1280: on first paint the FLIP animation ran from (0,0), so the list flew in over the headline. Fixed: no animation for rows that weren't on screen yet.
- Home 1280: the Simulate/Learn buttons were below the fold, under the code. Moved them to the top of the list column, so the action sits beside what it changes. h1 is smaller.
- Full ranking page: the buttons were in step 3, far from the list, so you couldn't see the list re-sort. They now live in the board in step 1 (the same component as home).
- Mobile: the code was below the 20-row list, so the "weights tick" was invisible while learning. Added a compact live weights line above the list (≤860 px). The home on mobile shows the top 10.
- Teaching: "Rules held at every step" was asserted, not measured. Now it's checked after every training step and the count is printed.

## Pass 2
- Layout 320 px foil: overflowing cards were silently shrunk by flexbox, which hid the very failure we wanted to show. Fixed with `flex: none` and a dashed screen edge.
- Layout: the timing included the 1,000-card bounds check per step. The label now says so.
- Physics: the path used a third of the plot. Rescaled. The legend colours didn't match the strokes; replaced with matching swatches.
- Physics, honesty: the bounce isn't differentiable in its timing, and long unrolls explode. The fine print says so, and training uses a growing horizon (12 → 72 frames). Replay is reported as a measured difference (~1e-4 px), not as "exact".
- GPU search: we can't compute a live "0 differences" counter without re-implementing upstream's test harness. Say so, and link the upstream tests. Don't print a speed-up number; tell people to read the live timing line.
- Lighthouse home: CLS 0.30 from the JS-filled list. Reserved height before hydration → 0.077; performance 75 → 88.

## Still weak
- Ranking predict is a fairly easy question once you've read the hook. Physics and layout have the stronger "surprise".
- The home on mobile needs a scroll to see the code while learning (there's the compact weights line).
- Speed index (~7 s) on home is dominated by web fonts plus the dynamic import.

## Pass 3: Accessible colour themes
- Model: the first gamut cap, min(Y, 1−Y)/M, was too conservative, so saturated brand blues came out grey (#63749f for #3d7be0). It's now replaced by the exact per-channel gamut edge, fed as inputs (1/d for rising channels, 1/(−d) for falling ones). One bug: channels that are ~flat got cap 0. Fixed with min(1/d, 64).
- Model: training hit the "outside its assumed range" invariant, because float32 rounds 0.3 up. Training now clips 1e-6 inside the declared ranges.
- Model: the light card collapsed into the background (STEP → 0) and the dark backgrounds were over-tinted. STEP now has a floor (0.02 light, 0.01 dark) and TINT a cap of 0.015.
- A11y: the preview deliberately shows failing colours in the foil, so it's an SVG image with an aria-label. Every ratio is in an HTML table, which keeps the page itself axe-clean.
- Markup bug: the build's `</table>` → `</table></div>` rewrite closed the demo root early. Use a bare `<table>` inside our own wrapper.
- 375 px: overflow appeared only *after* interacting, on colour **and ranking** (an auto grid track sized to the min-content of the long diff `<pre>`, plus nowrap labels). Fixed with a `minmax(0, 1fr)` track and wrapping labels. Added post-interaction no-scroll tests for all four interactive use cases.
- Teaching: the predict reveal first hard-coded a hex (#717271) from the prototype. Now it points to the live table instead.
- Still weak: the long code panel wraps awkwardly on narrow screens. "Hue" is an angle in a luminance-neutral linear-RGB plane, not OKLCH hue (the fine print says so). Handwired's "furthest from the picks" is large (46–83 in 8-bit units) because the picks themselves fail AA. That's the point, but it can read as a worse fit.

## Pass 4 (Oct 16): Nick's review
- Layout: nobody could tell the sides were draggable. Now the screen has a dark "drag ⟷" edge bar (an ew-resize cursor, and a keyboard slider), and each card has a dotted grip with the same cursor. On first view the screen sweeps 1280→760→1280 and both handles nudge; this is skipped under reduced motion and stops as soon as you touch anything. Your examples show as dashed copper outlines. Mockup chips jump to each width. An error line draws while it learns, then it sweeps 320→1440. The generic model sweeps to 320 so you can see the overflow.
- Ranking: training is visible. Shoppers stream in, there's a learning round every 25, and a top-3 chart. Each column has live rule badges.
- "Upstream" was ambiguous, so every instance was replaced with "Cheng Lou's handwired repo" / "the official handwired README/docs" / "handwired's own …", and it links to github.com/chenglou/handwired on first mention.
- Calm theme: there were contrast regressions in the lesson (faded predict choices, `.side` panels, --bad). They're fixed, and axe is clean.
