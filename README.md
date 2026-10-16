# handwired.wiki

Interactive learning tool and gallery for [Handwired](https://chenglou.me/handwired/) — Cheng Lou’s project that turns regular JavaScript into a neural net: no training required, exact yet fully differentiable, runnable in a browser without a GPU.

**Planned live site:** [handwired.wiki](https://handwired.wiki)

This site is an **independent community resource** by [En Dash Consulting](https://endash.us). It is not affiliated with or endorsed by the Handwired author.

## What is Handwired?

Handwired compiles ordinary JS control flow (conditionals, arithmetic, etc.) into an equivalent network of differentiable ops (e.g. ReLU-based soft switches). The result is exact for the original program, yet you can unfreeze weights and train — or run the compiled graph at scale (including WebGPU kernels).

Handwired's own demos on [chenglou.me/handwired](https://chenglou.me/handwired/) include a Mini OS (DOM-rendered desktop from Handwired JS), a “learned gallery” that trains compiled weights in real time, and a 100k-document JSON search compiled to WebGPU.

## Status

Live at https://handwired.wiki (GitHub Pages, repo `en-dash-consulting/handwired-dot-wiki`). Content pages (home, why, concepts, getting started, gallery, FAQ, about) plus five live demos running the real Handwired runtime: soft switch, comparison explorer, code→network graph, unfreeze & train, and the in Cheng Lou's handwired repo toggle template.

## Development

```bash
npm install
npm run dev       # Vite dev server
npm run build     # generate pages from content/ + tsc + vite build → dist/
npm run preview   # serve dist/
npm test          # Playwright: axe (light+dark), 375/768/1280 overflow, demo smoke tests
npm run og        # regenerate og-image.png + icons
```

### How pages are made

`content/*.md` (frontmatter + markdown) → `scripts/build-pages.mjs` generates `index.html`, `pages/*.html` (header/footer, meta, JSON-LD), `public/md/*.md` copies, `llms.txt`, `llms-full.txt` and `sitemap.xml`. Edit content, not generated HTML. Demo widgets live in the `DEMOS` map in the script; their logic is in `src/demos/`.

### Consuming Handwired

Cheng Lou's handwired repo ([chenglou/handwired](https://github.com/chenglou/handwired)) is a bun repo of raw TypeScript sources, not a published npm package. We install it as a **pinned git dependency**:

```json
"handwired": "github:chenglou/handwired#<commit-sha>"
```

and import the `.ts` sources directly (Vite transpiles them), e.g. `import { mountToggle } from 'handwired/template/toggle.ts'`. Type shims for imported modules live in `src/env.d.ts` (in Cheng Lou's handwired repo sources are not type-checked by our `tsc`). Bump the SHA deliberately to upgrade.

## Workflow

Tasks are tracked in the n-dx PRD (`.ndx/`) and driven with `ndx next` / `ndx status` / `ndx update`. Autonomous `ndx work` (Claude/hench) is **not** used on this project, even though `.ndx/config.json` still lists an LLM vendor.

## Related

- Cheng Lou's handwired repo: [chenglou/handwired](https://github.com/chenglou/handwired) · [chenglou.me/handwired](https://chenglou.me/handwired/)
- Sibling learning sites: [learn-pretext.com](https://learn-pretext.com) · [html-in-canvas.dev](https://html-in-canvas.dev)
