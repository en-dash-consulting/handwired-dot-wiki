import * as M from './model'
import { createScene, TOL, type Scene } from './scene'
import { h, scale, pathOf } from '../lib/svg'
import { prefersReducedMotion } from '../lib/dom'

const N = M.ALL.length
const n0 = (v: number) => v.toLocaleString('en-US')
const pct = (v: number) => `${Math.round(v * 100) / 100}%`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const raf = () => new Promise<number>(r => requestAnimationFrame(r))
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

/** A one-line plain-language trace of what the function just did. */
export function traceHtml(p: M.Params, s: number) {
  const raw = Math.round((p.BASE + p.PER_CM * s) * 100) / 100, hi = s > M.HIGH, out = M.compileJs(p)(s)
  return `shelf <b>${s} cm</b> → ${p.BASE} + ${p.PER_CM} × ${s} = ${raw} → higher than ${M.HIGH}? <b class="${hi ? 'on' : 'off'}">${hi ? `yes, +${p.EXTRA}` : 'no'}</b> → keep it between 0 and ${M.MAX} → <b class="ans">${pct(out)} power</b>`
}
/** The function's source as HTML, with constants as chips and optional live notes on each line. */
function codeHtml(p: M.Params, opts: { shelf?: number, moved?: Partial<Record<M.Knob, boolean>>, live?: boolean } = {}) {
  const lines = esc(M.source(p, opts.live)).split('\n')
  lines[1] = lines[1]!.replace(/(BASE|PER_CM|EXTRA) = (-?[\d.]+)/g, (_, k: M.Knob, v) => `${k} = <span class="k${opts.moved?.[k] ? ' moved' : ''}" data-k="${k}">${v}</span>`)
  if (opts.shelf !== undefined && opts.shelf <= M.HIGH) lines[3] = `<span class="dim">${lines[3]}</span>`
  return lines.join('\n')
}

let audio: AudioContext | null = null, soundOn = false
function blip(kind: 'land' | 'miss' | 'tick') {
  if (!soundOn) return
  audio ??= new AudioContext()
  const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime
  o.type = kind === 'miss' ? 'triangle' : 'sine'
  o.frequency.setValueAtTime(kind === 'land' ? 660 : kind === 'miss' ? 220 : 990, t)
  if (kind === 'land') o.frequency.exponentialRampToValueAtTime(990, t + .12)
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.08, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + (kind === 'tick' ? .04 : .18))
  o.connect(g).connect(audio.destination); o.start(t); o.stop(t + .2)
}

export function mountLesson(root: HTMLElement, opts: { home?: boolean } = {}) {
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector(s) as T
  const reduced = prefersReducedMotion()
  const js = M.compileJs(M.START), truth = M.compileJs(M.HEAVY_CAT)
  const hw = M.buildHandwired(); M.setParams(hw, M.START)
  const state = { step: 1, predictions: {} as Record<string, string>, race: { same: 0, checked: 0, worst: 0 }, landedOld: -1, learn: { steps: 0, landed: 0, done: false, exportSame: -1, params: { ...M.START } }, vs: { done: false, hwSteps: 0, mlpSteps: 0, hwFit: -1, mlpFit: -1, hwBad: 0, mlpBad: 0, hwLand: 0, mlpLand: 0 }, pretrained: 0 }

  // ---------- shared bits ----------
  function bindShelf(id: string, onChange: (cm: number) => void) {
    const input = q<HTMLInputElement>(`[data-shelf="${id}"]`), out = q(`[data-shelf-out="${id}"]`)
    const set = () => { out.textContent = `${input.value} cm`; onChange(Number(input.value)) }
    input.addEventListener('input', set); return { input, set }
  }
  function revealNext(n: number) {
    const b = q<HTMLButtonElement>(`[data-next="${n}"]`); if (!b) return
    b.hidden = false
    if (!b.dataset.bound) { b.dataset.bound = '1'; b.addEventListener('click', () => openStep(n)) }
  }
  function openStep(n: number) {
    const s = q<HTMLElement>(`[data-step="${n}"]`); if (!s) return
    s.hidden = false; state.step = Math.max(state.step, n); q<HTMLButtonElement>(`[data-next="${n}"]`)?.setAttribute('hidden', '')
    s.classList.add('enter'); s.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    s.querySelector<HTMLElement>('h2')?.setAttribute('tabindex', '-1'); s.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
    STEPS[n]?.()
  }
  function predict(id: string, onPick: (v: string) => void) {
    const fs = q(`[data-predict="${id}"]`)
    fs.querySelectorAll<HTMLButtonElement>('.choice').forEach(b => b.addEventListener('click', () => {
      if (state.predictions[id]) return
      state.predictions[id] = b.dataset.v!; fs.querySelectorAll('.choice').forEach(x => x.setAttribute('aria-pressed', String(x === b))); fs.classList.add('picked'); onPick(b.dataset.v!)
    }))
  }
  const verdict = (id: string, right: boolean, text: string) => { const el = q(`[data-predict="${id}"] [data-verdict]`); el.innerHTML = `<b class="${right ? 'yes' : 'no'}">${right ? 'You called it.' : 'Surprise!'}</b> ${text}`; }

  // ---------- step 1: the function ----------
  const scene1 = createScene(q<SVGSVGElement>('[data-scene="1"]')), code1 = q('[data-code="1"]')
  let t1 = 0
  const s1 = bindShelf('1', cm => {
    code1.innerHTML = codeHtml(M.START, { shelf: cm }); q('[data-trace="1"]').innerHTML = traceHtml(M.START, cm); scene1.setShelf(cm); scene1.setPower(js(cm)); scene1.rest()
    clearTimeout(t1); t1 = window.setTimeout(() => void scene1.jump(js(cm), js(cm)).then(o => { blip(o === 'land' ? 'land' : 'miss'); if (!opts.home) revealNext(2) }), 260)
  })
  s1.set()

  if (opts.home) return state
  const soundBtn = q<HTMLButtonElement>('[data-sound]')
  soundBtn.addEventListener('click', () => { soundOn = !soundOn; soundBtn.setAttribute('aria-pressed', String(soundOn)); soundBtn.textContent = soundOn ? 'Sound on' : 'Sound off'; blip('land') })

  // Regular net for step 6: copy the original rule in the background, a slice per frame.
  const mlp = M.buildMlp(); M.initMlp(mlp, 7)
  const pre = new M.Adam(mlp, t => t < 1500 ? 0.02 : 0.004, mlp.cells.map(() => 1)), rnd = M.mulberry(1)
  const pretrain = async () => { await wait(1200); while (pre.t < 2500) { const t0 = performance.now(); while (pre.t < 2500 && performance.now() - t0 < 6) pre.step(Array.from({ length: 64 }, () => { const x = M.ALL[Math.floor(rnd() * N)]!; return { x, y: js(x) } })); await raf() } state.pretrained = 1 }
  void pretrain()

  // ---------- step 2: the same function as a net ----------
  const netSvg = q<SVGSVGElement>('[data-net]'), code2 = q('[data-code="2"]')
  const C = hw.circuit, S = C.sourceSize, W = S + C.operations.length
  const depthOf = (w: number) => w < S ? 0 : C.operations[w - S]!.depth
  const maxD = Math.max(...Array.from({ length: W }, (_, w) => depthOf(w)))
  const cols = new Map<number, number[]>(); for (let w = 0; w < W; w++) { const d = depthOf(w); cols.set(d, [...(cols.get(d) ?? []), w]) }
  const pos: [number, number][] = []
  for (const [d, ws] of cols) ws.forEach((w, i) => {
    const spread = d === 0 ? 52 : 44, wob = d === 0 || d === maxD ? 0 : [-70, 0, 70, 35, -35][d % 5]!
    pos[w] = [70 + d * (400 / maxD), Math.max(24, Math.min(276, 150 + wob + (i - (ws.length - 1) / 2) * spread))]
  })
  const maxAbs = new Float64Array(W)
  for (let s = 0; s <= 100; s += 0.5) { const v = M.evalNet(hw, s); for (let w = 0; w < W; w++) maxAbs[w] = Math.max(maxAbs[w]!, Math.abs(v[w]!)) }
  const edges = h('g', { class: 'n-edges' }, netSvg), nodes = h('g', { class: 'n-nodes' }, netSvg)
  C.operations.forEach((op, i) => { for (const [src] of [...op.leftTerms, ...op.gateTerms]) { const a = pos[src as number]!, b = pos[S + i]!; h('path', { d: `M${a[0]},${a[1]} C${(a[0] + b[0]) / 2},${a[1]} ${(a[0] + b[0]) / 2},${b[1]} ${b[0]},${b[1]}`, class: 'n-edge' }, edges) } })
  const dots: SVGCircleElement[] = []
  for (let w = 0; w < W; w++) {
    const [x, y] = pos[w]!, g = h('g', { class: 'n-node', style: `--d:${depthOf(w)}` }, nodes)
    dots[w] = h('circle', { cx: x, cy: y, r: w < S || w === hw.out ? 9 : 6, class: w < S ? 'src' : 'op' }, g)
    const label = w < S ? hw.labels.get(w) : w === hw.out ? 'answer' : undefined
    if (label) h('text', { x: w < S ? x - 14 : x + 14, y: y + 4, 'text-anchor': w < S ? 'end' : 'start', class: 'n-label' }, g, label)
  }
  function lightNet(cm: number) {
    const v = M.evalNet(hw, cm)
    for (let w = 0; w < W; w++) dots[w]!.style.setProperty('--a', (maxAbs[w]! ? Math.min(1, Math.abs(v[w]!) / maxAbs[w]!) : 0).toFixed(3))
    const a = js(cm), b = v[hw.out]!
    q('[data-ans="js"]').textContent = pct(a); q('[data-ans="hw"]').textContent = pct(b)
    const eq = q('[data-eq]'); eq.textContent = a === b ? '=' : '≠'; eq.dataset.same = String(a === b)
    return a === b
  }
  const s2 = bindShelf('2', cm => { code2.innerHTML = codeHtml(M.START, { shelf: cm }); lightNet(cm) })
  predict('2', v => {
    q('[data-reveal="2"]').hidden = false; netSvg.classList.add('morph')
    s2.set(); requestAnimationFrame(() => requestAnimationFrame(() => netSvg.classList.add('in')))
    const same = lightNet(Number(s2.input.value))
    verdict('2', v === 'exact' && same, `For this shelf they agree to the last digit: ${q('[data-ans="hw"]').textContent}. Drag the shelf to keep checking.`)
    revealNext(3)
  })

  // ---------- step 3: race ----------
  const tiles = q<HTMLCanvasElement>('[data-tiles]'), tctx = tiles.getContext('2d')!
  predict('3', async v => {
    q('[data-reveal="3"]').hidden = false
    const colsN = 100, size = 8, raceEl = q('[data-race]')
    tiles.width = colsN * size; tiles.height = Math.ceil(N / colsN) * size
    tctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--board-3').trim() || '#ebe5db'; tctx.fillRect(0, 0, tiles.width, tiles.height)
    const per = reduced ? N : 48; state.race = { same: 0, checked: 0, worst: 0 }
    for (let i = 0; i < N;) {
      const end = Math.min(N, i + per)
      for (; i < end; i++) {
        const x = M.ALL[i]!, a = js(x), b = M.outOf(hw, x), ok = a === b
        if (ok) state.race.same++; state.race.worst = Math.max(state.race.worst, Math.abs(a - b)); state.race.checked++
        tctx.fillStyle = ok ? '#2c6a43' : '#b42318'; tctx.fillRect((i % colsN) * size + 1, Math.floor(i / colsN) * size + 1, size - 2, size - 2)
      }
      raceEl.textContent = n0(state.race.same); if (i % 480 < per) blip('tick')
      if (i < N) await raf()
    }
    const bad = N - state.race.same
    q('[data-race-note]').textContent = `Biggest difference anywhere: ${state.race.worst}. Not "close": the same numbers.`
    verdict('3', (v === '0') === (bad === 0), `${n0(bad)} of ${n0(N)} disagreed.`)
    revealNext(4)
  })

  // ---------- step 4: the world changes ----------
  const scene4 = createScene(q<SVGSVGElement>('[data-scene="4"]'))
  async function playJumps(sc: Scene, power: (x: number) => number, onLand: (landed: number) => void, fast = false) {
    let landed = 0
    for (const x of M.TEST_SHELVES) {
      sc.setShelf(x); const o = await sc.jump(power(x), truth(x)); if (o === 'land') landed++; blip(o === 'land' ? 'land' : 'miss'); onLand(landed)
      await wait(reduced ? 120 : fast ? 60 : 160)
    }
    return landed
  }
  q('[data-feed]').addEventListener('click', async e => {
    const b = e.currentTarget as HTMLButtonElement; b.disabled = true; b.textContent = 'Fed. Here come 12 test jumps'
    q('[data-reveal="4"]').hidden = false; scene4.setHeavy(true)
    const el = q('[data-tally4]')
    state.landedOld = await playJumps(scene4, js, n => { el.textContent = String(n) })
    revealNext(5)
  }, { once: true })

  // ---------- step 5: learn ----------
  const scene5 = createScene(q<SVGSVGElement>('[data-scene="5"]')); scene5.setHeavy(true)
  const code5 = q('[data-code="5"]'); code5.innerHTML = codeHtml(M.START, { live: true })
  const data = M.TEST_SHELVES.map(x => ({ x, y: truth(x) }))
  const countLanded = (f: (x: number) => number) => M.TEST_SHELVES.filter(x => Math.abs(f(x) - truth(x)) <= TOL).length
  q('[data-learn]').addEventListener('click', async e => {
    const b = e.currentTarget as HTMLButtonElement; b.disabled = true; b.textContent = 'Learning…'
    q('[data-reveal="5"]').hidden = false
    const opt = new M.Adam(hw, 0.3, M.KNOBS.map(k => M.SCALE[k]), M.KNOBS.map(k => M.RANGES[k]))
    const tally = q('[data-tally5]'), nudges = q('[data-nudges]')
    let jumpI = 0, jumping = false, err = 1
    while (err > 0.01 && opt.t < 1500) {
      for (let i = 0; i < (reduced ? 20 : 2); i++) err = opt.step(data)
      const p = M.getParams(hw); state.learn.params = p; state.learn.steps = opt.t
      code5.innerHTML = codeHtml(p, { live: true, moved: { BASE: true, PER_CM: true, EXTRA: true } })
      state.learn.landed = countLanded(x => M.outOf(hw, x)); tally.textContent = String(state.learn.landed)
      nudges.textContent = `${n0(opt.t)} nudges · off by ${Math.round(err * 100) / 100}% on average`
      if (!jumping && !reduced) { jumping = true; const x = M.TEST_SHELVES[jumpI++ % M.TEST_SHELVES.length]!; scene5.setShelf(x); void scene5.jump(M.outOf(hw, x), truth(x)).then(o => { if (o === 'land') blip('land'); jumping = false }) }
      await raf()
    }
    b.textContent = 'Learned'
    // Read it: rounded constants, re-checked against the network.
    const r = M.roundParams(M.getParams(hw)); M.setParams(hw, r); state.learn.params = r
    const exported = M.compileJs(r); let same = 0; for (const x of M.ALL) if (exported(x) === M.outOf(hw, x)) same++
    state.learn.exportSame = same; state.learn.landed = countLanded(x => M.outOf(hw, x)); tally.textContent = String(state.learn.landed)
    code5.innerHTML = codeHtml(r, { moved: { BASE: r.BASE !== M.START.BASE, PER_CM: r.PER_CM !== M.START.PER_CM, EXTRA: r.EXTRA !== M.START.EXTRA } })
    const L = q('[data-learned]'); L.hidden = false
    L.innerHTML = `<h3>What it learned, in plain words</h3><ul>${M.KNOBS.map(k => `<li><code>${k}</code> ${M.START[k]} → <b>${r[k]}</b>${r[k] === M.START[k] ? ' (unchanged)' : ''}</li>`).join('')}</ul>
      <p>So the heavier cat needs ${r.BASE - M.START.BASE >= 0 ? `${r.BASE - M.START.BASE}% more` : `${M.START.BASE - r.BASE}% less`} power to get going and ${r.PER_CM}% per cm instead of ${M.START.PER_CM}%. The learned network <em>is</em> this code: pasted back as JavaScript, it gives the same answer on <b>${n0(same)} of ${n0(N)}</b> shelves.</p>`
    if (!reduced) await playJumps(scene5, x => M.outOf(hw, x), n => { tally.textContent = String(n) }, true)
    state.learn.done = true; revealNext(6)
  }, { once: true })

  // ---------- step 6: the foil ----------
  const minis = { hw: q<SVGSVGElement>('[data-mini="hw"]'), mlp: q<SVGSVGElement>('[data-mini="mlp"]') }
  const sx = scale([0, 100], [28, 292]), sy = scale([-10, 125], [158, 8])
  const XS = Array.from({ length: 201 }, (_, i) => i / 2)
  function drawMini(svg: SVGSVGElement, f: (x: number) => number) {
    svg.replaceChildren()
    h('rect', { x: 28, y: sy(125), width: 264, height: sy(100) - sy(125), class: 'nogo' }, svg); h('rect', { x: 28, y: sy(0), width: 264, height: sy(-10) - sy(0), class: 'nogo' }, svg)
    h('text', { x: 290, y: sy(100) - 4, 'text-anchor': 'end', class: 'nogo-t' }, svg, 'over 100%: impossible')
    h('text', { x: 4, y: sy(100) + 4, class: 'sc-tick' }, svg, '100'); h('text', { x: 10, y: sy(0) + 4, class: 'sc-tick' }, svg, '0')
    h('text', { x: 160, y: 168, 'text-anchor': 'middle', class: 'sc-tick' }, svg, 'shelf height, 0 to 100 cm')
    const ys = XS.map(f)
    h('path', { d: pathOf(XS.map((x, i) => [x, Math.max(-10, Math.min(125, ys[i]!))]), sx, sy), class: 'mini-ln' }, svg)
    for (const [i, x] of XS.entries()) { const y = ys[i]!; if (y > M.MAX + 0.01 || y < -0.01) h('circle', { cx: sx(x), cy: sy(Math.max(-10, Math.min(125, y))), r: 2.5, class: 'bad-dot' }, svg) }
    for (const d of data) h('circle', { cx: sx(d.x), cy: sy(d.y), r: 4, class: 'pt' }, svg)
  }
  const landsAll = (n: M.Net) => { let c = 0; for (const x of M.ALL) if (Math.abs(M.outOf(n, x) - truth(x)) <= TOL) c++; return c }
  const impossible = (n: M.Net) => { let c = 0; for (const x of M.ALL) { const y = M.outOf(n, x); if (y < -0.01 || y > M.MAX + 0.01) c++ } return c }
  const heat = q('[data-m="mlp-heat"]'); heat.innerHTML = mlp.cells.map(() => '<i></i>').join('')
  const paintHeat = () => mlp.cells.forEach((c, i) => { const v = mlp.src[c]!, el = heat.children[i] as HTMLElement; el.style.setProperty('--m', Math.tanh(Math.abs(v) / 3).toFixed(3)); el.dataset.sign = v < 0 ? '-' : '+'; el.title = v.toFixed(3) })
  q('[data-race6]').addEventListener('click', async e => {
    const b = e.currentTarget as HTMLButtonElement; b.disabled = true
    while (!state.pretrained) { b.textContent = `Getting the regular net ready… ${n0(pre.t)} / 2,500`; await raf() }
    b.textContent = 'Training both…'; q('[data-reveal="6"]').hidden = false
    const hw2 = M.buildHandwired(); M.setParams(hw2, M.START)
    const o1 = new M.Adam(hw2, 0.3, M.KNOBS.map(k => M.SCALE[k]), M.KNOBS.map(k => M.RANGES[k])), o2 = new M.Adam(mlp, 0.01, mlp.cells.map(() => 1))
    // Same stopping rule for both: until off by under 0.01% on the 12 jumps, or 3,000 nudges.
    const v = state.vs; let frame = 0, d1 = false, d2 = false
    while (!d1 || !d2) {
      for (let i = 0; i < (reduced ? 40 : 8); i++) {
        if (!d1) { const e1 = o1.step(data); if (e1 < 0.5 && v.hwFit < 0) v.hwFit = o1.t; d1 = e1 < 0.01 || o1.t >= 3000 }
        if (!d2) { const e2 = o2.step(data); if (e2 < 0.5 && v.mlpFit < 0) v.mlpFit = o2.t; d2 = e2 < 0.01 || o2.t >= 3000 }
      }
      v.hwSteps = o1.t; v.mlpSteps = o2.t
      if (frame++ % 6 === 0) { v.hwBad = impossible(hw2); v.mlpBad = impossible(mlp); v.hwLand = landsAll(hw2); v.mlpLand = landsAll(mlp); q('[data-m="hw-miss"]').textContent = n0(N - v.hwLand); q('[data-m="mlp-miss"]').textContent = n0(N - v.mlpLand); drawMini(minis.hw, x => M.outOf(hw2, x)); drawMini(minis.mlp, x => M.outOf(mlp, x)); paintHeat() }
      q('[data-m="hw-steps"]').textContent = n0(v.hwSteps); q('[data-m="mlp-steps"]').textContent = n0(v.mlpSteps)
      q('[data-m="hw-bad"]').textContent = n0(v.hwBad); q('[data-m="mlp-bad"]').textContent = n0(v.mlpBad)
      await raf()
    }
    v.hwBad = impossible(hw2); v.mlpBad = impossible(mlp); v.hwLand = landsAll(hw2); v.mlpLand = landsAll(mlp); drawMini(minis.hw, x => M.outOf(hw2, x)); drawMini(minis.mlp, x => M.outOf(mlp, x)); paintHeat()
    q('[data-m="hw-bad"]').textContent = n0(v.hwBad); q('[data-m="mlp-bad"]').textContent = n0(v.mlpBad)
    q('[data-m="hw-miss"]').textContent = n0(N - v.hwLand); q('[data-m="mlp-miss"]').textContent = n0(N - v.mlpLand)
    q('[data-m="hw-code"]').innerHTML = codeHtml(M.roundParams(M.getParams(hw2)))
    q('[data-m="mlp-miss"]').closest('.metric')!.classList.toggle('alarm', v.mlpLand < N)
    b.textContent = 'Trained'; v.done = true; revealNext(7)
  }, { once: true })

  const STEPS: Record<number, () => void> = {}
  // Deep link (#step-2 from the home page): open everything up to that step.
  const m = location.hash.match(/^#step-(\d)$/)
  if (m) { const n = Number(m[1]); for (let i = 2; i <= Math.min(n, 2); i++) openStep(i) }
  return state
}
