import '../lib/site'
import { buildCompare, evaluate, stats, type Built } from '../lib/programs'
import type { Relation } from '../lib/hw'
import { $, fmt, setStatus } from '../lib/dom'
import { h, scale, svgX } from '../lib/svg'

const aIn = $<HTMLInputElement>('#a'), bIn = $<HTMLInputElement>('#b')
const relIn = $<HTMLSelectElement>('#relation'), gridIn = $<HTMLInputElement>('#grid')
const cache = new Map<string, Built>()
const get = (rel: Relation, grid: boolean) => { const k = rel + grid; let b = cache.get(k); if (!b) { b = buildCompare(rel, grid); cache.set(k, b) } return b }
const jsCompare = (a: number, rel: Relation, b: number) => rel === '>' ? a > b : rel === '>=' ? a >= b : rel === '<' ? a < b : rel === '<=' ? a <= b : a === b
const f32 = new Float32Array(1), i32 = new Int32Array(f32.buffer)
const nextUlp = (x: number, dir: 1 | -1) => { f32[0] = x; if (x === 0) { return dir > 0 ? 1.401298464324817e-45 : 0 } i32[0]! += dir; return f32[0]! }

// number line
const line = document.querySelector<SVGSVGElement>('#line')!
const W = 720, L = 30, R = 690, Y = 70
line.setAttribute('viewBox', `0 0 ${W} 120`)
const sx = scale([0, 1024], [L, R])
h('line', { x1: L, x2: R, y1: Y, y2: Y, class: 'track' }, line)
for (let t = 0; t <= 1024; t += 128) { h('line', { x1: sx(t), x2: sx(t), y1: Y - 6, y2: Y + 6, class: 'tickmark' }, line); h('text', { x: sx(t), y: Y + 28, 'text-anchor': 'middle', class: 'tick' }, line, String(t)) }
const span = h('line', { y1: Y, y2: Y, class: 'span' }, line)
const pin = (cls: string, label: string) => { const g = h('g', { class: `pin ${cls}` }, line); h('line', { x1: 0, x2: 0, y1: -30, y2: 0, class: 'stem' }, g); h('circle', { r: 10, cy: 0, class: 'pad' }, g); h('text', { y: -38, 'text-anchor': 'middle', class: 'pin-label' }, g, label); return g }
const pa = pin('pa', 'a'), pb = pin('pb', 'b')

function read() {
  const grid = gridIn.checked
  aIn.step = grid ? '1' : 'any'; bIn.step = grid ? '1' : 'any'
  let a = Number(aIn.value), b = Number(bIn.value)
  if (grid) { a = Math.round(a); b = Math.round(b) }
  a = Math.min(1024, Math.max(0, Math.fround(a))); b = Math.min(1024, Math.max(0, Math.fround(b)))
  return { a, b, rel: relIn.value as Relation, grid }
}
function render() {
  const { a, b, rel, grid } = read()
  const built = get(rel, grid), v = evaluate(built, { a, b }), o = built.outputs
  const bit = v[o.bit!]!, js = jsCompare(a, rel, b) ? 1 : 0
  pa.setAttribute('transform', `translate(${sx(a)},${Y})`); pb.setAttribute('transform', `translate(${sx(b)},${Y})`)
  span.setAttribute('x1', String(sx(Math.min(a, b)))); span.setAttribute('x2', String(sx(Math.max(a, b))))
  $('#lamp').classList.toggle('on', bit === 1)
  $('#lamp-val').textContent = String(bit)
  $('#expr').textContent = `${fmt(a, 7)} ${rel} ${fmt(b, 7)}`
  $('#out-js-bit').textContent = js ? 'true' : 'false'
  $('#out-picked').textContent = fmt(v[o.picked!]!, 7)
  $('#out-min').textContent = fmt(v[o.min!]!, 7)
  const exact = bit === js && v[o.min!] === Math.min(a, b)
  $('#verdict').className = 'verdict ' + (exact ? 'exact' : 'blend')
  $('#verdict-title').textContent = exact ? 'Exact match' : 'Outside the contract'
  $('#verdict-body').textContent = exact ? `emitCompare's bit = JavaScript's ${js ? 'true' : 'false'}; emitMinimumExact returns ${fmt(Math.min(a, b), 7)} exactly.` : 'These inputs fall outside the declared range or grid.'
  // cost meter
  const g = stats(get(rel, true).circuit), n = stats(get(rel, false).circuit), max = Math.max(g.operations, n.operations)
  $('#bar-grid').style.setProperty('--p', String(g.operations / max)); $('#bar-nogrid').style.setProperty('--p', String(n.operations / max))
  $('#cost-grid').textContent = `${g.operations} ops · ${g.layers} layers`; $('#cost-nogrid').textContent = `${n.operations} ops · ${n.layers} layers`
  $('#row-grid').classList.toggle('current', grid); $('#row-nogrid').classList.toggle('current', !grid)
  for (const btn of document.querySelectorAll<HTMLButtonElement>('.ulp')) btn.disabled = grid
}
// drag pins on the line
let drag: 'a' | 'b' | null = null
line.addEventListener('pointerdown', e => {
  const x = sx.invert(svgX(line, e)); const { a, b } = read()
  drag = Math.abs(x - a) <= Math.abs(x - b) ? 'a' : 'b'; line.setPointerCapture(e.pointerId); move(e)
})
const move = (e: PointerEvent) => { if (!drag) return; const x = Math.max(0, Math.min(1024, Math.round(sx.invert(svgX(line, e))))); (drag === 'a' ? aIn : bIn).value = String(x); render() }
line.addEventListener('pointermove', move)
line.addEventListener('pointerup', () => { drag = null })
for (const btn of document.querySelectorAll<HTMLButtonElement>('.ulp')) btn.addEventListener('click', () => {
  const { a } = read(); aIn.value = String(nextUlp(a, btn.dataset.dir === '1' ? 1 : -1)); render()
})
// fuzz with an animated grid
const cells = $('#fuzz-grid')
for (let i = 0; i < 200; i++) cells.appendChild(document.createElement('span'))
$('#fuzz').addEventListener('click', () => {
  const { rel, grid } = read(), built = get(rel, grid), N = 5000, per = N / 200
  let i = 0, bad = 0
  const kids = [...cells.children] as HTMLElement[]
  kids.forEach(k => k.className = '')
  const btn = $<HTMLButtonElement>('#fuzz'); btn.disabled = true
  const chunk = () => {
    for (let c = 0; c < 10 && i < 200; c++, i++) {
      let cellBad = false
      for (let j = 0; j < per; j++) {
        let a = Math.random() * 1024, b = Math.random() < 0.2 ? a : Math.random() * 1024
        if (grid) { a = Math.round(a); b = Math.round(b) }
        a = Math.fround(a); b = Math.fround(b)
        const v = evaluate(built, { a, b })
        if (v[built.outputs.bit!] !== (jsCompare(a, rel, b) ? 1 : 0) || v[built.outputs.min!] !== Math.min(a, b)) { bad++; cellBad = true }
      }
      kids[i]!.className = cellBad ? 'bad' : 'ok'
    }
    $('#out-fuzz').textContent = `${Math.round(i * per).toLocaleString()} pairs tested · ${bad} mismatches`
    if (i < 200) requestAnimationFrame(chunk)
    else { $('#out-fuzz').textContent = `${N.toLocaleString()} random pairs (20% equal): ${bad} mismatches`; btn.disabled = false }
  }
  chunk()
})
for (const el of [aIn, bIn, relIn, gridIn]) el.addEventListener('input', render)
render()
setStatus('Handwired circuit loaded ✓')
