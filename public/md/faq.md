# Handwired FAQ

> Answers about Handwired by Cheng Lou: what it is, whether it's a compiler, if it needs training or a GPU, how it stays exact and differentiable, and how to install it.

Source: https://handwired.wiki/pages/faq.html

<p class="lede">Quick, sourced answers about Handwired. Everything here is drawn from <a href="https://chenglou.me/handwired/">chenglou.me/handwired</a> and the <a href="https://github.com/chenglou/handwired">chenglou/handwired</a> repository.</p>

## When should I use Handwired?

Use it when you already have readable code with a few constants, some rules that must stay exact, and data that should tune those constants: a search ranking learned from clicks, a layout fitted to a designer's examples, physics fitted to a recording, or a colour theme fitted to a designer's picks that must keep WCAG contrast. Handwired runs the code as an exact, differentiable neural net, so training only moves the numbers and the rules keep holding. If you have no trusted code and lots of data, a regular model is the better tool. See the live <a href="/pages/ranking.html">ranking demo</a>.

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
