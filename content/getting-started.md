---
slug: getting-started
title: "Getting Started with Handwired: Install, Run the Demos & Use It in Vite | handwired.wiki"
nav: Getting started
h1: Getting started with Handwired
description: "Step-by-step: clone chenglou/handwired, run its demos with Bun, start from the toggle template, or add Handwired to a Vite + TypeScript project as a pinned git dependency."
type: howto
steps:
  - "Install Bun (handwired is tested with Bun 1.4.3)."
  - "Clone the repo: git clone https://github.com/chenglou/handwired && cd handwired && bun install."
  - "Run bun start and open http://127.0.0.1:3000/ for Mini OS, the learned gallery and JSON search."
  - "Run bun run start:template to open the toggle switch template, the starting point for a new app."
  - "Or add Handwired to a Vite project as a pinned git dependency and import its TypeScript sources."
---
<p class="lede"><strong>Short answer:</strong> Handwired isn't published to npm. Clone the GitHub repo and run it with <a href="https://bun.sh">Bun</a>, or add it to a bundler project as a pinned git dependency — that's how this site uses it.</p>

## How do I run handwired's own demos?

The repo needs Bun (handwired's own tests with Bun 1.4.3).

```sh
git clone https://github.com/chenglou/handwired
cd handwired
bun install
bun start                 # demo site at http://127.0.0.1:3000/ — /os/, /learned-gallery/, /json-search/
bun run start:template    # the toggle switch template at http://localhost:3000/
bun run test              # every test, about 3 minutes
```

## Where should I start reading code?

The official handwired README recommends `template/` — a toggle switch written as one numeric program, `toggle-reference.ts` (the same switch in plain JS) and `toggle.test.ts` comparing the two — and `docs/tutorial.md`, which walks through it. Then `docs/expressions.md` for single expressions, `docs/patterns.md` for loops, and `docs/execution-model.md` as the reference.

## How do I use Handwired in a Vite or TypeScript project?

Add it as a git dependency pinned to a commit:

```json
{
  "dependencies": {
    "handwired": "github:chenglou/handwired#4ea7fcb27ebe93acf49b9f29a93e162b975bad46"
  }
}
```

Then import the runtime's TypeScript sources directly — Vite transpiles them:

```ts
import { Circuit, emitCompare, emitSelect } from 'handwired/src/runtime/numeric-ui-core.ts'

const circuit = new Circuit(2)            // two source cells
const a = circuit.source(0), b = circuit.source(1)
circuit.assumeRange(a, 0, 1024); circuit.assumeGrid(a, 1)
circuit.assumeRange(b, 0, 1024); circuit.assumeGrid(b, 1)
const bit = emitCompare(circuit, a, '>=', b)  // exactly 0 or 1
const max = emitSelect(circuit, bit, b, a)    // bit ? a : b

const values = circuit.evaluateReference(new Float32Array([7, 3]))
console.log(values[bit], values[max])         // 1 7
```

In `tsconfig.json`, set `"allowImportingTsExtensions": true` with `"noEmit": true` (or let your bundler handle types). The package is marked `private` in Cheng Lou's handwired repo and has no stable API promise, so pin a commit and upgrade deliberately.

## What does a real app look like?

A full app adds a source table (`createSourceTable` from `src/runtime/cells.ts`) to declare inputs, events and state, `table.next` for each state cell, `createEvaluator` to compile it, and `advanceFrame` from `host-timing.ts` for springs. The [toggle demo](/pages/toggle.html) on this site runs handwired's own template unmodified.
