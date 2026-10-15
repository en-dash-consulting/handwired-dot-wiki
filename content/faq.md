---
slug: faq
title: "Handwired FAQ: What It Is, Who Made It, How It Works | handwired.wiki"
nav: FAQ
h1: Handwired FAQ
description: "Answers about Handwired by Cheng Lou: what it is, whether it's a compiler, if it needs training or a GPU, how it stays exact and differentiable, and how to install it."
type: faq
---
<p class="lede">Quick, sourced answers about Handwired. Everything here is drawn from <a href="https://chenglou.me/handwired/">chenglou.me/handwired</a> and the <a href="https://github.com/chenglou/handwired">chenglou/handwired</a> repository.</p>

## What is Handwired?

Handwired is an open-source project by Cheng Lou that turns regular JavaScript logic into a neural net: no training, exact, yet fully differentiable, and runnable in a browser without a GPU. Programs are written as matrix multiplications and ReLUs over 32-bit floats.

## Who made Handwired?

Cheng Lou, also known for Pretext and React Motion. The code is at github.com/chenglou/handwired under the MIT license.

## Is Handwired a JavaScript-to-neural-net compiler?

Not in the sense of parsing your source. You write builder code — ordinary JavaScript that runs once and appends operations to a Circuit. Upstream's docs state that no tool converts existing JavaScript source into a program.

## Does Handwired need training?

No. The weights are written by hand by builder code, so the program is exact from the start. You can optionally unfreeze numbers kept in cells and train them with the program's own gradients.

## Is it really exact?

Yes, within its declared contracts. emitCompare returns bits equal to JavaScript's comparison for every FP32 value in the operands' declared ranges; selects at an exact 0 or 1 return the chosen operand exactly. Some helpers, like division and square root, are approximate and documented with error bounds.

## How is it differentiable if it makes exact decisions?

Sums, products, selects and ReLUs all have gradients. Exact decisions are steps with zero slope, so gradients are useful for continuous values such as positions, sizes, coefficients and table entries.

## Does Handwired need a GPU or WebGPU?

No. The runtime evaluates programs in JavaScript on the CPU. Only the JSON search demo compiles its programs to WebGPU shaders to search 100,000 documents in parallel.

## How do I install Handwired?

It isn't on npm. Clone github.com/chenglou/handwired and run bun install, or add it to a bundler project as a pinned git dependency, e.g. "handwired": "github:chenglou/handwired#<commit>", and import its TypeScript sources.

## What demos exist?

Upstream has Mini OS (a small desktop with 9,909 weights in 130 layers), the Learned gallery (a photo layout whose coefficients train in real time) and a JSON search over 100,000 documents on WebGPU. This site adds interactive demos for soft switches, exact comparisons, circuit graphs and training.

## Is handwired.wiki official?

No. handwired.wiki is an independent community resource by En Dash Consulting, not affiliated with or endorsed by Cheng Lou.
