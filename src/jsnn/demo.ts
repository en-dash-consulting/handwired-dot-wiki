import * as M from './model'
import { h, scale, pathOf } from '../lib/svg'
import { prefersReducedMotion } from '../lib/dom'

const N = M.ALL_KG.length
const fmtN = (n: number) => n.toLocaleString('en-US')
const usd = (c: number) => (c < 0 ? '−$' : '$') + (Math.abs(c) / 100).toFixed(2)
const NEW: M.Params = { BASE: -300, PER_KG: 150, SURCHARGE: 1500 }
const INVOICE_KG = [0.5, 1.5, 4, 8, 13, 19, 25, 29, 31, 33, 38, 55, 80]
const PRETRAIN = 2500, MLP_SEED = 7, BATCH_SEED = 1, FIT = 50 // RMSE below 50¢ counts as fitted
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

export type JsnnState = ReturnType<typeof mountJsnn>
export function mountJsnn(root: HTMLElement) {
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector(s) as T
  const col = (c: string) => q(`.col.${c}`)
  const stat = (c: string, k: string) => col(c).querySelector<HTMLElement>(`[data-st="${k}"] [data-v]`)!
  const say = q('[data-say]'), diffEl = q('[data-diff]')
  const reduced = prefersReducedMotion()

  const js = M.compileJs(M.START)
  const hw = M.buildHandwired(); let hwP: M.Params = { ...M.START }; M.setParams(hw, hwP)
  const mlp = M.buildMlp(); M.initMlp(mlp, MLP_SEED)
  const st = {
    beat: 1, pretrained: 0, hwExact: -1, mlpExact: -1, mlpMaxErr: 0, checked: 0,
    invoices: [] as { kg: number, cents: number }[], training: false,
    hwSteps: 0, mlpSteps: 0, hwFitAt: -1, mlpFitAt: -1, hwErr: 0, mlpErr: 0, jsErr: 0,
    viol: { js: 0, hw: 0, mlp: 0 }, exportMatch: -1,
  }
  const hwOpt = new M.Adam(hw, 0.3, M.KNOBS.map(k => M.SCALE[k]), M.KNOBS.map(k => M.RANGES[k]))
  const preOpt = new M.Adam(mlp, (t: number) => t < 1500 ? 0.02 : 0.004, mlp.cells.map(() => 1))
  let mlpOpt: M.Adam | null = null, retrain = false
  const rand = M.mulberry(BATCH_SEED)
  const hwOut = (kg: number) => M.evalNet(hw, kg)[hw.out]!
  const mlpOut = (kg: number) => M.evalNet(mlp, kg)[mlp.out]!

  // ---------- code panes ----------
  const jsCode = q('[data-js]'), hwCode = q('[data-hw]')
  jsCode.textContent = M.source(M.START)
  function renderHwCode() {
    let s = esc(M.source(hwP))
    for (const k of M.KNOBS) s = s.replace(new RegExp(`(\\b${k} = )(\\S+?)(,|$)`, 'm'), (_, a, b, c2) => `${a}<span class="w${hwP[k] !== M.START[k] ? ' moved' : ''}">${b}</span>${c2}`)
    s = s.replace(/^(const HEAVY = )(\d+)(, CAP = )(\d+)$/m, '$1<span class="w lock">$2</span>$3<span class="w lock">$4</span>')
    hwCode.innerHTML = s
  }
  const knobs = q('[data-knobs]')
  knobs.innerHTML = [...M.KNOBS.map(k => `<li data-k="${k}"><span class="kn">${k}</span><span class="bar"><i></i></span><span class="kv"></span></li>`),
    `<li class="frozen"><span class="kn">HEAVY · CAP</span><span class="kv">frozen: the hard rules</span></li>`].join('')
  function renderKnobs() {
    for (const k of M.KNOBS) {
      const li = knobs.querySelector<HTMLElement>(`[data-k="${k}"]`)!, [a, b] = M.RANGES[k]
      li.querySelector<HTMLElement>('i')!.style.setProperty('--p', String((hwP[k] - a) / (b - a)))
      li.querySelector('.kv')!.textContent = M.fmtC(Math.round(hwP[k] * 100) / 100)
      li.classList.toggle('live', st.training)
    }
  }
  // ---------- generic-net weight heatmap ----------
  const wEl = q('[data-weights]')
  wEl.innerHTML = mlp.cells.map(() => '<i></i>').join('')
  const wCells = [...wEl.children] as HTMLElement[]
  function renderWeights() {
    mlp.cells.forEach((c, i) => { const v = mlp.src[c]!, m = Math.tanh(Math.abs(v) / 3); wCells[i]!.style.setProperty('--m', m.toFixed(3)); wCells[i]!.dataset.sign = v < 0 ? '-' : '+'; wCells[i]!.title = v.toFixed(3) })
  }

  // ---------- chart ----------
  const svg = q<SVGSVGElement>('[data-chart]')
  const W = 720, H = 300, L = 46, R = 12, T = 14, B = 34
  const sx = scale([0, M.MAX_KG], [L, W - R]), sy = scale([-500, 7000], [H - B, T])
  const g = h('g', {}, svg)
  for (let y = 0; y <= 7000; y += 1000) { h('line', { x1: L, x2: W - R, y1: sy(y), y2: sy(y), class: 'gridl' }, g); h('text', { x: L - 6, y: sy(y) + 4, class: 'tick', 'text-anchor': 'end' }, g, `$${y / 100}`) }
  for (let x = 0; x <= 100; x += 20) h('text', { x: sx(x), y: H - B + 18, class: 'tick', 'text-anchor': 'middle' }, g, `${x} kg`)
  h('rect', { x: L, y: sy(7000), width: W - R - L, height: sy(M.CAP) - sy(7000), class: 'nogo' }, g)
  h('rect', { x: L, y: sy(0), width: W - R - L, height: sy(-500) - sy(0), class: 'nogo' }, g)
  h('line', { x1: L, x2: W - R, y1: sy(M.CAP), y2: sy(M.CAP), class: 'rule' }, g)
  h('line', { x1: L, x2: W - R, y1: sy(0), y2: sy(0), class: 'rule' }, g)
  h('text', { x: W - R - 4, y: sy(M.CAP) - 6, class: 'rule-t', 'text-anchor': 'end' }, g, 'CAP $60: never above')
  h('text', { x: W - R - 4, y: sy(0) + 14, class: 'rule-t', 'text-anchor': 'end' }, g, 'never below $0')
  const pJs = h('path', { class: 'ln js' }, svg), pHw = h('path', { class: 'ln hw' }, svg), pMlp = h('path', { class: 'ln mlp' }, svg), pBad = h('path', { class: 'ln bad' }, svg)
  const invG = h('g', { class: 'invs' }, svg)
  const XS = Array.from({ length: 401 }, (_, i) => i / 4)
  const clampY = (v: number) => Math.max(-500, Math.min(7000, v))
  function renderChart() {
    pJs.setAttribute('d', pathOf(XS.map(x => [x, js(x)]), sx, sy))
    pHw.setAttribute('d', pathOf(XS.map(x => [x, hwOut(x)]), sx, sy))
    const ys = XS.map(x => mlpOut(x))
    pMlp.setAttribute('d', pathOf(XS.map((x, i) => [x, clampY(ys[i]!)]), sx, sy))
    let bad = ''; XS.forEach((x, i) => { const y = ys[i]!; if (y > M.CAP + 1 || y < -1) bad += `M${sx(x).toFixed(1)},${sy(clampY(y)).toFixed(1)}h0.1` })
    pBad.setAttribute('d', bad)
    pMlp.style.opacity = st.pretrained ? '1' : '0'; pBad.style.opacity = pMlp.style.opacity
    for (const [i, el] of invEls.entries()) { const d = st.invoices[i]!; el.setAttribute('cx', String(sx(d.kg))); el.setAttribute('cy', String(sy(d.cents))); el.setAttribute('aria-valuenow', String(d.cents / 100)); el.setAttribute('aria-valuetext', `${d.kg} kg invoice: ${usd(d.cents)}`) }
  }
  let invEls: SVGCircleElement[] = []
  function placeInvoices() {
    invG.replaceChildren(); invEls = st.invoices.map((d) => {
      const c = h('circle', { r: 9, class: 'inv', tabindex: 0, role: 'slider', 'aria-label': `Invoice for a ${d.kg} kg parcel`, 'aria-valuemin': -5, 'aria-valuemax': 70, 'aria-orientation': 'vertical' }, invG)
      c.addEventListener('keydown', e => { const k = (e as KeyboardEvent).key, s = (e as KeyboardEvent).shiftKey ? 500 : 100; if (k === 'ArrowUp' || k === 'ArrowRight') nudge(d, s); else if (k === 'ArrowDown' || k === 'ArrowLeft') nudge(d, -s); else return; e.preventDefault() })
      c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); c.classList.add('drag') })
      c.addEventListener('pointermove', e => { if (!c.hasPointerCapture(e.pointerId)) return; const r = svg.getBoundingClientRect(), y = (e.clientY - r.top) * (H / r.height); d.cents = Math.round(Math.max(-400, Math.min(6900, sy.invert(y))) / 10) * 10; changed() })
      c.addEventListener('pointerup', () => c.classList.remove('drag'))
      return c
    })
  }
  function nudge(d: { cents: number }, by: number) { d.cents = Math.max(-400, Math.min(6900, d.cents + by)); changed() }
  function changed() { if (st.training) return void (retrain = true, st.hwFitAt = -1, st.mlpFitAt = -1, measureErr()); st.hwFitAt = -1; st.mlpFitAt = -1; measureErr(); renderAll(); if (mlpOpt && !st.training) startTraining() }

  // ---------- measurements ----------
  const rmse = (f: (kg: number) => number) => Math.sqrt(st.invoices.reduce((s, d) => s + (f(d.kg) - d.cents) ** 2, 0) / Math.max(1, st.invoices.length))
  function measureErr() { st.jsErr = rmse(js); st.hwErr = rmse(hwOut); st.mlpErr = rmse(mlpOut) }
  function measureViolations() {
    let v1 = 0, v2 = 0, v3 = 0
    for (const kg of M.ALL_KG) { const a = js(kg), b = hwOut(kg), c = mlpOut(kg); if (a < -1 || a > M.CAP + 1) v1++; if (b < -1 || b > M.CAP + 1) v2++; if (c < -1 || c > M.CAP + 1) v3++ }
    st.viol = { js: v1, hw: v2, mlp: v3 }
  }

  // ---------- stats ----------
  function renderStats() {
    const ex = (c: string, txt: string, good: boolean | null) => { const e = stat(c, 'exact'); e.textContent = txt; e.dataset.good = good === null ? '' : String(good) }
    ex('js', 'it is the rule', null)
    ex('hw', st.hwExact < 0 ? '…' : `${fmtN(st.checked >= N ? st.hwExact : st.hwExact)} / ${fmtN(st.checked)}`, st.checked > 0 && st.hwExact === st.checked)
    ex('mlp', !st.pretrained ? `training… step ${fmtN(preOpt.t)}` : st.mlpExact < 0 ? '…' : `${fmtN(st.mlpExact)} / ${fmtN(st.checked)} · worst ${usd(st.mlpMaxErr)} off`, st.mlpExact >= 0 ? st.mlpExact === st.checked : null)
    const er = (c: string, v: number) => { const e = stat(c, 'err'); e.textContent = st.invoices.length ? `${usd(v)} avg (RMS)` : 'no invoices yet'; e.dataset.good = st.invoices.length ? String(v < FIT) : ''; e.style.setProperty('--e', String(Math.min(1, v / 1500))) }
    er('js', st.jsErr); er('hw', st.hwErr); er('mlp', st.mlpErr)
    for (const c of ['js', 'hw', 'mlp'] as const) { const e = stat(c, 'viol'); e.textContent = st.pretrained || c !== 'mlp' ? `${fmtN(st.viol[c])} of ${fmtN(N)} prices` : '…'; e.dataset.good = String(st.viol[c] === 0) }
    stat('js', 'steps').textContent = "can't train: no gradients"
    stat('hw', 'steps').textContent = st.hwSteps ? `${fmtN(st.hwSteps)}${st.hwFitAt >= 0 ? ` · fit at ${fmtN(st.hwFitAt)}` : ''}` : '0 (born exact)'
    stat('mlp', 'steps').textContent = `${fmtN(st.pretrained ? PRETRAIN : preOpt.t)} to copy the rule${st.mlpSteps ? ` + ${fmtN(st.mlpSteps)}${st.mlpFitAt >= 0 ? ` · fit at ${fmtN(st.mlpFitAt)}` : ''}` : ''}`
    q('[data-hwsub]').textContent = st.training || st.hwSteps ? 'unfrozen: training its constants' : 'frozen: weights are the constants'
  }
  function renderAll() { renderHwCode(); renderKnobs(); renderWeights(); renderStats(); renderChart() }

  // ---------- beat 1: exactness ----------
  function runExact() {
    st.checked = 0; st.hwExact = 0; st.mlpExact = st.pretrained ? 0 : -1; st.mlpMaxErr = 0
    const per = reduced ? N : 160
    const tick = () => {
      const end = Math.min(N, st.checked + per)
      for (let i = st.checked; i < end; i++) {
        const kg = M.ALL_KG[i]!, a = js(kg), b = hwOut(kg); if (a === b) st.hwExact++
        if (st.pretrained) { const c = mlpOut(kg); if (c === a) st.mlpExact++; st.mlpMaxErr = Math.max(st.mlpMaxErr, Math.abs(c - a)) }
      }
      st.checked = end; renderStats()
      if (end < N) requestAnimationFrame(tick)
      else { root.dataset.exact = 'done'; say.textContent = `Plain JS and the Handwired net gave the same answer for all ${fmtN(N)} parcel weights, bit for bit. The generic net matched ${fmtN(st.mlpExact)} and was up to ${usd(st.mlpMaxErr)} off.` }
    }
    requestAnimationFrame(tick)
  }
  function pretrainLoop() {
    const t0 = performance.now()
    while (preOpt.t < PRETRAIN && performance.now() - t0 < 12) {
      const batch = Array.from({ length: 64 }, () => { const kg = M.ALL_KG[Math.floor(rand() * N)]!; return { kg, cents: js(kg) } })
      preOpt.step(batch)
    }
    if (preOpt.t % 5 === 0 || preOpt.t >= PRETRAIN) { renderWeights(); renderStats(); renderChart() }
    if (preOpt.t < PRETRAIN) { requestAnimationFrame(pretrainLoop); return }
    st.pretrained = 1; measureViolations(); renderAll(); if (st.beat === 1) runExact()
  }

  // ---------- beat 2: change the world ----------
  function changeWorld() {
    const truth = M.compileJs(NEW)
    if (!st.invoices.length) { st.invoices = INVOICE_KG.map(kg => ({ kg, cents: truth(kg) })); placeInvoices() }
    measureErr(); renderAll()
    say.innerHTML = `The carrier's new prices are in: ${st.invoices.length} invoices. Plain JS is now ${usd(st.jsErr)} off on average, and it can't learn. <button type="button" class="button go" data-train>Unfreeze &amp; train both nets</button>`
    say.querySelector('[data-train]')!.addEventListener('click', startTraining)
  }
  function startTraining() {
    if (!st.pretrained) return
    mlpOpt ??= new M.Adam(mlp, 0.01, mlp.cells.map(() => 1))
    st.training = true; root.dataset.training = 'on'; let frame = 0, hwDone = false; const hwStart = st.hwSteps
    const loop = () => {
      if (retrain) { retrain = false; hwDone = false }
      for (let i = 0; i < 3; i++) {
        if (!hwDone) { const e = hwOpt.step(st.invoices); st.hwSteps++; if (e < FIT && st.hwFitAt < 0) st.hwFitAt = st.hwSteps; if (e < 0.1 || st.hwSteps >= hwStart + 1500) hwDone = true }
        if (st.mlpFitAt < 0 && st.mlpSteps < 4000) { const e = mlpOpt!.step(st.invoices); st.mlpSteps++; if (e < FIT) st.mlpFitAt = st.mlpSteps }
      }
      M.KNOBS.forEach((k, i) => { hwP[k] = hw.src[hw.cells[i]!]! })
      measureErr(); if (++frame % 12 === 0) measureViolations()
      renderAll()
      const done = hwDone && (st.mlpFitAt >= 0 || st.mlpSteps >= 4000)
      if (!done) { requestAnimationFrame(loop); return }
      st.training = false; root.dataset.training = 'done'; measureViolations(); renderAll()
      say.textContent = `Handwired net: ${st.hwFitAt >= 0 ? `fit in ${fmtN(st.hwFitAt)} steps` : `${usd(st.hwErr)} off after ${fmtN(st.hwSteps)} steps (this rule can't express that shape)`}, ${fmtN(st.viol.hw)} broken rules. Generic net: ${st.mlpFitAt >= 0 ? `fit in ${fmtN(st.mlpFitAt)} steps` : `${usd(st.mlpErr)} off after ${fmtN(st.mlpSteps)} steps`}, ${fmtN(st.viol.mlp)} prices below $0 or above $60. Drag an invoice to retrain, or go to step 3.`
    }
    requestAnimationFrame(loop)
  }

  // ---------- beat 3: read it ----------
  function readIt() {
    if (!st.hwSteps) { say.textContent = 'Do step 2 first: there is nothing learned to read yet.'; return }
    const rounded = Object.fromEntries(M.KNOBS.map(k => [k, Math.round(hwP[k])])) as M.Params
    const exported = M.compileJs(rounded); M.setParams(hw, rounded); hwP = rounded
    let match = 0; for (const kg of M.ALL_KG) if (exported(kg) === hwOut(kg)) match++
    st.exportMatch = match; measureErr(); measureViolations(); renderAll()
    const lines = M.KNOBS.map(k => rounded[k] === M.START[k] ? `<span class="same">  const ${k} = ${M.START[k]}</span>` : `<span class="del">- const ${k} = ${M.START[k]}</span>\n<span class="add">+ const ${k} = ${rounded[k]}</span>`).join('\n')
    diffEl.hidden = false
    diffEl.innerHTML = `<div class="diff-hw"><h3>What the Handwired net learned, as JS</h3><pre tabindex="0"><code>${lines}\n<span class="same">  const HEAVY = ${M.HEAVY}, CAP = ${M.CAP}   // frozen</span></code></pre>
      <p class="ok" data-export>Exported JS vs the net with these constants: <b>${fmtN(match)} / ${fmtN(N)}</b> identical answers.</p></div>
      <div class="diff-mlp"><h3>What the generic net learned</h3><p>${mlp.cells.length} numbers. Which one is the heavy-parcel surcharge?</p><pre tabindex="0" class="mlp-dump"><code>${mlp.cells.map(c => mlp.src[c]!.toFixed(3)).join('  ')}</code></pre></div>`
    say.textContent = `The Handwired net's learned weights are the constants of your program, so you can paste them back as code. The exported JS matches the net on ${fmtN(match)} of ${fmtN(N)} weights.`
  }

  // ---------- beats ----------
  const beatBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-beat]')]
  for (const b of beatBtns) b.addEventListener('click', () => {
    st.beat = Number(b.dataset.beat); root.dataset.beat = String(st.beat)
    beatBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)))
    if (st.beat === 1) { if (st.pretrained) runExact() } else if (st.beat === 2) changeWorld(); else readIt()
  })
  root.dataset.beat = '1'
  say.textContent = `Checking all ${fmtN(N)} parcel weights… The generic net is still learning to copy the rule.`
  measureViolations(); renderAll()
  // Plain JS and the Handwired net need no training, so their check starts right away.
  ;(() => { st.checked = 0; st.hwExact = 0; for (let i = 0; i < N; i++) { const kg = M.ALL_KG[i]!; if (js(kg) === hwOut(kg)) st.hwExact++ } st.checked = N; renderStats() })()
  requestAnimationFrame(pretrainLoop)
  return st
}
