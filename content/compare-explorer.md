---
slug: compare-explorer
title: "Exact Comparison Explorer: emitCompare, emitSelect & emitMinimumExact | handwired.wiki"
nav: false
h1: Exact comparison explorer
description: "Interactive Handwired demo: compare two numbers with emitCompare, pick with emitSelect, take emitMinimumExact, see operation counts with and without a grid, and fuzz against JavaScript."
type: demo
demo: compare
---
<p class="lede">Handwired's <code>emitCompare</code> returns a bit equal to JavaScript's comparison for every FP32 value in the declared range. Change the inputs, the relation and the grid, then fuzz thousands of random pairs.</p>

<!-- demo -->

## Why does the grid change the cost?

With both operands declared on an integer grid, `a >= b` is built from the integer difference as `relu(1 − relu(−D))` — 2 operations. Without a grid, the difference is lifted by a *sign cascade* of power-of-two multiplications and clamps until any nonzero difference down to 2⁻¹⁴⁹ reaches 1 — more operations and layers, the same bits.

## What are rounding points?

Operations whose FP32 evaluation carries meaning, which a backend must keep intact: `'integer bit'` for the grid form and `'sign cascade'` for the general form. `circuit.roundingPoints()` lists them.
