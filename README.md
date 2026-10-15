# handwired.wiki

Interactive learning tool and gallery for [Handwired](https://chenglou.me/handwired/) — Cheng Lou’s project that turns regular JavaScript into a neural net: no training required, exact yet fully differentiable, runnable in a browser without a GPU.

**Planned live site:** [handwired.wiki](https://handwired.wiki)

This site is an **independent community resource** by [En Dash Consulting](https://endash.us). It is not affiliated with or endorsed by the Handwired author.

## What is Handwired?

Handwired compiles ordinary JS control flow (conditionals, arithmetic, etc.) into an equivalent network of differentiable ops (e.g. ReLU-based soft switches). The result is exact for the original program, yet you can unfreeze weights and train — or run the compiled graph at scale (including WebGPU kernels).

Upstream demos on [chenglou.me/handwired](https://chenglou.me/handwired/) include a Mini OS (DOM-rendered desktop from Handwired JS), a “learned gallery” that trains compiled weights in real time, and a 100k-document JSON search compiled to WebGPU.

## Status

Scaffold only: git + n-dx initialized; feature plan captured in the n-dx PRD. Site implementation is not started yet.

## Development

Coming soon (planned: Vite MPA + TypeScript, modeled after [learn-pretext.com](https://learn-pretext.com)).

```bash
# after scaffold lands
npm install
npm run dev
```

## Related

- Upstream: [chenglou/handwired](https://github.com/chenglou/handwired) · [chenglou.me/handwired](https://chenglou.me/handwired/)
- Sibling learning sites: [learn-pretext.com](https://learn-pretext.com) · [html-in-canvas.dev](https://html-in-canvas.dev)
