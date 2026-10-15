import '../lib/site'
import { buildSoftSwitch, buildCompare, buildClamp, stats, type Built } from '../lib/programs'
import { $, fmt, setStatus } from '../lib/dom'

const programs: Record<string, { label: string, js: string, build: () => Built }> = {
  'soft-switch': { label: 'a > 4 ? hi : lo', js: 'const result = a > 4 ? hi : lo', build: buildSoftSwitch },
  'compare-grid': { label: 'a >= b (integer grid)', js: 'const bit = a >= b  // a, b whole numbers in 0..1024', build: () => buildCompare('>=', true) },
  'compare-nogrid': { label: 'a >= b (no grid)', js: 'const bit = a >= b  // a, b any FP32 in 0..1024', build: () => buildCompare('>=', false) },
  clamp: { label: 'clamp(x, lo, hi)', js: 'const clamped = Math.min(Math.max(x, lo), hi)', build: buildClamp },
}
const NS = 'http://www.w3.org/2000/svg'
const select = $<HTMLSelectElement>('#program')

function render() {
  const p = programs[select.value]!
  const built = p.build()
  const { circuit } = built
  const names = new Map<number, string>()
  for (const [k, w] of Object.entries(built.inputs)) names.set(w, k)
  for (const [k, w] of Object.entries(built.outputs)) names.set(w, k)
  const name = (w: number) => names.get(w) ?? `w${w}`
  const term = (t: readonly (readonly [number, number])[], bias: number) => {
    const parts = t.map(([w, c]) => c === 1 ? name(w) : c === -1 ? `−${name(w)}` : `${fmt(c)}·${name(w)}`)
    if (bias !== 0 || parts.length === 0) parts.push(fmt(bias))
    return parts.join(' + ').replace(/\+ −/g, '− ').replace(/\+ -/g, '− ')
  }
  $('#js-code').textContent = p.js
  const s = stats(circuit)
  $('#graph-stats').textContent = `${circuit.sourceSize} source cells → ${s.operations} operations in ${s.layers} layers`
  // operations list
  const list = $('#ops')
  list.replaceChildren()
  circuit.operations.forEach((op, i) => {
    const w = circuit.sourceSize + i
    let f: string
    if (op.kind === 'affine') f = term(op.gateTerms.length ? op.gateTerms : op.leftTerms, op.gateTerms.length ? op.gateBias : op.leftBias)
    else if (op.kind === 'reglu') f = `(${term(op.leftTerms, op.leftBias)}) × relu(${term(op.gateTerms, op.gateBias)})`
    else if (op.kind === 'boolean') f = `round01(${term(op.gateTerms.length ? op.gateTerms : op.leftTerms, op.gateTerms.length ? op.gateBias : op.leftBias)})`
    else f = `table[${term(op.gateTerms, op.gateBias)}]`
    const li = document.createElement('li')
    li.innerHTML = `<code></code> <span class="tag"></span>`
    li.querySelector('code')!.textContent = `${name(w)} = ${f}`
    li.querySelector('.tag')!.textContent = `${op.kind} · layer ${op.depth}${op.roundingPoint ? ' · ' + op.roundingPoint : ''}`
    list.appendChild(li)
  })
  // layered svg
  const byDepth = new Map<number, number[]>()
  const depthOf = (w: number) => w < circuit.sourceSize ? 0 : circuit.operations[w - circuit.sourceSize]!.depth
  for (let w = 0; w < circuit.sourceSize + circuit.operations.length; w++) {
    const d = depthOf(w); if (!byDepth.has(d)) byDepth.set(d, []); byDepth.get(d)!.push(w)
  }
  const cols = Math.max(...byDepth.keys()) + 1
  const rows = Math.max(...[...byDepth.values()].map(v => v.length))
  const CW = 130, RH = 46, W = cols * CW + 40, H = rows * RH + 40
  const pos = new Map<number, [number, number]>()
  for (const [d, ws] of byDepth) ws.forEach((w, i) => pos.set(w, [30 + d * CW, 30 + i * RH + (rows - ws.length) * RH / 2]))
  const svg = document.querySelector<SVGSVGElement>('#graph')!
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
  svg.setAttribute('width', String(W)); svg.setAttribute('height', String(H))
  svg.replaceChildren()
  const el = (tag: string, a: Record<string, string | number>, text?: string) => {
    const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, String(v))
    if (text) e.textContent = text; svg.appendChild(e); return e
  }
  circuit.operations.forEach((op, i) => {
    const w = circuit.sourceSize + i, [x2, y2] = pos.get(w)!
    for (const [src, c] of [...op.leftTerms, ...op.gateTerms]) {
      const [x1, y1] = pos.get(src)!
      el('path', { d: `M${x1 + 90},${y1 + 14} C${x1 + 110},${y1 + 14} ${x2 - 20},${y2 + 14} ${x2},${y2 + 14}`, class: c < 0 ? 'edge neg' : 'edge' })
    }
  })
  for (const [w, [x, y]] of pos) {
    const isSrc = w < circuit.sourceSize, isOut = Object.values(built.outputs).includes(w as never)
    const kind = isSrc ? 'cell' : circuit.operations[w - circuit.sourceSize]!.kind
    el('rect', { x, y, width: 90, height: 28, rx: 6, class: `node ${isSrc ? 'src' : kind}${isOut ? ' out' : ''}` })
    el('text', { x: x + 45, y: y + 18, 'text-anchor': 'middle', class: 'node-label' }, isSrc ? name(w) : `${name(w)} ${kind}`)
  }
  $('#graph-desc').textContent = `Layered graph of ${programs[select.value]!.label}: ${circuit.sourceSize} input cells on the left, operations grouped by layer to the right. The same operations are listed as text below.`
}
select.addEventListener('change', render)
render()
setStatus('Handwired circuit loaded ✓')
