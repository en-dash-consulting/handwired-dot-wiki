import '../lib/site'
import { buildSoftSwitch, buildCompare, buildClamp, evaluate, stats, type Built } from '../lib/programs'
import { $, fmt, setStatus } from '../lib/dom'
import { h } from '../lib/svg'

type Input = { name: string, min: number, max: number, value: number }
const programs: Record<string, { js: string, build: () => Built, inputs: Input[] }> = {
  'soft-switch': { js: 'const result = a > 4 ? hi : lo', build: buildSoftSwitch, inputs: [{ name: 'a', min: 0, max: 9, value: 5 }, { name: 'hi', min: 0, max: 20, value: 10 }, { name: 'lo', min: 0, max: 20, value: 12 }] },
  'compare-grid': { js: 'const bit = a >= b   // whole numbers in 0..1024', build: () => buildCompare('>=', true), inputs: [{ name: 'a', min: 0, max: 1024, value: 614 }, { name: 'b', min: 0, max: 1024, value: 600 }] },
  'compare-nogrid': { js: 'const bit = a >= b   // any FP32 in 0..1024', build: () => buildCompare('>=', false), inputs: [{ name: 'a', min: 0, max: 1024, value: 614 }, { name: 'b', min: 0, max: 1024, value: 600 }] },
  clamp: { js: 'const clamped = Math.min(Math.max(x, lo), hi)', build: buildClamp, inputs: [{ name: 'x', min: 0, max: 256, value: 200 }, { name: 'lo', min: 0, max: 256, value: 32 }, { name: 'hi', min: 0, max: 256, value: 160 }] },
}
const select = $<HTMLSelectElement>('#program')
const inputsBox = $('#graph-inputs'), inspector = $('#inspector')
let current: { built: Built, formula: string[], name: (w: number) => string, values: Record<string, number> }

function build() {
  const p = programs[select.value]!, built = p.build(), { circuit } = built
  const names = new Map<number, string>()
  for (const [k, w] of Object.entries(built.inputs)) names.set(w, k)
  for (const [k, w] of Object.entries(built.outputs)) names.set(w, k)
  const name = (w: number) => names.get(w) ?? `w${w}`
  const term = (t: readonly (readonly [number, number])[], bias: number) => {
    const parts = t.map(([w, c]) => c === 1 ? name(w) : c === -1 ? `−${name(w)}` : `${fmt(c)}·${name(w)}`)
    if (bias !== 0 || parts.length === 0) parts.push(fmt(bias))
    return parts.join(' + ').replace(/\+ −/g, '− ').replace(/\+ -/g, '− ')
  }
  const formula = circuit.operations.map(op => {
    const g = op.gateTerms.length ? [op.gateTerms, op.gateBias] as const : [op.leftTerms, op.leftBias] as const
    return op.kind === 'affine' ? term(...g) : op.kind === 'reglu' ? `(${term(op.leftTerms, op.leftBias)}) × relu(${term(op.gateTerms, op.gateBias)})` : op.kind === 'boolean' ? `round01(${term(...g)})` : `table[${term(op.gateTerms, op.gateBias)}]`
  })
  $('#js-code').textContent = p.js
  const st = stats(circuit)
  $('#graph-stats').textContent = `${circuit.sourceSize} input cells → ${st.operations} operations in ${st.layers} layers`
  // inputs
  inputsBox.replaceChildren()
  const values: Record<string, number> = {}
  for (const inp of p.inputs) {
    values[inp.name] = inp.value
    const wrap = document.createElement('div'); wrap.className = 'knob'
    wrap.innerHTML = `<label for="in-${inp.name}"></label><input type="range" id="in-${inp.name}" min="${inp.min}" max="${inp.max}" step="1" value="${inp.value}"><output for="in-${inp.name}"></output>`
    wrap.querySelector('label')!.textContent = inp.name
    const range = wrap.querySelector('input')!, out = wrap.querySelector('output')!
    out.textContent = String(inp.value)
    range.addEventListener('input', () => { values[inp.name] = Number(range.value); out.textContent = range.value; paint() })
    inputsBox.appendChild(wrap)
  }
  current = { built, formula, name, values }
  // layout
  const depthOf = (w: number) => w < circuit.sourceSize ? 0 : circuit.operations[w - circuit.sourceSize]!.depth
  const byDepth = new Map<number, number[]>()
  for (let w = 0; w < circuit.sourceSize + circuit.operations.length; w++) { const d = depthOf(w); if (!byDepth.has(d)) byDepth.set(d, []); byDepth.get(d)!.push(w) }
  const cols = Math.max(...byDepth.keys()) + 1, rows = Math.max(...[...byDepth.values()].map(v => v.length))
  const CW = 150, RH = 64, W = cols * CW + 40, H = rows * RH + 40
  const pos = new Map<number, [number, number]>()
  for (const [d, ws] of byDepth) ws.forEach((w, i) => pos.set(w, [30 + d * CW, 30 + i * RH + (rows - ws.length) * RH / 2]))
  const svg = document.querySelector<SVGSVGElement>('#graph')!
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', String(W)); svg.setAttribute('height', String(H))
  svg.replaceChildren()
  const edges = h('g', {}, svg), nodes = h('g', {}, svg)
  circuit.operations.forEach((op, i) => {
    const w = circuit.sourceSize + i, [x2, y2] = pos.get(w)!
    for (const [src, c] of [...op.leftTerms, ...op.gateTerms]) {
      const [x1, y1] = pos.get(src)!
      const d = `M${x1 + 104},${y1 + 18} C${x1 + 130},${y1 + 18} ${x2 - 26},${y2 + 18} ${x2},${y2 + 18}`
      h('path', { d, class: c < 0 ? 'edge neg' : 'edge', 'data-src': src, 'data-dst': w }, edges)
      h('path', { d, class: 'edge-flow', 'data-src': src, 'data-dst': w }, edges)
    }
  })
  const outs = new Set<number>(Object.values(built.outputs))
  for (const [w, [x, y]] of pos) {
    const isSrc = w < circuit.sourceSize, kind = isSrc ? 'cell' : circuit.operations[w - circuit.sourceSize]!.kind
    const g = h('g', { class: `gnode ${isSrc ? 'src' : kind}${outs.has(w) ? ' out' : ''}`, 'data-w': w, tabindex: 0, role: 'img' }, nodes)
    h('rect', { x, y, width: 104, height: 36, rx: 9, class: 'node' }, g)
    h('text', { x: x + 52, y: y + 15, 'text-anchor': 'middle', class: 'node-label' }, g, isSrc ? name(w) : `${name(w)} · ${kind}`)
    h('text', { x: x + 52, y: y + 30, 'text-anchor': 'middle', class: 'node-val' }, g, '')
    const show = () => inspect(w)
    g.addEventListener('pointerenter', show); g.addEventListener('focus', show)
  }
  // list
  const list = $('#ops'); list.replaceChildren()
  circuit.operations.forEach((op, i) => {
    const li = document.createElement('li'); const w = circuit.sourceSize + i
    li.innerHTML = '<code></code> <span class="tag"></span>'
    li.querySelector('code')!.textContent = `${name(w)} = ${formula[i]}`
    li.querySelector('.tag')!.textContent = `${op.kind} · layer ${op.depth}${op.roundingPoint ? ' · ' + op.roundingPoint : ''}`
    list.appendChild(li)
  })
  paint(); inspect(circuit.sourceSize + circuit.operations.length - 1)
}
let lastValues: Float32Array<ArrayBufferLike> = new Float32Array(0)
function paint() {
  const { built, values, name } = current
  const v = evaluate(built, values); lastValues = v
  const svg = document.querySelector<SVGSVGElement>('#graph')!
  for (const g of svg.querySelectorAll<SVGGElement>('.gnode')) {
    const w = Number(g.dataset.w), val = v[w]!
    g.querySelector('.node-val')!.textContent = `= ${fmt(val, 3)}`
    g.classList.toggle('lit', val !== 0)
    g.setAttribute('aria-label', `${name(w)} = ${fmt(val, 4)}`)
  }
  for (const p of svg.querySelectorAll<SVGPathElement>('.edge-flow')) p.classList.toggle('hot', v[Number(p.dataset.src)] !== 0)
  for (const p of svg.querySelectorAll<SVGPathElement>('.edge')) p.classList.toggle('hot', v[Number(p.dataset.src)] !== 0)
  const outName = Object.keys(built.outputs)[0]!
  $('#graph-result').textContent = Object.entries(built.outputs).map(([k, w]) => `${k} = ${fmt(v[w]!, 4)}`).join('  ·  ')
  void outName
}
function inspect(w: number) {
  const { built, formula, name } = current, c = built.circuit
  const svg = document.querySelector<SVGSVGElement>('#graph')!
  for (const g of svg.querySelectorAll('.gnode')) g.classList.toggle('sel', Number((g as SVGGElement).dataset.w) === w)
  for (const p of svg.querySelectorAll<SVGPathElement>('.edge')) p.classList.toggle('sel', Number(p.dataset.dst) === w)
  const isSrc = w < c.sourceSize
  inspector.innerHTML = '<p class="insp-name"></p><p class="insp-formula"></p><p class="insp-val"></p>'
  inspector.querySelector('.insp-name')!.textContent = isSrc ? `${name(w)} — input cell` : `${name(w)} — ${c.operations[w - c.sourceSize]!.kind}, layer ${c.operations[w - c.sourceSize]!.depth}`
  inspector.querySelector('.insp-formula')!.textContent = isSrc ? 'written by the host before each evaluation' : `${name(w)} = ${formula[w - c.sourceSize]}`
  inspector.querySelector('.insp-val')!.textContent = `value: ${fmt(lastValues[w] ?? 0, 6)}`
}
select.addEventListener('change', build)
build()
setStatus('Handwired circuit loaded ✓')
