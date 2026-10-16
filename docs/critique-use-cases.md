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
