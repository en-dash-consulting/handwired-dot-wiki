// Use case 2: a card-sizing function whose constants are fitted to a designer's drags; the bounds stay exact.
import { Circuit, emitClampExact } from '../lib/hw'
import { mulberry, evalNet, type Net, buildMlp, Adam } from './common'

export const KEYS = ['BASE', 'PER_LEVEL', 'SHARE'] as const
export type K = Record<typeof KEYS[number], number>
export const START: K = { BASE: 200, PER_LEVEL: 40, SHARE: 0.05 }
/** The designer's taste (simulated; hidden from both models). */
export const DESIGNER: K = { BASE: 140, PER_LEVEL: 70, SHARE: 0.16 }
export const MIN_W = 160, GUTTER = 32, VMIN = 320, VMAX = 1440
export const RANGES: [number, number][] = [[0, 400], [0, 300], [0, 0.6]]
export const SCALE = [40, 30, 0.06]

export const source = (k: K) => `// importance is 0–3; the result is the card's width in px
function cardWidth(importance, viewport) {
  const BASE = ${Math.round(k.BASE * 10) / 10}, PER_LEVEL = ${Math.round(k.PER_LEVEL * 10) / 10}, SHARE = ${Math.round(k.SHARE * 1000) / 1000}
  const w = BASE + PER_LEVEL * importance + SHARE * viewport
  return clamp(w, ${MIN_W}, viewport - ${GUTTER})   // never too small, never wider than the screen
}`
export const jsWidth = (k: K, imp: number, v: number) => Math.min(v - GUTTER, Math.max(MIN_W, k.BASE + k.PER_LEVEL * imp + k.SHARE * v))

export function buildLayout(): Net {
  const c = new Circuit(5)
  const inputs = [c.source(0), c.source(1)], weights = [2, 3, 4].map(i => c.source(i))
  c.assumeRange(inputs[0]!, 0, 3); c.assumeRange(inputs[1]!, VMIN, VMAX)
  weights.forEach((w, i) => c.assumeRange(w, RANGES[i]![0], RANGES[i]![1]))
  const raw = c.affine([[weights[0]!, 1], [c.multiply(weights[1]!, inputs[0]!), 1], [c.multiply(weights[2]!, inputs[1]!), 1]])
  const lo = c.constant(MIN_W), hi = c.affine([[inputs[1]!, 1]], -GUTTER)
  const w = emitClampExact(c, raw, lo, hi)
  return { circuit: c, src: new Float32Array(c.sourceSize), inputs, weights, out: [w] }
}
export type Drag = { imp: number, v: number, w: number }
/** A simulated designer: drags the four importance levels at three screen widths. */
export function designerDrags(seed = 3): Drag[] {
  const r = mulberry(seed), out: Drag[] = []
  for (const v of [1280, 900, 420]) for (let imp = 0; imp < 4; imp++) out.push({ imp, v, w: Math.round(jsWidth(DESIGNER, imp, v) + (r() - .5) * 12) })
  return out
}
export function trainer(net: Net, drags: readonly Drag[], lr: number, scale: number[], clip?: [number, number][]) {
  const opt = new Adam(net, lr, scale, clip)
  return { opt, step: () => opt.step(drags.length, i => ({ x: [drags[i]!.imp, drags[i]!.v], grad: (vals: Float32Array) => { const e = (vals[net.out[0]!]! - drags[i]!.w) / 100; return [e * e, [2 * e / 100]] } })) }
}
/** Bounds check: 50 screen widths × 20 random cards. */
export const CHECK = (() => { const r = mulberry(9), out: [number, number][] = []; for (let i = 0; i < 50; i++) { const v = Math.round(VMIN + (VMAX - VMIN) * i / 49); for (let j = 0; j < 20; j++) out.push([Math.floor(r() * 4), v]) } return out })()
export function outOfBounds(f: (imp: number, v: number) => number) { let bad = 0; for (const [imp, v] of CHECK) { const w = f(imp, v); if (w < MIN_W - .5 || w > v - GUTTER + .5) bad++ } return bad }
export const mlpLayout = (seed: number) => buildMlp(2, 12, 1, [1 / 3, 1 / VMAX], [400], seed)
export const netWidth = (n: Net) => (imp: number, v: number) => evalNet(n, [imp, v])[n.out[0]!]!
