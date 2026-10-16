// Use case 4: fit GRAVITY, DRAG and BOUNCE so a simulated ball matches a recorded path; the floor stays exact.
import { Circuit, emitCompare, emitSelect, type Wire } from '../lib/hw'
import { mulberry, evalNet, type Net, buildMlp, Adam } from './common'

export const KEYS = ['GRAVITY', 'DRAG', 'BOUNCE'] as const
export type K = Record<typeof KEYS[number], number>
export const START: K = { GRAVITY: 0.25, DRAG: 0.04, BOUNCE: 0.4 }
/** The real ball (simulated recording; hidden from both models). */
export const REAL: K = { GRAVITY: 0.5, DRAG: 0.012, BOUNCE: 0.72 }
export const T = 72
export const RANGES: [number, number][] = [[0.05, 1.2], [0, 0.1], [0.1, 0.95]]
export const SCALE = [0.1, 0.01, 0.1]
export type Throw = { x: number, y: number, vx: number, vy: number }
export const THROW: Throw = { x: 10, y: 120, vx: 4, vy: 6 }
export const NEW_THROW: Throw = { x: 10, y: 40, vx: 6.5, vy: 11 }

export const source = (k: K) => `// one frame of the ball; y is height above the floor
function step(b) {
  const GRAVITY = ${k.GRAVITY.toFixed(3)}, DRAG = ${k.DRAG.toFixed(4)}, BOUNCE = ${k.BOUNCE.toFixed(3)}
  b.vy -= GRAVITY
  b.vx *= 1 - DRAG; b.vy *= 1 - DRAG
  b.x += b.vx; b.y += b.vy
  if (b.y < 0) { b.y = -b.y * BOUNCE; b.vy = -b.vy * BOUNCE }   // the floor
}`
export function jsPath(k: K, t0: Throw, n = T) {
  const b = { ...t0 }, out: [number, number][] = []
  for (let i = 0; i < n; i++) { b.vy -= k.GRAVITY; b.vx *= 1 - k.DRAG; b.vy *= 1 - k.DRAG; b.x += b.vx; b.y += b.vy; if (b.y < 0) { b.y = -b.y * k.BOUNCE; b.vy = -b.vy * k.BOUNCE } out.push([b.x, b.y]) }
  return out
}
/** The same step unrolled T times into one circuit. The bounce is an exact compare + select; the gradient flows
 *  through whichever branch was taken, so each bounce is differentiable but its timing is not. */
export function buildPhysics(): Net {
  const c = new Circuit(7)
  const inputs = [0, 1, 2, 3].map(i => c.source(i)), weights = [4, 5, 6].map(i => c.source(i))
  const [G, D, B] = weights as [Wire, Wire, Wire]
  ;[[0, 50], [0, 200], [-20, 20], [-20, 20]].forEach(([lo, hi], i) => c.assumeRange(inputs[i]!, lo!, hi!))
  weights.forEach((w, i) => c.assumeRange(w, RANGES[i]![0], RANGES[i]![1]))
  let [x, y, vx, vy] = inputs as [Wire, Wire, Wire, Wire]
  const keep = c.affine([[D, -1]], 1), negB = c.affine([[B, -1]]), zero = c.constant(0), out: Wire[] = []
  for (let i = 0; i < T; i++) {
    vy = c.affine([[vy, 1], [G, -1]])
    vx = c.multiply(vx, keep); vy = c.multiply(vy, keep)
    // Declared bounds keep the floor comparison's ranges finite over 72 frames (true for every throw this page makes).
    c.assumeRange(vx, -20, 20); c.assumeRange(vy, -45, 45)
    x = c.affine([[x, 1], [vx, 1]]); y = c.affine([[y, 1], [vy, 1]])
    c.assumeRange(y, -45, 400); c.assumeRange(x, -50, 2000)
    const below = emitCompare(c, y, '<', zero)
    y = emitSelect(c, below, y, c.multiply(y, negB)); vy = emitSelect(c, below, vy, c.multiply(vy, negB))
    out.push(x, y)
  }
  return { circuit: c, src: new Float32Array(c.sourceSize), inputs, weights, out }
}
export const throwIn = (t: Throw) => [t.x, t.y, t.vx, t.vy]
export function netPath(n: Net, t: Throw): [number, number][] { const v = evalNet(n, throwIn(t)); return Array.from({ length: T }, (_, i) => [v[n.out[2 * i]!]!, v[n.out[2 * i + 1]!]!]) }
/** The recording: the real ball, sampled with ±0.4 px of camera jitter. */
export function recording(seed = 2) { const r = mulberry(seed); return jsPath(REAL, THROW).map(([x, y]) => [x + (r() - .5) * .8, Math.max(0, y + (r() - .5) * .8)] as [number, number]) }
/** Adam on the mean squared distance to the ghost, over the first `horizon` frames (short first, then longer). */
export function trainer(net: Net, ghost: [number, number][], lr = 0.02) {
  const opt = new Adam(net, lr, SCALE, RANGES)
  return { opt, step: (horizon: number) => opt.step(1, () => ({ x: throwIn(THROW), grad: (v: Float32Array) => {
    let loss = 0; const d: number[] = new Array(2 * T).fill(0)
    for (let i = 0; i < horizon; i++) for (let j = 0; j < 2; j++) { const e = (v[net.out[2 * i + j]!]! - ghost[i]![j]!) / 10; loss += e * e / horizon; d[2 * i + j] = 2 * e / 10 / horizon }
    return [loss, d] } })) }
}
export const maxDiff = (a: [number, number][], b: [number, number][]) => Math.max(...a.map((p, i) => Math.hypot(p[0] - b[i]![0], p[1] - b[i]![1])))
/** Generic model: (frame, throw) → (x, y). */
export const mlpPhysics = (seed: number) => buildMlp(5, 16, 2, [1 / T, 1 / 50, 1 / 200, 1 / 20, 1 / 20], [400, 200], seed)
export function mlpTrainer(m: Net, ghost: [number, number][], lr = 0.01) {
  const opt = new Adam(m, lr, m.weights.map(() => 1))
  return { step: () => opt.step(T, i => ({ x: [i + 1, ...throwIn(THROW)], grad: (v: Float32Array) => { const ex = (v[m.out[0]!]! - ghost[i]![0]) / 10, ey = (v[m.out[1]!]! - ghost[i]![1]) / 10; return [ex * ex + ey * ey, [2 * ex / 10, 2 * ey / 10]] } })) }
}
export function mlpPath(m: Net, t: Throw, steps = T) { return Array.from({ length: steps }, (_, i) => { const v = evalNet(m, [i + 1, ...throwIn(t)]); return [v[m.out[0]!]!, v[m.out[1]!]!] as [number, number] }) }
export const belowFloor = (p: [number, number][]) => p.filter(q => q[1] < -0.5).length
