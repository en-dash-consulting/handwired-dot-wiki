# handwired.wiki

Interactive learning tool and gallery for [Handwired](https://chenglou.me/handwired/) — Cheng Lou’s project that turns regular JavaScript into a neural net: no training required, exact yet fully differentiable, runnable in a browser without a GPU.

**Planned live site:** [handwired.wiki](https://handwired.wiki)

This site is an **independent community resource** by [En Dash Consulting](https://endash.us). It is not affiliated with or endorsed by the Handwired author.

## What is Handwired?

Handwired compiles ordinary JS control flow (conditionals, arithmetic, etc.) into an equivalent network of differentiable ops (e.g. ReLU-based soft switches). The result is exact for the original program, yet you can unfreeze weights and train — or run the compiled graph at scale (including WebGPU kernels).

Upstream demos on [chenglou.me/handwired](https://chenglou.me/handwired/) include a Mini OS (DOM-rendered desktop from Handwired JS), a “learned gallery” that trains compiled weights in real time, and a 100k-document JSON search compiled to WebGPU.

## Status

Project scaffold landed: Vite MPA + TypeScript strict, self-hosted Inter + JetBrains Mono, CSS architecture (`src/styles/`), placeholder pages, and a Handwired smoke test at `/pages/playground.html`. Deployed to GitHub Pages via `.github/workflows/deploy.yml` with `public/CNAME` → handwired.wiki.

## Development

```bash
npm install
npm run dev       # Vite dev server
npm run build     # tsc (strict, noEmit) + vite build → dist/
npm run preview   # serve dist/
```

### Consuming Handwired

Upstream ([chenglou/handwired](https://github.com/chenglou/handwired)) is a bun repo of raw TypeScript sources, not a published npm package. We install it as a **pinned git dependency**:

```json
"handwired": "github:chenglou/handwired#<commit-sha>"
```

and import the `.ts` sources directly (Vite transpiles them), e.g. `import { mountToggle } from 'handwired/template/toggle.ts'`. Type shims for imported modules live in `src/env.d.ts` (upstream sources are not type-checked by our `tsc`). Bump the SHA deliberately to upgrade.

## Workflow

Tasks are tracked in the n-dx PRD (`.ndx/`) and driven with `ndx next` / `ndx status` / `ndx update`. Autonomous `ndx work` (Claude/hench) is **not** used on this project, even though `.ndx/config.json` still lists an LLM vendor.

## Related

- Upstream: [chenglou/handwired](https://github.com/chenglou/handwired) · [chenglou.me/handwired](https://chenglou.me/handwired/)
- Sibling learning sites: [learn-pretext.com](https://learn-pretext.com) · [html-in-canvas.dev](https://html-in-canvas.dev)
