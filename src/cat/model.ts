// "How hard should the cat jump?" One tiny JS rule, and the same rule as a Handwired circuit.
// Every number the lesson shows is computed live from these functions.
import { Circuit, emitCompare, emitClampExact, type Wire } from '../lib/hw'

export const KNOBS = ['BASE', 'PER_CM', 'EXTRA'] as const
export type Knob = typeof KNOBS[number]
export type Params = Record<Knob, number>
export const HIGH = 50, MAX = 100, TOP = 100, GRID = 32
/** The rule as written, for a light cat. */
export const START: Params = { BASE: 8, PER_CM: 0.75, EXTRA: 12 }
/** The world after a big holiday dinner (a simulated "truth"; the lesson says so). */
export const HEAVY_CAT: Params = { BASE: 12, PER_CM: 1, EXTRA: 16 }
export const RANGES: Record<Knob, [number, number]> = { BASE: [-20, 40], PER_CM: [0, 2], EXTRA: [0, 40] }
export const SCALE: Record<Knob, number> = { BASE: 1, PER_CM: 0.025, EXTRA: 1 }
/** Exported constants are rounded to these steps, so they stay exact in float32. */
export const ROUND: Record<Knob, number> = { BASE: 1, PER_CM: 0.25, EXTRA: 1 }
export const roundParams = (p: Params) => Object.fromEntries(KNOBS.map(k => [k, Math.round(p[k] / ROUND[k]) * ROUND[k]])) as Params

export const fmtK = (v: number, k: Knob) => k === 'PER_CM' ? (Math.round(v * 100) / 100).toString() : (Math.round(v * 10) / 10).toString()
export const source = (p: Params, live = false) => `function jumpPower(shelf) {
  const BASE = ${live ? fmtK(p.BASE, 'BASE') : p.BASE}, PER_CM = ${live ? fmtK(p.PER_CM, 'PER_CM') : p.PER_CM}, EXTRA = ${live ? fmtK(p.EXTRA, 'EXTRA') : p.EXTRA}
  let power = BASE + PER_CM * shelf
  if (shelf > ${HIGH}) power += EXTRA
  return Math.min(Math.max(power, 0), ${MAX})
}`
export function compileJs(p: Params): (shelf: number) => number {
  return new Function(source(p) + '\nreturn jumpPower')() as (s: number) => number
}
/** Every shelf height the exactness check runs: 0 to 100 cm in 1/32 cm steps. */
export const ALL = Float32Array.from({ length: TOP * GRID + 1 }, (_, i) => i / GRID)

export type Net = { circuit: Circuit, src: Float32Array, x: Wire, out: Wire, cells: Wire[], labels: Map<number, string> }
export function evalNet(n: Net, x: number): Float32Array { n.src[n.x] = x; return n.circuit.evaluateReference(n.src) }
export const outOf = (n: Net, x: number) => evalNet(n, x)[n.out]!

export function buildHandwired(): Net {
  const c = new Circuit(4)
  const x = c.source(0), cells = [1, 2, 3].map(i => c.source(i))
  c.assumeRange(x, 0, TOP); c.assumeGrid(x, 1 / GRID)
  KNOBS.forEach((k, i) => c.assumeRange(cells[i]!, RANGES[k][0], RANGES[k][1]))
  const [base, perCm, extra] = cells as [Wire, Wire, Wire]
  const high = emitCompare(c, x, '>', c.constant(HIGH))
  const power = c.affine([[base, 1], [c.multiply(perCm, x), 1], [c.multiply(extra, high), 1]])
  const out = emitClampExact(c, power, c.constant(0), c.constant(MAX))
  const labels = new Map<number, string>([[x, 'shelf'], [base, 'BASE'], [perCm, 'PER_CM'], [extra, 'EXTRA'], [high, 'shelf > 50'], [power, 'power'], [out, 'answer']])
  return { circuit: c, src: new Float32Array(4), x, out, cells, labels }
}
export function setParams(n: Net, p: Params) { KNOBS.forEach((k, i) => { n.src[n.cells[i]!] = p[k] }) }
export function getParams(n: Net): Params { return Object.fromEntries(KNOBS.map((k, i) => [k, n.src[n.cells[i]!]!])) as Params }

/** A regular neural net of the usual kind: 1 → 16 → 1 ReLU, 49 weights, also run on the Handwired runtime. */
export const HIDDEN = 16
export function buildMlp(): Net {
  const c = new Circuit(1 + 3 * HIDDEN + 1)
  const x = c.source(0); c.assumeRange(x, 0, TOP)
  const cells = Array.from({ length: 3 * HIDDEN + 1 }, (_, i) => c.source(1 + i))
  const terms: [Wire, number][] = []
  for (let j = 0; j < HIDDEN; j++) {
    const z = c.affine([[c.multiply(cells[j]!, x), 1 / TOP], [cells[HIDDEN + j]!, 1]])
    terms.push([c.multiply(cells[2 * HIDDEN + j]!, c.reglu([], 1, [[z, 1]], 0)), MAX])
  }
  const out = c.affine([...terms, [cells[3 * HIDDEN]!, MAX]])
  return { circuit: c, src: new Float32Array(c.sourceSize), x, out, cells, labels: new Map() }
}
export function mulberry(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
export function initMlp(n: Net, seed: number) {
  const r = mulberry(seed)
  for (let j = 0; j < HIDDEN; j++) {
    const w = (r() < .5 ? -1 : 1) * (2 + 6 * r()), at = r()
    n.src[n.cells[j]!] = w; n.src[n.cells[HIDDEN + j]!] = -w * at; n.src[n.cells[2 * HIDDEN + j]!] = (r() - .5) * 0.2
  }
  n.src[n.cells[3 * HIDDEN]!] = 0
}
/** Adam over a net's source cells; gradients come from circuit.backpropagateReference. */
export class Adam {
  m: Float64Array; v: Float64Array; t = 0
  constructor(public net: Net, public lr: number | ((t: number) => number), public scale: number[], public clip?: [number, number][]) { this.m = new Float64Array(net.cells.length); this.v = new Float64Array(net.cells.length) }
  step(data: readonly { x: number, y: number }[]): number {
    const n = this.net, g = new Float64Array(n.cells.length); let sq = 0
    const og = new Float32Array(n.circuit.sourceSize + n.circuit.operations.length)
    for (const d of data) {
      const vals = evalNet(n, d.x), e = vals[n.out]! - d.y; sq += e * e
      og.fill(0); og[n.out] = 2 * e / data.length / (MAX * MAX)
      const gr = n.circuit.backpropagateReference(vals, og)
      for (let i = 0; i < n.cells.length; i++) g[i] = g[i]! + gr[n.cells[i]!]!
    }
    this.t++; const lr = typeof this.lr === 'number' ? this.lr : this.lr(this.t)
    for (let i = 0; i < n.cells.length; i++) {
      const gi = g[i]! * this.scale[i]!
      this.m[i] = .9 * this.m[i]! + .1 * gi; this.v[i] = .999 * this.v[i]! + .001 * gi * gi
      let w = n.src[n.cells[i]!]! - lr * this.scale[i]! * (this.m[i]! / (1 - .9 ** this.t)) / (Math.sqrt(this.v[i]! / (1 - .999 ** this.t)) + 1e-12)
      if (this.clip) w = Math.min(this.clip[i]![1], Math.max(this.clip[i]![0], w))
      n.src[n.cells[i]!] = w
    }
    return Math.sqrt(sq / data.length)
  }
}
/** The 12 test jumps the heavier cat makes; each records the power it really needed. */
export const TEST_SHELVES = [4, 12, 20, 28, 36, 44, 49, 52, 58, 64, 72, 86]
