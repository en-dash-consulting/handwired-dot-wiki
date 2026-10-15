---
slug: circuit-graph
title: "Code to Network: Visualize a Handwired Circuit's Operations & Layers | handwired.wiki"
nav: false
h1: "Code → network"
description: "See what a JavaScript expression becomes in Handwired: every affine, reglu and select operation of a circuit, laid out by layer, built live by the real runtime."
type: demo
demo: graph
---
<p class="lede">Pick a small program. The page builds it with Handwired and draws every operation by layer — cells on the left, outputs highlighted — then lists the same operations as formulas.</p>

<!-- demo -->

## How do I read the graph?

Each box is a wire: an input cell or an operation's result. Edges are the terms an operation reads; dashed edges have negative coefficients. An operation's layer is one more than the deepest wire it reads, so the number of columns is the program's depth.
