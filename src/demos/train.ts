import '../lib/site'
import { buildTrainable, evaluate, type Built } from '../lib/programs'
import { $, fmt, setStatus } from '../lib/dom'
import { plot } from '../lib/plot'

const built: Built = buildTrainable()
const { circuit } = built
const PARAMS = ['t', 'k', 'hi', 'lo'] as const
type Params = Record<(typeof PARAMS)[number], number>
const exact: Params = { t: 4, k: 1, hi: 10, lo: 12 }
const targets: Record<string, (a: number) => number> = {
  'a > 6 ? 3 : 15': a => a > 6 ? 3 : 15,
  'ramp from 2 up to 14 between a = 3 and 7': a => 2 + 12 * Math.min(1, Math.max(0, (a - 3) / 4)),
  'a > 2 ? 11 : 5': a => a > 2 ? 11 : 5,
}
const xs = Array.from({ length: 21 }, (_, i) => i * 0.5)
let p: Params = { ...exact }, step = 0, running = false, losses: [number, number][] = []
const targetSel = $<HTMLSelectElement>('#target'), lrIn = $<HTMLInputElement>('#lr')
const runBtn = $<HTMLButtonElement>('#run')

function lossAndGrad(params: Params, f: (a: number) => number) {
  const g: Params = { t: 0, k: 0, hi: 0, lo: 0 }
  let loss = 0
  const y = built.outputs.y!
  for (const a of xs) {
    const values = evaluate(built, { a, ...params })
    const err = values[y]! - f(a)
    loss += err * err / xs.length
    const og = new Float32Array(values.length); og[y] = 2 * err / xs.length
    const grads = circuit.backpropagateReference(values, og)
    for (const name of PARAMS) g[name] += grads[built.inputs[name]!]!
  }
  return { loss, g }
}
function render() {
  const f = targets[targetSel.value]!
  const curve: [number, number][] = []
  for (let a = 0; a <= 10; a += 0.05) curve.push([a, evaluate(built, { a, ...p })[built.outputs.y!]!])
  plot(document.querySelector<SVGSVGElement>('#fit')!, [
    { points: xs.map(a => [a, f(a)]), className: 'series-js', kind: 'dots' },
    { points: curve, className: 'series-net' },
  ], [0, 10], [0, 18])
  const { loss } = lossAndGrad(p, f)
  for (const name of PARAMS) $(`#p-${name}`).textContent = fmt(p[name], 3)
  $('#loss').textContent = fmt(loss, 4)
  $('#steps').textContent = String(step)
  if (losses.length > 1) {
    const maxL = Math.max(...losses.map(l => l[1]), 1e-6)
    plot(document.querySelector<SVGSVGElement>('#loss-chart')!, [{ points: losses, className: 'series-net' }], [0, Math.max(step, 1)], [0, maxL])
  } else document.querySelector('#loss-chart')!.replaceChildren()
}
function tick() {
  if (!running) return
  const f = targets[targetSel.value]!, lr = Number(lrIn.value)
  for (let i = 0; i < 10; i++) {
    const { loss, g } = lossAndGrad(p, f)
    // Plain gradient descent with per-parameter scale (t and k move slower than outputs).
    p = { t: p.t - lr * 0.05 * g.t, k: Math.max(0.05, p.k - lr * 0.05 * g.k), hi: p.hi - lr * g.hi, lo: p.lo - lr * g.lo }
    step++
    if (step % 5 === 0) losses.push([step, loss])
  }
  render()
  if (step >= 3000) { setRunning(false); return }
  requestAnimationFrame(tick)
}
function setRunning(r: boolean) { running = r; runBtn.textContent = r ? 'Pause' : 'Train'; runBtn.setAttribute('aria-pressed', String(r)); if (r) requestAnimationFrame(tick) }
runBtn.addEventListener('click', () => setRunning(!running))
$('#reset').addEventListener('click', () => { p = { ...exact }; step = 0; losses = []; setRunning(false); render() })
$('#step').addEventListener('click', () => { running = true; tick(); running = false; render() })
targetSel.addEventListener('change', () => { losses = []; step = 0; render() })
render()
setStatus('Handwired circuit loaded ✓')
