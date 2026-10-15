import '../lib/site'
import { buildSoftSwitch, evaluate, stats } from '../lib/programs'
import { $, fmt, setStatus } from '../lib/dom'
import { plot } from '../lib/plot'

const built = buildSoftSwitch()
const range = $<HTMLInputElement>('#a-range'), num = $<HTMLInputElement>('#a-num')
const hiIn = $<HTMLInputElement>('#hi'), loIn = $<HTMLInputElement>('#lo')
const svg = document.querySelector<SVGSVGElement>('#plot')!
const s = stats(built.circuit)
$('#op-count').textContent = `${s.operations} operations in ${s.layers} layers`

function render(a: number) {
  const hi = Number(hiIn.value), lo = Number(loIn.value)
  const v = evaluate(built, { a, hi, lo })
  const o = built.outputs
  $('#out-r1').textContent = fmt(v[o.r1!]!)
  $('#out-r2').textContent = fmt(v[o.r2!]!)
  $('#out-above4').textContent = fmt(v[o.above4!]!)
  $('#out-result').textContent = fmt(v[o.result!]!)
  const js = a > 4 ? hi : lo
  $('#out-js').textContent = fmt(js)
  const exact = Number.isInteger(a)
  const agree = Math.fround(js) === v[o.result!]
  $('#out-agree').textContent = agree ? 'Matches plain JS ✓' : exact ? 'Mismatch ✗' : 'Blends (a is not an integer, so the README\'s integer assumption does not hold)'
  const pts: [number, number][] = []
  for (let x = -2; x <= 10; x += 0.05) pts.push([x, evaluate(built, { a: x, hi, lo })[o.result!]!])
  const jsPts: [number, number][] = []
  for (let x = -2; x <= 10; x += 1) jsPts.push([x, x > 4 ? hi : lo])
  const ys = [hi, lo, 0]
  plot(svg, [{ points: pts, className: 'series-net' }, { points: jsPts, className: 'series-js', kind: 'dots' }], [-2, 10], [Math.min(...ys) - 1, Math.max(...ys) + 1], a)
}
const sync = (src: HTMLInputElement) => { const a = Number(src.value); range.value = String(a); num.value = String(a); render(a) }
range.addEventListener('input', () => sync(range))
num.addEventListener('input', () => sync(num))
hiIn.addEventListener('input', () => render(Number(range.value)))
loIn.addEventListener('input', () => render(Number(range.value)))
render(Number(range.value))
setStatus('Handwired circuit loaded ✓')
