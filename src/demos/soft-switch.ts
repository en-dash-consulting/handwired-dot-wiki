import '../lib/site'
import { buildSoftSwitch, evaluate, stats } from '../lib/programs'
import { $, fmt, setStatus } from '../lib/dom'
import { h, scale, pathOf, svgX, axes } from '../lib/svg'

const built = buildSoftSwitch(), o = built.outputs
const slider = $<HTMLInputElement>('#a-range'), blendBox = $<HTMLInputElement>('#blend')
const hiIn = $<HTMLInputElement>('#hi'), loIn = $<HTMLInputElement>('#lo')
const plotSvg = document.querySelector<SVGSVGElement>('#plot')!
const circuit = document.querySelector<SVGSVGElement>('#circuit')!
const s = stats(built.circuit)
$('#op-count').textContent = `${s.operations} operations · ${s.layers} layers · 0 training`

const W = 720, H = 340, L = 48, R = 700, T = 20, B = 300
const sx = scale([-1, 9], [L, R]), sy = scale([-0.25, 2.25], [B, T])
plotSvg.setAttribute('viewBox', `0 0 ${W} ${H}`)
const base = h('g', {}, plotSvg)
axes(base, sx, sy, [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 1, 2], [L, R], [T, B])
const curve = (f: (a: number) => number, cls: string) => {
  const pts: [number, number][] = []
  for (let a = -1; a <= 9.001; a += 0.025) pts.push([a, Math.min(2.4, f(a))])
  h('path', { d: pathOf(pts, sx, sy), class: cls }, base)
}
const at = (a: number) => evaluate(built, { a, hi: 10, lo: 12 })
curve(a => at(a)[o.r1!]!, 'c-r1'); curve(a => at(a)[o.r2!]!, 'c-r2'); curve(a => at(a)[o.above4!]!, 'c-ab')
const blendZone = h('rect', { x: sx(4), y: T, width: sx(5) - sx(4), height: B - T, class: 'blend-zone' }, base)
h('text', { x: sx(4.5), y: T + 16, 'text-anchor': 'middle', class: 'zone-label' }, base, 'in-between')
for (let i = -1; i <= 9; i++) h('circle', { cx: sx(i), cy: sy(at(i)[o.above4!]!), r: 3.5, class: 'int-dot' }, base)
const marker = h('line', { y1: T, y2: B, class: 'marker' }, plotSvg)
const dots = { r1: h('circle', { r: 6, class: 'dot d-r1' }, plotSvg), r2: h('circle', { r: 6, class: 'dot d-r2' }, plotSvg) }
const handle = h('g', { class: 'handle' }, plotSvg)
h('circle', { r: 20, class: 'handle-halo' }, handle); h('circle', { r: 11, class: 'handle-core' }, handle)
const handleLabel = h('text', { y: -26, 'text-anchor': 'middle', class: 'handle-label' }, handle)

const q = (sel: string) => circuit.querySelector(sel)
function lightCircuit(v: Float32Array, a: number) {
  const vals: Record<string, number> = { a, r1: v[o.r1!]!, r2: v[o.r2!]!, ab: v[o.above4!]!, hi: Number(hiIn.value), lo: Number(loIn.value), out: v[o.result!]! }
  for (const [id, val] of Object.entries(vals)) { const t = q(`[data-v="${id}"]`); if (t) t.textContent = fmt(val, 2) }
  const act: Record<string, number> = { a: 1, r1: Math.min(1, vals.r1!), r2: Math.min(1, vals.r2!), ab: vals.ab!, hi: vals.ab!, lo: 1 - vals.ab!, out: 1 }
  for (const [id, x] of Object.entries(act)) { const n = q(`[data-n="${id}"]`) as SVGGElement | null; n?.classList.toggle('lit', x > 0); n?.style.setProperty('--act', String(x)) }
  const hot: Record<string, boolean> = { 'a-r1': vals.r1! > 0, 'a-r2': vals.r2! > 0, 'r1-ab': vals.r1! > 0, 'r2-ab': vals.r2! > 0, 'ab-out': vals.ab! > 0, 'hi-out': vals.ab! > 0, 'lo-out': vals.ab! < 1 }
  for (const [id, on] of Object.entries(hot)) { q(`[data-w="${id}"]`)?.classList.toggle('hot', on); q(`[data-f="${id}"]`)?.classList.toggle('hot', on) }
}

function render() {
  const blend = blendBox.checked
  slider.step = blend ? '0.05' : '1'
  let a = Number(slider.value)
  if (!blend) { a = Math.round(a); slider.value = String(a) }
  const hi = Number(hiIn.value), lo = Number(loIn.value)
  const v = evaluate(built, { a, hi, lo })
  const ab = v[o.above4!]!, res = v[o.result!]!, js = a > 4 ? hi : lo
  // plot
  const px = sx(a), py = sy(ab)
  marker.setAttribute('x1', String(px)); marker.setAttribute('x2', String(px))
  dots.r1.setAttribute('cx', String(px)); dots.r1.setAttribute('cy', String(sy(Math.min(2.4, v[o.r1!]!))))
  dots.r2.setAttribute('cx', String(px)); dots.r2.setAttribute('cy', String(sy(Math.min(2.4, v[o.r2!]!))))
  handle.setAttribute('transform', `translate(${px},${py})`)
  handleLabel.textContent = `a = ${fmt(a, 2)}`
  blendZone.classList.toggle('show', blend)
  lightCircuit(v, a)
  // code
  $('#a-val').textContent = fmt(a, 2); $('#a-out').textContent = fmt(a, 2)
  $('#code-hi').textContent = String(hi); $('#code-lo').textContent = String(lo)
  $('#code-hi').style.setProperty('--w', String(ab)); $('#code-lo').style.setProperty('--w', String(1 - ab))
  $('#code-hi').classList.toggle('active', ab === 1); $('#code-lo').classList.toggle('active', ab === 0)
  $('#out-result').textContent = fmt(res, 3)
  $('#out-js').textContent = fmt(js)
  const verdict = $('#verdict')
  const exact = Math.fround(js) === res
  verdict.className = 'verdict ' + (exact ? 'exact' : 'blend')
  if (exact) {
    $('#verdict-title').textContent = 'Exact match'
    $('#verdict-body').textContent = `Circuit ${fmt(res)} = JS ${fmt(js)}. relu(a − 4) − relu(a − 5) is exactly ${fmt(ab)} here, so the select passes ${ab === 1 ? 'the on branch' : 'the off branch'} through untouched.`
  } else {
    const pct = Math.round(ab * 100)
    $('#verdict-title').textContent = 'In-between, on purpose'
    $('#verdict-body').textContent = `above4 = ${fmt(ab, 2)}, so the circuit outputs ${pct}% × ${hi} + ${100 - pct}% × ${lo} = ${fmt(res, 2)}. JavaScript has no in-between: it jumps from ${lo} to ${hi}. This smooth slope between 4 and 5 is what makes the program differentiable. At whole numbers, where Handwired's guarantees apply, the two agree exactly.`
  }
}

let dragging = false
const fromPointer = (e: PointerEvent) => {
  const a = Math.max(-1, Math.min(9, sx.invert(svgX(plotSvg, e))))
  slider.value = String(blendBox.checked ? Math.round(a * 20) / 20 : Math.round(a)); render()
}
plotSvg.addEventListener('pointerdown', e => { dragging = true; plotSvg.setPointerCapture(e.pointerId); fromPointer(e) })
plotSvg.addEventListener('pointermove', e => { if (dragging) fromPointer(e) })
plotSvg.addEventListener('pointerup', () => { dragging = false })
for (const el of [slider, blendBox, hiIn, loIn]) el.addEventListener('input', render)
circuit.classList.add('wired')
render()
setStatus('Handwired circuit loaded ✓')
