# Why Handwired?

> Why write JavaScript as a neural net? Handwired programs are exact like code, differentiable like models, and parallel like GPU kernels. The idea behind Cheng Lou's project.

Source: https://handwired.wiki/pages/why-handwired.html

<p class="lede"><strong>Short answer:</strong> a Handwired program is exact like ordinary code, differentiable like a trained model, and made of the two primitives GPUs are best at. You get all three properties from one artifact.</p>

## What problem does Handwired solve?

Normal programs and neural nets live in different worlds. Code is exact but you can't take its gradient; a neural net is differentiable but has to be trained and is only approximately right. Handwired writes programs *in the language of neural nets* — matrix multiplication plus ReGLU (a weighted sum times the ReLU of another weighted sum) over 32-bit floats — with weights chosen by hand so the network computes exactly what the code would.

## How is the program exact without training?

The weights are not learned; they are written by builder code. A comparison like `a > 4` becomes `relu(a - 4) - relu(a - 5)`, which is exactly 1 or 0 for integer `a`. Handwired's own `emitCompare` goes further: given declared value ranges (and optionally a grid such as whole pixels), it builds bits that equal JavaScript's comparison for **every** FP32 value in range. Tests in [Cheng Lou's handwired repo](https://github.com/chenglou/handwired) compare programs against plain-JavaScript references, e.g. the template's toggle switch is checked frame by frame against the same switch written in JavaScript.

## Why does differentiability matter?

Because the program only uses sums, products and ReLUs, gradients flow through it. The official handwired README lists use-cases this unlocks:

- unfreezing the weights and training them — "what does that even do? Let's find out!"
- attaching a frozen program to a generic neural net and training end to end
- running JS-style code with GPU-level parallelism, as the JSON search demo does across 100,000 documents

Exact *decisions* themselves are steps with zero slope, so gradients are useful for the continuous parts: positions, sizes, coefficients, table values. The [train demo](/pages/train.html) shows this in practice.

## Why only two primitives?

According to the README, keeping to `+`/`*` (matmul) and ReLU means "the full program stays differentiable", "the weights don't need training since they're written manually", and "existing GPU techniques, such as fusion, sparsity, reordering, have a great time optimizing such minimal primitives."

## Is it a compiler from JavaScript source?

No. Handwired's own docs are explicit: "No tool converts existing JavaScript source into a program." You write *builder code* — ordinary JavaScript that runs once and appends operations to a `Circuit`. Comments in handwired's own source show the plain JS each line replaces. See [Concepts](/pages/concepts.html).
