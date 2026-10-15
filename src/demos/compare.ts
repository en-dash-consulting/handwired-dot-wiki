import '../lib/site'
import { buildCompare, evaluate, stats, type Built } from '../lib/programs'
import type { Relation } from '../lib/hw'
import { $, fmt, setStatus } from '../lib/dom'

const aIn = $<HTMLInputElement>('#a'), bIn = $<HTMLInputElement>('#b')
const relIn = $<HTMLSelectElement>('#relation'), gridIn = $<HTMLInputElement>('#grid')
const cache = new Map<string, Built>()
const get = (rel: Relation, grid: boolean) => {
  const key = rel + grid
  let b = cache.get(key); if (!b) { b = buildCompare(rel, grid); cache.set(key, b) }
  return b
}
const jsCompare = (a: number, rel: Relation, b: number) =>
  rel === '>' ? a > b : rel === '>=' ? a >= b : rel === '<' ? a < b : rel === '<=' ? a <= b : a === b

function read() {
  const grid = gridIn.checked
  const step = grid ? '1' : 'any'
  aIn.step = step; bIn.step = step
  let a = Number(aIn.value), b = Number(bIn.value)
  if (grid) { a = Math.round(a); b = Math.round(b) }
  a = Math.min(1024, Math.max(0, Math.fround(a))); b = Math.min(1024, Math.max(0, Math.fround(b)))
  return { a, b, rel: relIn.value as Relation, grid }
}
function render() {
  const { a, b, rel, grid } = read()
  const built = get(rel, grid)
  const v = evaluate(built, { a, b })
  const o = built.outputs
  const bit = v[o.bit!]!, jsBit = jsCompare(a, rel, b) ? 1 : 0
  $('#out-bit').textContent = fmt(bit)
  $('#out-js-bit').textContent = String(jsBit)
  $('#out-picked').textContent = fmt(v[o.picked!]!)
  $('#out-min').textContent = fmt(v[o.min!]!)
  $('#out-js-min').textContent = fmt(Math.min(a, b))
  $('#out-agree').textContent = bit === jsBit && v[o.min!] === Math.min(a, b) ? 'Matches plain JS ✓' : 'Mismatch ✗'
  const s = stats(built.circuit)
  $('#out-stats').textContent = `${s.operations} operations, ${s.layers} layers · rounding points: ${Object.entries(s.roundingPoints).map(([k, n]) => `${n} ${k}`).join(', ') || 'none'}`
}
function fuzz() {
  const { rel, grid } = read()
  const built = get(rel, grid)
  let bad = 0
  const N = 5000
  for (let i = 0; i < N; i++) {
    let a = Math.random() * 1024, b = Math.random() < 0.2 ? a : Math.random() * 1024
    if (grid) { a = Math.round(a); b = Math.round(b) }
    a = Math.fround(a); b = Math.fround(b)
    const v = evaluate(built, { a, b })
    if (v[built.outputs.bit!] !== (jsCompare(a, rel, b) ? 1 : 0) || v[built.outputs.min!] !== Math.min(a, b)) bad++
  }
  $('#out-fuzz').textContent = `${N.toLocaleString()} random pairs (20% equal): ${bad} mismatches`
}
for (const el of [aIn, bIn, relIn, gridIn]) el.addEventListener('input', render)
$('#fuzz').addEventListener('click', fuzz)
render()
setStatus('Handwired circuit loaded ✓')
