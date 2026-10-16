// Use case 5: a theme function whose constants learn from a designer's picks, with WCAG AA contrast kept exact.
//
// How the rule is exact: each colour is built in linear RGB as  Y·(1,1,1) + c·d(hue), where d lies in the plane of
// zero luminance (0.2126 R + 0.7152 G + 0.0722 B = 0). So the colour's WCAG relative luminance is exactly Y, and
// chroma is capped per channel at the exact gamut edge, (1 − Y)/d or Y/(−d), so no channel leaves [0, 1] (no gamut clipping can change Y). WCAG contrast
// (L1 + 0.05) / (L2 + 0.05) ≥ r is then a *linear* bound on Y, and the net applies it with exact min/max operations.
import { Circuit, emitMinimumExact, emitMaximumExact, type Wire } from '../lib/hw'
import { mulberry, evalNet, type Net, buildMlp, Adam } from './common'

export const RATIO = 4.6 // enforced in the net; 0.1 above AA's 4.5 to cover rounding to 8-bit hex. Checked on the hex.
export const ROLES = ['bg', 'surface', 'text', 'muted', 'accent'] as const
export type Role = typeof ROLES[number]
export const KEYS = ['BG', 'STEP', 'TEXT', 'MUTED', 'ACCENT', 'TINT', 'ACCENT_C'] as const
export type Mode = 'light' | 'dark'
export type K = Record<typeof KEYS[number], number>
export const START: Record<Mode, K> = {
  light: { BG: 0.9, STEP: 0.05, TEXT: 0.03, MUTED: 0.1, ACCENT: 0.08, TINT: 0.01, ACCENT_C: 0.06 },
  dark: { BG: 0.02, STEP: 0.02, TEXT: 0.8, MUTED: 0.45, ACCENT: 0.4, TINT: 0.005, ACCENT_C: 0.06 },
}
export const RANGES: Record<Mode, [number, number][]> = {
  light: [[0.2, 1], [0.02, 0.3], [0, 1], [0, 1], [0, 1], [0, 0.015], [0, 0.6]],
  dark: [[0, 0.15], [0.01, 0.1], [0, 1], [0, 1], [0, 1], [0, 0.015], [0, 0.6]],
}
// Training clips a hair inside the declared ranges (float32 storage of e.g. 0.3 rounds up).
const CLIP = { light: RANGES.light.map(([a, b]) => [a + 1e-6, b - 1e-6] as [number, number]), dark: RANGES.dark.map(([a, b]) => [a + 1e-6, b - 1e-6] as [number, number]) }
// A basis of the zero-luminance plane in linear RGB, and the largest channel any unit direction in it can reach.
const LUM = [0.2126, 0.7152, 0.0722]
const norm = (v: number[]) => { const n = Math.hypot(...v); return v.map(x => x / n) }
const U = norm([LUM[1]!, -LUM[0]!, 0]), V = (() => { const w = [LUM[0]! * LUM[2]!, LUM[1]! * LUM[2]!, -(LUM[0]! ** 2 + LUM[1]! ** 2)]; return norm(w) })()
export const M = Math.max(...[0, 1, 2].map(i => Math.hypot(U[i]!, V[i]!)))
export const CAPMAX = 64
export const dirOnly = (hue: number) => { const a = hue * Math.PI / 180; return [0, 1, 2].map(i => Math.cos(a) * U[i]! + Math.sin(a) * V[i]!) }
/** Net inputs for a hue: the direction, then 1/d for channels that rise (P) and 1/(−d) for channels that fall (N). */
export const dir = (hue: number) => { const d = dirOnly(hue); return [...d, ...d.map(x => x >= 0 ? Math.min(1 / x, CAPMAX) : 0), ...d.map(x => x < 0 ? Math.min(-1 / x, CAPMAX) : 0)] }
export const hueOf = (lin: number[]) => { const y = LUM[0]! * lin[0]! + LUM[1]! * lin[1]! + LUM[2]! * lin[2]!, d = lin.map(x => x - y); return (Math.atan2(d[0]! * V[0]! + d[1]! * V[1]! + d[2]! * V[2]!, d[0]! * U[0]! + d[1]! * U[1]! + d[2]! * U[2]!) * 180 / Math.PI + 360) % 360 }

export function buildTheme(mode: Mode): Net {
  const c = new Circuit(16)
  const inputs = Array.from({ length: 9 }, (_, i) => c.source(i)), weights = [9, 10, 11, 12, 13, 14, 15].map(i => c.source(i))
  inputs.forEach((w, i) => i < 3 ? c.assumeRange(w, -M, M) : c.assumeRange(w, 0, CAPMAX)); weights.forEach((w, i) => c.assumeRange(w, RANGES[mode][i]![0], RANGES[mode][i]![1]))
  const [BG, STEP, TEXT, MUTED, ACCENT, TINT, AC] = weights as Wire[]
  const k = (v: number) => c.constant(v), out: Wire[] = []
  const color = (Y: Wire, C: Wire) => {
    // per channel: how far we may go along the hue before that channel leaves [0, 1] (exact gamut edge)
    const caps = [0, 1, 2].map(i => c.affine([[c.multiply(c.affine([[Y, -1]], 1), inputs[3 + i]!), 1], [c.multiply(Y, inputs[6 + i]!), 1]]))
    const ce = emitMinimumExact(c, C, emitMinimumExact(c, caps[0]!, emitMinimumExact(c, caps[1]!, caps[2]!)))
    for (let i = 0; i < 3; i++) out.push(c.affine([[Y, 1], [c.multiply(ce, inputs[i]!), 1]]))
  }
  let surface: Wire, fix: (w: Wire) => Wire
  if (mode === 'light') {
    surface = emitMaximumExact(c, c.affine([[BG!, 1], [STEP!, -1]]), k(0.2))
    const bound = c.affine([[surface, 1 / RATIO]], 0.05 / RATIO - 0.05) // darkest-allowed text: (surface + .05) / r − .05
    fix = w => emitMaximumExact(c, emitMinimumExact(c, w, bound), k(0))
  } else {
    surface = emitMinimumExact(c, c.affine([[BG!, 1], [STEP!, 1]]), k(0.15))
    const bound = c.affine([[surface, RATIO]], 0.05 * RATIO - 0.05) // lightest-required text: r · (surface + .05) − .05
    fix = w => emitMinimumExact(c, emitMaximumExact(c, w, bound), k(1))
  }
  color(BG!, TINT!); color(surface, TINT!); color(fix(TEXT!), TINT!); color(fix(MUTED!), TINT!); color(fix(ACCENT!), AC!)
  return { circuit: c, src: new Float32Array(c.sourceSize), inputs, weights, out }
}
export type Theme = Record<Role, number[]>
export function themeOf(n: Net, hue: number): Theme { const v = evalNet(n, dir(hue)); return Object.fromEntries(ROLES.map((r, j) => [r, [0, 1, 2].map(i => v[n.out[3 * j + i]!]!)])) as Theme }

/** The same theme in plain JavaScript (float64), for the code panel and the exactness check. */
export function jsTheme(mode: Mode, k: K, hue: number): Theme {
  const x = dir(hue), d = x.slice(0, 3), col = (Y: number, C: number) => { const ce = Math.min(C, ...[0, 1, 2].map(i => (1 - Y) * x[3 + i]! + Y * x[6 + i]!)); return d.map(v => Y + ce * v) }
  const surface = mode === 'light' ? Math.max(k.BG - k.STEP, 0.2) : Math.min(k.BG + k.STEP, 0.15)
  const fix = mode === 'light' ? (y: number) => Math.max(Math.min(y, (surface + .05) / RATIO - .05), 0) : (y: number) => Math.min(Math.max(y, RATIO * (surface + .05) - .05), 1)
  return { bg: col(k.BG, k.TINT), surface: col(surface, k.TINT), text: col(fix(k.TEXT), k.TINT), muted: col(fix(k.MUTED), k.TINT), accent: col(fix(k.ACCENT), k.ACCENT_C) }
}
export const source = (mode: Mode, k: K) => {
  const f = (v: number) => (Math.round(v * 1000) / 1000).toString()
  return `const ${mode.toUpperCase()} = { BG: ${f(k.BG)}, STEP: ${f(k.STEP)}, TEXT: ${f(k.TEXT)}, MUTED: ${f(k.MUTED)}, ACCENT: ${f(k.ACCENT)}, TINT: ${f(k.TINT)}, ACCENT_C: ${f(k.ACCENT_C)} }`
}
export const SOURCE_BODY = `// Y = luminance (0 black … 1 white), C = colourfulness, along the brand hue
function theme(hue, K, mode) {
  const bg = K.BG, surface = mode === 'light' ? max(bg - K.STEP, 0.2) : min(bg + K.STEP, 0.15)
  // the rule: text, muted, links and buttons keep contrast ≥ ${RATIO} with bg and surface
  const ok = y => mode === 'light' ? clamp(y, 0, (surface + .05) / ${RATIO} - .05)
                                   : clamp(y, ${RATIO} * (surface + .05) - .05, 1)
  return { bg: color(bg, K.TINT, hue), surface: color(surface, K.TINT, hue),
    text: color(ok(K.TEXT), K.TINT, hue), muted: color(ok(K.MUTED), K.TINT, hue),
    accent: color(ok(K.ACCENT), K.ACCENT_C, hue) }   // links and button fills
}`

// ---- real-world checks, on the 8-bit hex the browser paints -------------------------------------------------------
const enc = (x: number) => { x = Math.min(1, Math.max(0, x)); return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055 }
const dec = (v: number) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
export const hex = (lin: number[]) => '#' + lin.map(x => Math.round(enc(x) * 255).toString(16).padStart(2, '0')).join('')
export const fromHex = (h: string) => [1, 3, 5].map(i => dec(parseInt(h.slice(i, i + 2), 16) / 255))
const lumHex = (h: string) => { const l = fromHex(h); return LUM[0]! * l[0]! + LUM[1]! * l[1]! + LUM[2]! * l[2]! }
/** WCAG 2 contrast ratio, computed from the hex colours. */
export const contrast = (a: string, b: string) => { const x = lumHex(a), y = lumHex(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) }
export const PAIRS: [string, Role, Role, number][] = [
  ['body text on background', 'text', 'bg', 4.5], ['body text on card', 'text', 'surface', 4.5], ['caption on background', 'muted', 'bg', 4.5], ['caption on card', 'muted', 'surface', 4.5],
  ['link on background', 'accent', 'bg', 4.5], ['link on card', 'accent', 'surface', 4.5], ['button label on button', 'bg', 'accent', 4.5], ['button edge vs background (UI, 3:1)', 'accent', 'bg', 3],
]
export const hexTheme = (t: Theme) => Object.fromEntries(ROLES.map(r => [r, hex(t[r])])) as Record<Role, string>
export function violations(t: Record<Role, string>) { return PAIRS.filter(([, a, b, min]) => contrast(t[a], t[b]) < min) }
export const CHECK_HUES = Array.from({ length: 36 }, (_, i) => i * 10)

// ---- the designer's picks ------------------------------------------------------------------------------------------
export type Picks = Record<Mode, Partial<Record<Role, string>>>
export const PRESETS: { name: string, picks: Picks }[] = [
  { name: 'Calm bank', picks: { light: { bg: '#f4f7fb', text: '#1d2b3a', accent: '#3d7be0' }, dark: { bg: '#0f1620', text: '#dfe8f2', accent: '#5b9cff' } } },
  { name: 'Garden shop', picks: { light: { bg: '#f6faf3', text: '#8a9a88', accent: '#4caf50' }, dark: { bg: '#121a12', text: '#c8d8c4', accent: '#66d36e' } } },
  { name: 'Sunset studio', picks: { light: { bg: '#fff6ee', text: '#3a2a20', accent: '#ff8a3d' }, dark: { bg: '#1e1410', text: '#f5e6da', accent: '#ff9d5c' } } },
]
export const brandHue = (p: Picks) => hueOf(fromHex(p.light.accent!))
/** Squared distance in linear RGB to each picked colour, both modes. */
export function trainer(nets: Record<Mode, Net>, picks: Picks, lr = 0.01) {
  const hue = brandHue(picks), x = dir(hue)
  const opts = { light: new Adam(nets.light, lr, nets.light.weights.map((_, i) => RANGES.light[i]![1] - RANGES.light[i]![0]), CLIP.light), dark: new Adam(nets.dark, lr, nets.dark.weights.map((_, i) => RANGES.dark[i]![1] - RANGES.dark[i]![0]), CLIP.dark) }
  return { step: () => (['light', 'dark'] as const).reduce((L, m) => {
    const n = nets[m], targets = Object.entries(picks[m]).map(([r, h]) => [ROLES.indexOf(r as Role), fromHex(h!)] as const)
    return L + opts[m].step(1, () => ({ x, grad: () => { const v = evalNet(n, x), d = new Array(15).fill(0); let l = 0; for (const [j, t] of targets) for (let i = 0; i < 3; i++) { const e = v[n.out[3 * j + i]!]! - t[i]!; l += e * e; d[3 * j + i] = 2 * e } return [l, d] } }))
  }, 0) }
}
/** Generic model: (hue direction, mode) → all five colours, trained on the picks (plus the current theme's unpicked roles). */
export const mlpTheme = (seed: number) => buildMlp(4, 16, 15, [1, 1, 1, 1], new Array(15).fill(1), seed)
export function mlpTrainer(m: Net, picks: Picks, rest: Record<Mode, Theme>, lr = 0.01) {
  const opt = new Adam(m, lr, m.weights.map(() => 1)), x = dir(brandHue(picks))
  const ex = (['light', 'dark'] as const).map(mode => ({ x: [...x.slice(0, 3), mode === 'dark' ? 1 : 0], t: ROLES.flatMap(r => picks[mode][r] ? fromHex(picks[mode][r]!) : rest[mode][r]) }))
  return { step: () => opt.step(2, i => ({ x: ex[i]!.x, grad: (v: Float32Array) => { let l = 0; const d = ex[i]!.t.map((t, j) => { const e = v[m.out[j]!]! - t; l += e * e; return 2 * e }); return [l, d] } })) }
}
export function mlpThemeOf(m: Net, hue: number, mode: Mode): Theme { const v = evalNet(m, [...dirOnly(hue), mode === 'dark' ? 1 : 0]); return Object.fromEntries(ROLES.map((r, j) => [r, [0, 1, 2].map(i => Math.min(1, Math.max(0, v[m.out[3 * j + i]!]!)))])) as Theme }
export const randomK = (r: () => number, mode: Mode): K => Object.fromEntries(KEYS.map((k, i) => [k, RANGES[mode][i]![0] + r() * (RANGES[mode][i]![1] - RANGES[mode][i]![0])])) as K
export { mulberry }
