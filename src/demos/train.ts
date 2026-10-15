import '../lib/site'
import { buildTrainable, evaluate, type Built } from '../lib/programs'
import { $, fmt, setStatus, prefersReducedMotion } from '../lib/dom'
import { h, scale, pathOf, axes } from '../lib/svg'

const built: Built = buildTrainable(), { circuit } = built
const PARAMS = ['t', 'k', 'hi', 'lo'] as const
type Name = (typeof PARAMS)[number]
type Params = Record<Name, number>
const exact: Params = { t: 4, k: 1, hi: 10, lo: 12 }
const RANGES: Record<Name, [number, number]> = { t: [0, 10], k: [0, 6], hi: [0, 18], lo: [0, 18] }
const targets: Record<string, (a: number) => number> = {
  'a > 6 ? 3 : 15': a => a > 6 ? 3 : 15,
  'ramp from 2 up to 14 between a = 3 and 7': a => 2 + 12 * Math.min(1, Math.max(0, (a - 3) / 4)),
  'a > 2 ? 11 : 5': a => a > 2 ? 11 : 5,
}
const xs = Array.from({ length: 21 }, (_, i) => i * 0.5)
let p: Params = { ...exact }, step = 0, running = false, losses: [number, number][] = [], ghosts: string[] = []
const hist: Record<Name, number[]> = { t: [], k: [], hi: [], lo: [] }
const targetSel = $<HTMLSelectElement>('#target'), lrIn = $<HTMLInputElement>('#lr'), runBtn = $<HTMLButtonElement>('#run')

function lossAndGrad(params: Params, f: (a: number) => number) {
  const g: Params = { t: 0, k: 0, hi: 0, lo: 0 }; let loss = 0; const y = built.outputs.y!
  for (const a of xs) {
    const values = evaluate(built, { a, ...params }), err = values[y]! - f(a)
    loss += err * err / xs.length
    const og = new Float32Array(values.length); og[y] = 2 * err / xs.length
    const grads = circuit.backpropagateReference(values, og)
    for (const n of PARAMS) g[n] += grads[built.inputs[n]!]!
  }
  return { loss, g }
}
// fit chart
const fit = document.querySelector<SVGSVGElement>('#fit')!
const FW = 720, FH = 320, FL = 44, FR = 700, FT = 16, FB = 280
fit.setAttribute('viewBox', `0 0 ${FW} ${FH}`)
const fx = scale([0, 10], [FL, FR]), fy = scale([0, 18], [FB, FT])
axes(h('g', {}, fit), fx, fy, [0, 2, 4, 6, 8, 10], [0, 6, 12, 18], [FL, FR], [FT, FB])
const ghostG = h('g', { class: 'ghosts' }, fit), targetG = h('g', {}, fit)
const curvePath = h('path', { class: 'fit-line' }, fit), errG = h('g', { class: 'errs' }, fit)
const exactPath = h('path', { class: 'exact-line' }, fit)
// loss chart
const lossSvg = document.querySelector<SVGSVGElement>('#loss-chart')!
lossSvg.setAttribute('viewBox', '0 0 720 160')
const lossArea = h('path', { class: 'loss-area' }, lossSvg), lossLine = h('path', { class: 'loss-line' }, lossSvg)
const lossLabel = h('text', { x: 12, y: 22, class: 'tick' }, lossSvg, 'loss (log scale)')

const curveOf = (params: Params): [number, number][] => { const pts: [number, number][] = []; for (let a = 0; a <= 10.001; a += 0.05) pts.push([a, evaluate(built, { a, ...params })[built.outputs.y!]!]); return pts }
exactPath.setAttribute('d', pathOf(curveOf(exact), fx, fy))
function drawTargets() {
  const f = targets[targetSel.value]!; targetG.replaceChildren()
  for (const a of xs) h('circle', { cx: fx(a), cy: fy(f(a)), r: 5, class: 'target-dot' }, targetG)
}
function render() {
  const f = targets[targetSel.value]!
  const d = pathOf(curveOf(p), fx, fy)
  curvePath.setAttribute('d', d)
  ghostG.replaceChildren(); ghosts.forEach((gd, i) => h('path', { d: gd, class: 'ghost', style: `opacity:${(i + 1) / ghosts.length * .35}` }, ghostG))
  errG.replaceChildren()
  for (const a of xs) { const y = evaluate(built, { a, ...p })[built.outputs.y!]!; h('line', { x1: fx(a), x2: fx(a), y1: fy(y), y2: fy(f(a)), class: 'err' }, errG) }
  const { loss } = lossAndGrad(p, f)
  for (const n of PARAMS) {
    $(`#p-${n}`).textContent = fmt(p[n], 2)
    const [lo, hi] = RANGES[n], frac = Math.max(0, Math.min(1, (p[n] - lo) / (hi - lo)))
    $(`#g-${n}`).style.setProperty('--p', String(frac))
    const ex = (exact[n] - lo) / (hi - lo); $(`#g-${n}`).style.setProperty('--e', String(ex))
    const spark = document.querySelector<SVGSVGElement>(`#s-${n}`)!
    const hs = hist[n]; if (hs.length > 1) {
      const sx2 = scale([0, hs.length - 1], [0, 120]), sy2 = scale(RANGES[n], [28, 2])
      spark.replaceChildren(); h('path', { d: pathOf(hs.map((v, i) => [i, v]), sx2, sy2), class: 'spark' }, spark)
    } else spark.replaceChildren()
  }
  $('#loss').textContent = fmt(loss, 3); $('#steps').textContent = String(step)
  if (losses.length > 1) {
    const lx = scale([0, Math.max(step, 50)], [10, 710]), logs = losses.map(([s, l]) => [s, Math.log10(Math.max(l, 1e-4))] as [number, number])
    const ly = scale([Math.min(...logs.map(l => l[1]), -1), Math.max(...logs.map(l => l[1])) + .1], [150, 30])
    const line = pathOf(logs, lx, ly)
    lossLine.setAttribute('d', line); lossArea.setAttribute('d', `${line}L${lx(logs.at(-1)![0])},150L${lx(logs[0]![0])},150Z`)
    lossLabel.textContent = 'loss (log scale)'
  } else { lossLine.setAttribute('d', ''); lossArea.setAttribute('d', ''); lossLabel.textContent = 'loss (log scale) — press Train to watch it fall' }
  void lossLabel
}
function train(n: number) {
  const f = targets[targetSel.value]!, lr = Number(lrIn.value)
  for (let i = 0; i < n; i++) {
    const { loss, g } = lossAndGrad(p, f)
    p = { t: p.t - lr * 0.05 * g.t, k: Math.max(0.05, p.k - lr * 0.05 * g.k), hi: p.hi - lr * g.hi, lo: p.lo - lr * g.lo }
    step++
    if (step % 5 === 0) { losses.push([step, loss]); for (const k of PARAMS) { hist[k].push(p[k]); if (hist[k].length > 200) hist[k].shift() } }
    if (step % 40 === 0) { ghosts.push(pathOf(curveOf(p), fx, fy)); if (ghosts.length > 8) ghosts.shift() }
  }
}
function tick() {
  if (!running) return
  train(prefersReducedMotion() ? 40 : 6); render()
  if (step >= 3000) { setRunning(false); return }
  requestAnimationFrame(tick)
}
function setRunning(r: boolean) { running = r; runBtn.textContent = r ? '❚❚ Pause' : '▶ Train'; runBtn.setAttribute('aria-pressed', String(r)); if (r) requestAnimationFrame(tick) }
const reset = () => { p = { ...exact }; step = 0; losses = []; ghosts = []; for (const k of PARAMS) hist[k] = []; render() }
runBtn.addEventListener('click', () => setRunning(!running))
$('#reset').addEventListener('click', () => { setRunning(false); reset() })
$('#step').addEventListener('click', () => { train(10); render() })
targetSel.addEventListener('change', () => { drawTargets(); losses = []; ghosts = []; step = 0; render() })
drawTargets(); render()
setStatus('Handwired circuit loaded ✓')
