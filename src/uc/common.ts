// Shared helpers for the use-case demos: seeded randomness, Adam over a circuit's source cells, a generic MLP.
import { Circuit, type Wire } from '../lib/hw'

export function mulberry(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }

/** A built circuit plus which source cells are inputs and which are trainable weights. */
export type Net = { circuit: Circuit, src: Float32Array, inputs: Wire[], weights: Wire[], out: Wire[] }
export function evalNet(n: Net, x: ArrayLike<number>): Float32Array { for (let i = 0; i < n.inputs.length; i++) n.src[n.inputs[i]!] = x[i]!; return n.circuit.evaluateReference(n.src) }
export const getW = (n: Net) => n.weights.map(w => n.src[w]!)
export function setW(n: Net, v: ArrayLike<number>) { n.weights.forEach((w, i) => { n.src[w] = v[i]! }) }

/** Adam on `n`'s weights. `lossGrad(vals, i)` returns [loss, dLoss/dOut[] ] for example i, given forward values. */
export class Adam {
  m: Float64Array; v: Float64Array; t = 0; og: Float32Array
  constructor(public n: Net, public lr: number, public scale: number[], public clip?: [number, number][]) { const k = n.weights.length; this.m = new Float64Array(k); this.v = new Float64Array(k); this.og = new Float32Array(n.circuit.sourceSize + n.circuit.operations.length) }
  step(count: number, example: (i: number) => { x: ArrayLike<number>, grad: (vals: Float32Array) => [number, number[]] }): number {
    const n = this.n, k = n.weights.length, g = new Float64Array(k); let loss = 0
    for (let i = 0; i < count; i++) {
      const ex = example(i), vals = evalNet(n, ex.x), [l, d] = ex.grad(vals); loss += l
      if (d.every(z => z === 0)) continue
      this.og.fill(0); n.out.forEach((o, j) => { this.og[o] = d[j]! / count })
      const gr = n.circuit.backpropagateReference(vals, this.og)
      for (let j = 0; j < k; j++) g[j] = g[j]! + gr[n.weights[j]!]!
    }
    this.t++
    for (let j = 0; j < k; j++) {
      const gi = g[j]! * this.scale[j]!
      this.m[j] = .9 * this.m[j]! + .1 * gi; this.v[j] = .999 * this.v[j]! + .001 * gi * gi
      let w = n.src[n.weights[j]!]! - this.lr * this.scale[j]! * (this.m[j]! / (1 - .9 ** this.t)) / (Math.sqrt(this.v[j]! / (1 - .999 ** this.t)) + 1e-12)
      if (this.clip) w = Math.min(this.clip[j]![1], Math.max(this.clip[j]![0], w))
      n.src[n.weights[j]!] = w
    }
    return loss / count
  }
}

/** A generic MLP: inputs (scaled by `inScale`) → H ReLU units → outputs (scaled by `outScale`). Also a Handwired circuit. */
export function buildMlp(nIn: number, H: number, nOut: number, inScale: number[], outScale: number[], seed: number): Net {
  const nW = nIn * H + H + H * nOut + nOut
  const c = new Circuit(nIn + nW)
  const inputs = Array.from({ length: nIn }, (_, i) => c.source(i)), weights = Array.from({ length: nW }, (_, i) => c.source(nIn + i))
  let p = 0; const W1 = Array.from({ length: H }, () => Array.from({ length: nIn }, () => weights[p++]!)), B1 = Array.from({ length: H }, () => weights[p++]!)
  const W2 = Array.from({ length: nOut }, () => Array.from({ length: H }, () => weights[p++]!)), B2 = Array.from({ length: nOut }, () => weights[p++]!)
  // inputs may be negative, so products use the general multiply
  const hs = W1.map((row, j) => c.reglu([], 1, [[c.affine([...row.map((w, i) => [c.multiply(w, inputs[i]!), inScale[i]!] as [Wire, number]), [B1[j]!, 1]]), 1]], 0))
  const out = W2.map((row, o) => c.affine([...row.map((w, j) => [c.multiply(w, hs[j]!), outScale[o]!] as [Wire, number]), [B2[o]!, outScale[o]!]]))
  const n: Net = { circuit: c, src: new Float32Array(c.sourceSize), inputs, weights, out }
  const r = mulberry(seed); let q = 0
  for (let j = 0; j < H; j++) { for (let i = 0; i < nIn; i++) n.src[weights[q++]!] = (r() * 2 - 1) * Math.sqrt(6 / nIn); n.src[weights[q++]!] = (r() * 2 - 1) * 0.5 }
  for (let o = 0; o < nOut; o++) { for (let j = 0; j < H; j++) n.src[weights[q++]!] = (r() * 2 - 1) * Math.sqrt(6 / H) * 0.3; n.src[weights[q++]!] = 0 }
  return n
}
export const softplus = (z: number) => z > 30 ? z : Math.log1p(Math.exp(z))
export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))
