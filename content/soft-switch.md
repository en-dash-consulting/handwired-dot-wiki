---
slug: soft-switch
title: "Soft Switch Demo: a > 4 ? 10 : 12 as ReLUs — Live Handwired Circuit | handwired.wiki"
nav: false
h1: "Soft switch: an if/else made of ReLUs"
description: "Interactive demo: the Handwired README's a > 4 ? 10 : 12 built as relu(a - 4) - relu(a - 5) and a select, evaluated by the real Handwired runtime as you drag a."
type: demo
demo: soft-switch
---
<p class="lede">The ternary <code>a &gt; 4 ? 10 : 12</code> becomes <code>above4 = relu(a − 4) − relu(a − 5)</code> and <code>result = above4 × 10 + (1 − above4) × 12</code>. Drag <code>a</code> — every number below comes from a real Handwired <code>Circuit</code>.</p>

<!-- demo -->

## Why does this work?

For an integer `a`, `relu(a − 4) − relu(a − 5)` is 0 when `a ≤ 4` and 1 when `a ≥ 5` — an exact bit. `emitSelect` then computes `bit × on + (1 − bit) × off`, so both branches run and the bit picks one. Set `a` to a fraction like 4.5 and the bit becomes 0.5, blending the branches: that's why handwired's own `emitCompare` relies on declared ranges and grids to guarantee exact bits.

## What does the circuit look like?

Two `reglu` operations, one `affine` difference, and the select macro. See it drawn on the [code → network](/pages/circuit-graph.html) page.
