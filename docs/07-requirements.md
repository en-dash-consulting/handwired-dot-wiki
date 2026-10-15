# handwired.wiki — Requirements / Feature Plan

Independent community learning tool + gallery for Cheng Lou’s Handwired
(https://chenglou.me/handwired/, https://github.com/chenglou/handwired).
Modeled after learn-pretext.com and html-in-canvas.dev.

Handwired turns regular JavaScript into a neural net: no training, exact yet
fully differentiable, runnable in a browser without a GPU. Control flow
compiles to differentiable ops (e.g. ReLU soft-switches). Upstream demos:
Mini OS, Learned gallery (unfreeze & train weights live), Search 100k JSON
docs (JS → WebGPU kernels).

---

## Epic 1: Site Shell & Infrastructure

### E1.1: Project Scaffold
- Vite MPA + TypeScript strict mode (same stack pattern as learn-pretext)
- Package wiring for Handwired (consume upstream via git/local or published
  package once available; document install path clearly)
- Multi-page Vite entries for tracks + gallery + playground
- CSS architecture: reset, variables, global, layout, components
- Self-hosted fonts (Inter + JetBrains Mono)
- Smoke test: compile a tiny Handwired snippet in the browser in dev

### E1.2: Global Chrome
- Header with handwired.wiki wordmark + track nav
- Sidebar page tree grouped by track
- Footer: En Dash attribution, links to upstream repo + chenglou.me/handwired,
  GitHub for this site; “not affiliated” disclaimer
- Prev/Next page navigation across the learning path
- Mobile hamburger / slide-out nav

### E1.3: Shared Learning Components
- Source Viewer (Shiki): highlighted JS/TS, copy, annotation marks for
  “your code” vs “Handwired transform”
- Diff / Before-After panel: original JS side-by-side with compiled network
- Weight Inspector: list layers/weights for a compiled program; live meters
- Demo Container: interactive area + prose + source
- Playground controls: sliders, toggles, code editor (Monaco or CodeMirror)

### E1.4: Deploy & SEO Basics
- Custom domain handwired.wiki (CNAME), robots.txt, sitemap
- OG/Twitter cards + branded og-image
- llms.txt summarizing the learning tracks for AI crawlers
- GitHub Pages or equivalent static deploy pipeline

---

## Epic 2: Foundations Track

### E2.1: Home / Landing
- Hero: live “JS → neural net” transform animation of a tiny conditional
- Tagline: “Turn your regular JavaScript into a neural net”
- One-paragraph explanation + link to upstream
- CTA: Start Learning → Why Handwired; secondary: Open Playground / Gallery
- Quick-jump to tracks for returning visitors

### E2.2: Why Handwired — The Idea
- Problem framing: neural nets are usually trained approximate functions;
  Handwired makes exact programs that are also differentiable
- Walk through the site’s canonical example (a > 4 ? 10 : 12 → ReLU soft switch)
- Interactive: drag input `a`, see discrete branch vs continuous Handwired output
- Explain “no training / exact / differentiable / browser, no GPU required”

### E2.3: Getting Started
- How to obtain & run Handwired locally (clone upstream, bun install / bun start
  per upstream README; note if/when an npm package exists)
- First ≤15-line example with live compiled graph visualization
- Mental model: write JS → compile to network → run (and optionally train)
- Caveats: supported JS subset, browser constraints, WebGPU optional path

---

## Epic 3: Core Concepts Track

### E3.1: Soft Switches & ReLU Encoding
- Deep dive on encoding conditionals as ReLU differences
- Interactive graph of relu(a-4)-relu(a-5) vs hard branch
- Annotated source for several branch patterns (if/else, nested, comparisons)

### E3.2: Exactness vs Differentiability
- Show that at integer/decision points the network matches the original program
- Show gradients exist between decision boundaries
- Toggle “view as program” vs “view as network”

### E3.3: Layers, Weights & Zero Training
- Visualize layer count / weight count for small programs (cf. Mini OS: ~130
  layers / ~9,909 weights / 0 training)
- Explain when weights stay frozen vs when you unfreeze to learn

### E3.4: From JS to Kernels (WebGPU path)
- Conceptual pipeline: JS program → Handwired graph → WebGPU kernels
- Tie-in to the 100k JSON search upstream demo (regex, parse, highlight)
- Browser capability detection + graceful fallback messaging

---

## Epic 4: Interactive Playground

### E4.1: Code → Network Playground
- Editor for a constrained JS snippet
- Compile button → show network graph / weight table / runnable output
- Preset examples: ternary, nested if, arithmetic pipeline, toy classifier-style
- Error surfacing when input uses unsupported constructs

### E4.2: Live Input Explorer
- Bind playground inputs to sliders / fields
- Plot original vs Handwired output across an input range
- Optional gradient / sensitivity readout

### E4.3: Unfreeze & Train (Learned Mode)
- Inspired by upstream “Learned gallery”
- Start from a compiled exact program; unfreeze weights; train toward a target
  behavior in real time
- Reset-to-exact control; show weight drift visualization

---

## Epic 5: Gallery

### E5.1: Gallery Index
- Card grid of demos with weight/layer/training stats chips
- Filters: foundations, creative, performance/WebGPU, community
- Each card links to an immersive demo page

### E5.2: Upstream Demo Spotlights
- Mini OS spotlight page: explain architecture, embed or deep-link upstream,
  discuss DOM rendering from Handwired JS
- Learned gallery spotlight: recreate a minimal in-site version or guided tour
- Search 100k JSON spotlight: explain JS→WebGPU compilation story

### E5.3: Community / Site-Original Demos
- At least 3 original small demos unique to handwired.wiki (e.g. soft-logic
  puzzles, trainable UI widget, tiny differentiable game rule)
- Each with annotated source + “Open in Playground” affordance
- Contribution path documented for external demo PRs

---

## Epic 6: Reference & Trust

### E6.1: API / Mental-Model Reference
- Document the JS subset and transform rules as understood from upstream
  docs/src/template (keep clearly marked as community notes; link canonical)
- Glossary: weight, layer, relu encoding, freeze/unfreeze, kernel

### E6.2: About, Attribution, FAQ
- Independent En Dash resource disclaimer
- Links to Cheng Lou, upstream repo, live upstream demos
- FAQ: relation to pretext / other Cheng Lou work; browser support; training

### E6.3: Accessibility & Quality Bar
- Keyboard-reachable playground controls
- Prefers-reduced-motion for heavy animations
- Basic Playwright smoke tests for shell + playground compile path

---

## Non-Functional

- Static deployable site; no required backend
- Performance: playground compile/run should feel interactive on mid-tier laptops
- Clear separation between upstream demos (linked/embedded) and first-party content
- Do not claim official status or republish upstream assets without license check
