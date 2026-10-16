// Use case 1: a hand-tuned search ranking formula, tuned from click logs, with business rules that must hold.
import { Circuit } from '../lib/hw'
import { mulberry, evalNet, type Net, buildMlp, Adam } from './common'

export const WEIGHTS = ['W_MATCH', 'W_POP', 'W_FRESH', 'W_RATING'] as const
export type W = Record<typeof WEIGHTS[number], number>
export const GUT: W = { W_MATCH: 5, W_POP: 3, W_FRESH: 1, W_RATING: 1 }
/** What shoppers actually value (simulated; hidden from both models). */
export const HIDDEN: W = { W_MATCH: 2, W_POP: 1, W_FRESH: 4, W_RATING: 3 }
export const PIN = 100000, OUT_OF_STOCK = -50000, WMAX = 10, TOP_N = 10
export type Item = { name: string, match: number, pop: number, fresh: number, rating: number, pinned: number, inStock: number }
export const FEATS = ['match', 'pop', 'fresh', 'rating', 'pinned', 'inStock'] as const

export const source = (w: W, live = false) => {
  const f = (v: number) => live ? (Math.round(v * 100) / 100).toString() : String(v)
  return `// features are 0–100. Business rules: pinned first, out-of-stock never in the top ${TOP_N}.
function score(item) {
  const W_MATCH = ${f(w.W_MATCH)}, W_POP = ${f(w.W_POP)}, W_FRESH = ${f(w.W_FRESH)}, W_RATING = ${f(w.W_RATING)}
  let s = W_MATCH * item.match + W_POP * item.pop
        + W_FRESH * item.fresh + W_RATING * item.rating
  if (item.pinned) s += ${PIN}
  if (!item.inStock) s += ${OUT_OF_STOCK}
  return s
}`
}
export const compileJs = (w: W) => new Function(source(w) + '\nreturn score')() as (it: Item) => number

/** The same formula as a Handwired circuit. Weights are source cells, clipped to 0..10 while training. */
export function buildRanker(): Net {
  const c = new Circuit(10)
  const inputs = [0, 1, 2, 3, 4, 5].map(i => c.source(i)), weights = [6, 7, 8, 9].map(i => c.source(i))
  for (let i = 0; i < 4; i++) c.assumeRange(inputs[i]!, 0, 100)
  const terms = weights.map((w, i) => [c.multiply(w, inputs[i]!), 1] as const)
  const s = c.affine([...terms, [inputs[4]!, PIN], [inputs[5]!, -OUT_OF_STOCK]], OUT_OF_STOCK)
  return { circuit: c, src: new Float32Array(10), inputs, weights, out: [s] }
}
export const featsOf = (it: Item) => [it.match, it.pop, it.fresh, it.rating, it.pinned, it.inStock]

const NAMES = ['Aero Buds Pro', 'Bassline 2', 'Quiet Comfort Lite', 'Nimbus Over-Ear', 'Pulse Sport', 'Studio Monitor X', 'Echo Mini', 'Drift ANC', 'Volt Wireless', 'Halo Open-Ear', 'Orbit Kids', 'Summit Pro Max', 'Lumen Neckband', 'Tempo Fit', 'Cove Sleep Buds', 'Ridge Gaming Headset', 'Mono Earpiece', 'Arc Folding', 'Zen Travel', 'Flux Bone Conduction']
/** A result list for "wireless headphones". Seeded; features are whole numbers 0..100. */
export function results(seed: number, n = 20): Item[] {
  const r = mulberry(seed), int = () => Math.round(r() * 100)
  return Array.from({ length: n }, (_, i) => ({ name: NAMES[i % NAMES.length]!, match: int(), pop: int(), fresh: int(), rating: int(), pinned: 0, inStock: r() < 0.8 ? 1 : 0 }))
    .map((it, i) => i === 7 ? { ...it, pinned: 1, inStock: 1, match: 30, pop: 20, rating: 40 } : it)
}
export const utility = (it: Item) => (HIDDEN.W_MATCH * it.match + HIDDEN.W_POP * it.pop + HIDDEN.W_FRESH * it.fresh + HIDDEN.W_RATING * it.rating) / 100

/** Simulated shoppers: each scans the top 10 (attention fades with position) and clicks one. */
export function shoppers(list: Item[], order: number[], n: number, seed: number) {
  const r = mulberry(seed), clicks: Click[] = []
  for (let u = 0; u < n; u++) {
    const shown = order.slice(0, TOP_N), ws = shown.map((idx, pos) => Math.exp(utility(list[idx]!) * 1.5) / (1 + pos * 0.35) * (list[idx]!.inStock ? 1 : 0.6))
    let t = r() * ws.reduce((a, b) => a + b, 0), k = 0; while (t > ws[k]! && k < ws.length - 1) t -= ws[k++]!
    clicks.push({ clicked: shown[k]!, shown })
  }
  return clicks
}
export type Click = { clicked: number, shown: number[] }
export const order = (list: Item[], f: (it: Item) => number) => list.map((it, i) => [f(it), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map(x => x[1])

/** How good a ranking is for shoppers: share of fresh shoppers whose favourite in-stock item is in the top 3. */
export function top3Rate(f: (it: Item) => number, lists: Item[][]) {
  let hit = 0
  for (const L of lists) { const best = L.map((it, i) => [it.inStock ? utility(it) : -1, i] as const).sort((a, b) => b[0] - a[0])[0]![1]; if (order(L, f).slice(0, 3).includes(best)) hit++ }
  return hit / lists.length
}
/** Rule checks on many lists: pinned result first, no out-of-stock result in the top N (when enough are in stock). */
export function ruleBreaks(f: (it: Item) => number, lists: Item[][]) {
  let pin = 0, oos = 0
  for (const L of lists) { const o = order(L, f); if (L.some(x => x.pinned) && !L[o[0]!]!.pinned) pin++; if (o.slice(0, TOP_N).some(i => !L[i]!.inStock) && L.filter(x => x.inStock).length >= TOP_N) oos++ }
  return { pin, oos, total: lists.length }
}
export const testLists = (count: number, seed: number) => Array.from({ length: count }, (_, i) => results(seed * 1000 + i))

/** Train with the standard click-choice loss: each shopper picked one of the 10 shown results, so maximise
 *  softmax(score / TEMP − position bias)[clicked]. The position bias (1 + 0.35 × position) is assumed known, as a
 *  propensity estimate would be in practice. Minibatches of clicks, Adam, gradients from backpropagateReference. */
export const TEMP = 100
export function clickTrainer(net: Net, list: Item[], clicks: readonly Click[], lr: number, scale: number[], clip?: [number, number][], batch = 24, seed = 5) {
  const opt = new Adam(net, lr, scale, clip), r = mulberry(seed)
  // Pinned and out-of-stock rows are governed by the hard rules, so they carry no evidence about the weights.
  const free = (i: number) => !list[i]!.pinned && !!list[i]!.inStock
  clicks = clicks.filter(c => free(c.clicked)).map(c => ({ clicked: c.clicked, shown: c.shown.filter(free) }))
  return { opt, step: () => {
    const ex: { x: number[], grad: () => [number, number[]] }[] = []
    for (let b = 0; b < Math.min(batch, clicks.length); b++) {
      const c = clicks[Math.floor(r() * clicks.length)]!
      const z = c.shown.map((i, pos) => evalNet(net, featsOf(list[i]!))[net.out[0]!]! / TEMP - Math.log(1 + pos * 0.35))
      const m = Math.max(...z), e = z.map(v => Math.exp(v - m)), S = e.reduce((x, y) => x + y, 0)
      c.shown.forEach((i, j) => { const p = e[j]! / S, y = i === c.clicked ? 1 : 0; ex.push({ x: featsOf(list[i]!), grad: () => [y ? -Math.log(p) : 0, [(p - y) / TEMP]] }) })
    }
    return opt.step(ex.length, i => ex[i]!) * 10
  } }
}
export const mlpRanker = (seed: number) => buildMlp(6, 8, 1, [0.01, 0.01, 0.01, 0.01, 1, 1], [100], seed)
