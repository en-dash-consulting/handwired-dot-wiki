// The flagship comparison: one shipping-price rule, three ways.
// 1. plain JS (SOURCE, executed with new Function), 2. the same rule as a Handwired circuit whose
// constants are source cells, 3. a generic 1→16→1 ReLU MLP, also a Handwired circuit, trained from a seed.
// Every number the page shows is computed live from these.
import { Circuit, emitCompare, emitClampExact, type Wire } from '../lib/hw'

export const KNOBS = ['BASE', 'PER_KG', 'SURCHARGE'] as const
export type Knob = typeof KNOBS[number]
export type Params = Record<Knob, number>
export const HEAVY = 30, CAP = 6000, MAX_KG = 100, GRID = 64
export const START: Params = { BASE: 500, PER_KG: 80, SURCHARGE: 1200 }
export const RANGES: Record<Knob, [number, number]> = { BASE: [-2000, 3000], PER_KG: [0, 300], SURCHARGE: [0, 4000] }
export const SCALE: Record<Knob, number> = { BASE: 100, PER_KG: 10, SURCHARGE: 100 }

export const source = (p: Params) => `// cents · never < 0, never > CAP
const BASE = ${fmtC(p.BASE)}, PER_KG = ${fmtC(p.PER_KG)}
const SURCHARGE = ${fmtC(p.SURCHARGE)}
const HEAVY = ${HEAVY}, CAP = ${CAP}

function shipping(kg) {
  let cost = BASE + PER_KG * kg
  if (kg > HEAVY) cost += SURCHARGE
  return Math.min(Math.max(cost, 0), CAP)
}`
export function fmtC(v: number) { return Number.isInteger(v) ? String(v) : v.toFixed(2) }
export function compileJs(p: Params): (kg: number) => number {
  return new Function(source(p) + '\nreturn shipping')() as (kg: number) => number
}

/** Every parcel weight the exactness check runs: 0 to 100 kg in 1/64 kg steps. */
export const ALL_KG = Float32Array.from({ length: MAX_KG * GRID + 1 }, (_, i) => i / GRID)

export type Net = { circuit: Circuit, src: Float32Array, kg: Wire, out: Wire, cells: Wire[] }
export function evalNet(n: Net, kg: number): Float32Array { n.src[n.kg] = kg; return n.circuit.evaluateReference(n.src) }

/** The same function, written with Handwired's builder. Cells 1..3 are BASE, PER_KG, SURCHARGE. */
export function buildHandwired(): Net {
  const c = new Circuit(4)
  const kg = c.source(0), cells = [1, 2, 3].map(i => c.source(i))
  c.assumeRange(kg, 0, MAX_KG); c.assumeGrid(kg, 1 / GRID)
  KNOBS.forEach((k, i) => c.assumeRange(cells[i]!, RANGES[k][0], RANGES[k][1]))
  const [base, perKg, sur] = cells as [Wire, Wire, Wire]
  const heavy = emitCompare(c, kg, '>', c.constant(HEAVY))                  // if (kg > HEAVY)
  const cost = c.affine([[base, 1], [c.multiply(perKg, kg), 1], [c.multiply(sur, heavy), 1]])
  const out = emitClampExact(c, cost, c.constant(0), c.constant(CAP))         // Math.min(Math.max(cost, 0), CAP)
  return { circuit: c, src: new Float32Array(4), kg, out, cells }
}
export function setParams(n: Net, p: Params) { KNOBS.forEach((k, i) => { n.src[n.cells[i]!] = p[k] }) }

/** Generic baseline: y = CAP · (W2 · relu(W1 · x + b1) + b2), x = kg / 100. 16 hidden units, 49 weights. */
export const HIDDEN = 16
export function buildMlp(): Net {
  const c = new Circuit(1 + 3 * HIDDEN + 1)
  const kg = c.source(0); c.assumeRange(kg, 0, MAX_KG)
  const cells = Array.from({ length: 3 * HIDDEN + 1 }, (_, i) => c.source(1 + i))
  const terms: [Wire, number][] = []
  for (let j = 0; j < HIDDEN; j++) {
    const z = c.affine([[c.multiply(cells[j]!, kg), 1 / MAX_KG], [cells[HIDDEN + j]!, 1]])
    const h = c.reglu([], 1, [[z, 1]], 0)
    terms.push([c.multiply(cells[2 * HIDDEN + j]!, h), CAP])
  }
  const out = c.affine([...terms, [cells[3 * HIDDEN]!, CAP]])
  return { circuit: c, src: new Float32Array(c.sourceSize), kg, out, cells }
}
export function mulberry(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
export function initMlp(n: Net, seed: number) {
  // Kinks spread over the input range (a standard trick for 1-D ReLU nets), random slopes and signs.
  const r = mulberry(seed)
  for (let j = 0; j < HIDDEN; j++) {
    const w = (r() < .5 ? -1 : 1) * (2 + 6 * r()), at = r()
    n.src[n.cells[j]!] = w; n.src[n.cells[HIDDEN + j]!] = -w * at; n.src[n.cells[2 * HIDDEN + j]!] = (r() - .5) * 0.2
  }
  n.src[n.cells[3 * HIDDEN]!] = 0
}

/** Adam over chosen source cells, gradients from circuit.backpropagateReference. */
export class Adam {
  m: Float64Array; v: Float64Array; t = 0
  constructor(public net: Net, public lr: number | ((t: number) => number), public scale: number[], public clip?: [number, number][]) { this.m = new Float64Array(net.cells.length); this.v = new Float64Array(net.cells.length) }
  /** One full-batch step on (kg, cents) examples; returns RMSE in cents before the step. */
  step(data: readonly { kg: number, cents: number }[]): number {
    const n = this.net, g = new Float64Array(n.cells.length); let sq = 0
    const outGrad = new Float32Array(n.circuit.sourceSize + n.circuit.operations.length)
    for (const d of data) {
      const vals = evalNet(n, d.kg), e = vals[n.out]! - d.cents; sq += e * e
      outGrad.fill(0); outGrad[n.out] = 2 * e / data.length / (CAP * CAP)
      const gr = n.circuit.backpropagateReference(vals, outGrad)
      for (let i = 0; i < n.cells.length; i++) g[i] = g[i]! + gr[n.cells[i]!]!
    }
    this.t++
    for (let i = 0; i < n.cells.length; i++) {
      const gi = g[i]! * this.scale[i]!
      this.m[i] = .9 * this.m[i]! + .1 * gi; this.v[i] = .999 * this.v[i]! + .001 * gi * gi
      const mh = this.m[i]! / (1 - .9 ** this.t), vh = this.v[i]! / (1 - .999 ** this.t)
      let w = n.src[n.cells[i]!]! - (typeof this.lr === 'number' ? this.lr : this.lr(this.t)) * this.scale[i]! * mh / (Math.sqrt(vh) + 1e-12)
      if (this.clip) w = Math.min(this.clip[i]![1], Math.max(this.clip[i]![0], w))
      n.src[n.cells[i]!] = w
    }
    return Math.sqrt(sq / data.length)
  }
}
