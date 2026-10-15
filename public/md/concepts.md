# Handwired concepts

> How Handwired turns if/else, comparisons and min/max into ReLU circuits over FP32: cells, wires, builder code, emitCompare, emitSelect, exactness and gradients.

Source: https://handwired.wiki/pages/concepts.html

<p class="lede">A Handwired program is a <strong>circuit</strong>: a fixed list of FP32 operations that reads a table of numbers (<em>cells</em>) and computes outputs. You build it once with ordinary JavaScript, then evaluate it every frame.</p>

## What are the building blocks?

From upstream's [docs](https://github.com/chenglou/handwired/tree/main/docs), every program is made of four kinds of operation:

| Operation | What it computes |
| --- | --- |
| `circuit.affine(terms, bias)` | a weighted sum, e.g. `viewportWidth × 0.5 − 26` |
| `circuit.reglu(left, leftBias, gate, gateBias)` | `(left + leftBias) × max(0, gate + gateBias)`; with `left = []` and `leftBias = 1` it's a plain ReLU |
| `circuit.boolean(score)` | a score in 0..1 rounded to exactly 0 or 1 |
| `circuit.indexRead(index, table)` | `table[floor(index)]`, a table read |

**Builder functions** such as `emitCompare`, `emitSelect`, `emitMinimumExact` and `emitAnimatedObject` append several operations at once. Every arithmetic step rounds to FP32, like `Math.fround`.

## What are cells and wires?

The **source table** is a `Float32Array` the program reads. Each number in it is a **cell**: a constant, an input written by the host (e.g. the viewport width), an event bit (e.g. a pointer press), or state the program computes for the next evaluation. A **wire** is the position of a number — a cell or an operation's result. The **host** is the JavaScript around the program: it writes inputs, evaluates, copies next state back, and writes the DOM.

## How does an if/else become a network?

Both branches always compute, and an exact bit picks one: `emitSelect(circuit, condition, off, on)` is `condition × on + (1 − condition) × off`. An `if` that assigns a variable becomes a select on that cell's next value. Loops with runtime counts aren't allowed — a program runs every operation on every evaluation — so loops become counts, trees, tables, or the same work on every item (upstream's `patterns.md`).

## Why are comparisons exact?

`emitCompare(circuit, a, '>=', b)` returns a wire that is exactly 1 when the comparison holds, equal to JavaScript's comparison for every pair of FP32 values in the operands' declared ranges. With both operands on a declared grid (say whole numbers), it costs 2 operations in 2 layers; without a grid it builds a *sign cascade* — about 15 operations in 14 layers for operands in 0..16,384. The [comparison explorer](/pages/compare-explorer.html) shows these counts live.

## What exactly is differentiable?

`circuit.backpropagateReference` differentiates the FP32 arithmetic as real-valued, with a zero slope at a ReLU's corner. Sums, products and selects give useful gradients; exact decisions are steps with zero slope. Keep a number you might want to learn in a **cell** rather than baking it into a weight, and gradients will reach it — that's what the [train demo](/pages/train.html) does.

## Does it need a GPU?

No. The runtime evaluates programs in JavaScript on the CPU. Only upstream's JSON search demo writes its programs as WebGPU shaders.
