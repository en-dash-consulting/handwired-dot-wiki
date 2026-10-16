import { $, prefersReducedMotion } from '../lib/dom'
import { getW, setW } from './common'
import * as L from './layout'

const CARDS = [3, 1, 0, 2, 0, 1, 3, 0, 2, 1]
const NAMES = ['Hero story', 'Update', 'Note', 'Feature', 'Tip', 'Event', 'Big launch', 'Link', 'Guide', 'Poll']
export function mountLayout(root: HTMLElement) {
  const net = L.buildLayout(), toK = (v: ArrayLike<number>): L.K => ({ BASE: v[0]!, PER_LEVEL: v[1]!, SHARE: v[2]! })
  setW(net, [L.START.BASE, L.START.PER_LEVEL, L.START.SHARE])
  let drags: L.Drag[] = [], mlp: ReturnType<typeof L.mlpLayout> | null = null, busy = false, v = 1280, touched = false
  const screen = $('#ly-screen', root), frame = $('#ly-frame', root), edge = $('#ly-edge', root), wrap = frame.parentElement!, showMlp = $<HTMLInputElement>('#ly-show-mlp', root)
  const override = new Map<number, number>()
  const scale = () => { const W = wrap.clientWidth - 34; return W < 600 ? W / Math.max(v, 640) : W / L.VMAX }
  const cards = CARDS.map((imp, i) => {
    const el = document.createElement('div'); el.className = 'ly-card'
    el.innerHTML = `<span class="ly-ghost" aria-hidden="true"></span><span class="ly-t">${NAMES[i]}</span><span class="ly-imp">importance ${imp}</span><span class="ly-w"></span><span class="ly-handle" role="slider" tabindex="0" aria-label="${NAMES[i]} width"><span class="ly-grip"></span></span>`
    const h = el.querySelector<HTMLElement>('.ly-handle')!
    const set = (w: number) => { w = Math.round(Math.max(L.MIN_W, Math.min(v - L.GUTTER, w))); override.set(i, w); render() }
    const commit = () => { const w = override.get(i); if (w === undefined) return; drags = drags.filter(d => !(d.imp === imp && d.v === v)); drags.push({ imp, v, w }); update(); render() }
    h.addEventListener('pointerdown', e => { if (busy) return; stopHint(); e.preventDefault(); h.setPointerCapture(e.pointerId); const x0 = e.clientX, w0 = width(i), s = scale(); const mv = (ev: PointerEvent) => set(w0 + (ev.clientX - x0) / s); const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); commit() }; h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up) })
    h.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 10 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -10 : 0; if (!d || busy) return; e.preventDefault(); stopHint(); set(width(i) + d); commit() })
    screen.appendChild(el); return el
  })
  // the screen edge: drag (or arrow keys) to resize the simulated screen
  const setV = (nv: number) => { v = Math.round(Math.max(L.VMIN, Math.min(L.VMAX, nv)) / 10) * 10; override.clear(); render(); mocks() }
  edge.addEventListener('pointerdown', e => { if (busy) return; stopHint(); e.preventDefault(); edge.setPointerCapture(e.pointerId); const x0 = e.clientX, v0 = v, s = scale(); const mv = (ev: PointerEvent) => setV(v0 + (ev.clientX - x0) / s); const up = () => { edge.removeEventListener('pointermove', mv); edge.removeEventListener('pointerup', up) }; edge.addEventListener('pointermove', mv); edge.addEventListener('pointerup', up) })
  edge.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 20 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -20 : e.key === 'PageUp' ? 100 : e.key === 'PageDown' ? -100 : 0; if (!d || busy) return; e.preventDefault(); stopHint(); setV(v + d) })
  const model = () => showMlp.checked && mlp ? L.netWidth(mlp) : L.netWidth(net)
  const width = (i: number) => override.get(i) ?? model()(CARDS[i]!, v)
  function render() {
    const s = scale()
    frame.style.width = `${v * s}px`; screen.style.width = `${v}px`; screen.style.transform = `scale(${s})`
    $('#ly-vp-out', root).textContent = `${v} px`
    edge.setAttribute('aria-valuenow', String(v)); edge.setAttribute('aria-valuetext', `${v} pixels`)
    cards.forEach((el, i) => {
      const w = width(i), bad = w > v - L.GUTTER + .5 || w < L.MIN_W - .5, ex = drags.find(d => d.v === v && d.imp === CARDS[i])
      el.style.width = `${w}px`; el.classList.toggle('bad', bad); el.classList.toggle('mine', override.has(i))
      el.querySelector('.ly-w')!.textContent = `${Math.round(w)} px${bad ? ' · overflows!' : ''}`
      const g = el.querySelector<HTMLElement>('.ly-ghost')!; g.style.display = ex ? 'block' : 'none'; if (ex) g.style.width = `${ex.w}px`
      const h = el.querySelector('.ly-handle')!; h.setAttribute('aria-valuenow', String(Math.round(w))); h.setAttribute('aria-valuemin', String(L.MIN_W)); h.setAttribute('aria-valuemax', String(v - L.GUTTER)); h.setAttribute('aria-valuetext', `${Math.round(w)} pixels`)
    })
    const hh = screen.scrollHeight * s; frame.style.height = `${hh + 4}px`; wrap.style.height = `${hh + 8}px`
  }
  function mocks() {
    const widths = [...new Set(drags.map(d => d.v))].sort((a, b) => b - a)
    $('#ly-mocks', root).innerHTML = widths.map(w => `<button type="button" class="ly-mock${w === v ? ' on' : ''}" data-w="${w}" aria-pressed="${w === v}"><b>${w} px</b> ${drags.filter(d => d.v === w).length} example${drags.filter(d => d.v === w).length === 1 ? '' : 's'}</button>`).join('')
    root.querySelectorAll<HTMLButtonElement>('.ly-mock').forEach(b => b.addEventListener('click', () => setV(+b.dataset.w!)))
  }
  function stats() {
    const k = toK(getW(net)), f = L.netWidth(net)
    $('#ly-code', root).textContent = L.source(k)
    $('#ly-oob', root).textContent = String(L.outOfBounds(f))
    let md = 0; for (const [i, w] of L.CHECK) md = Math.max(md, Math.abs(f(i, w) - L.jsWidth(k, i, w)))
    $('#ly-jsdiff', root).textContent = md < 0.001 ? `${md.toExponential(1)} px` : `${md.toFixed(3)} px`
    $('#ly-err', root).textContent = drags.length ? `${Math.max(...drags.map(d => Math.abs(f(d.imp, d.v) - d.w))).toFixed(1)} px` : '–'
  }
  const update = () => { $('#ly-drags', root).textContent = `${drags.length} example${drags.length === 1 ? '' : 's'} at ${new Set(drags.map(d => d.v)).size} screen width(s)`; $<HTMLButtonElement>('#ly-learn', root).disabled = !drags.length; stats(); mocks() }
  window.addEventListener('resize', render)
  $('#ly-sim', root).addEventListener('click', () => { drags = L.designerDrags(); override.clear(); update(); setV(1280) })
  $('#ly-reset', root).addEventListener('click', () => { setW(net, [L.START.BASE, L.START.PER_LEVEL, L.START.SHARE]); drags = []; override.clear(); mlp = null; showMlp.checked = false; showMlp.disabled = true; $('#ly-loss', root).setAttribute('hidden', ''); update(); render() })
  let sweepId = 0
  function sweep(from: number, to: number, ms: number, done?: () => void, hint = false) { const id = ++sweepId; if (prefersReducedMotion()) { setV(to); done?.(); return } const t0 = performance.now(); const f = (t: number) => { if ((hint && touched) || id !== sweepId) return; const p = Math.min(1, (t - t0) / ms), e = p < .5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2; setV(from + (to - from) * e); if (p < 1) requestAnimationFrame(f); else done?.() }; requestAnimationFrame(f) }
  $('#ly-learn', root).addEventListener('click', () => {
    if (busy) return; busy = true; override.clear()
    const tr = L.trainer(net, drags, 0.05, L.SCALE, L.RANGES), total = 400, per = prefersReducedMotion() ? total : 8; let s = 0, worst = 0, ms = 0; const losses: number[] = []
    const loss = $('#ly-loss', root); loss.removeAttribute('hidden')
    const frameFn = () => { const a = performance.now(); for (let k = 0; k < per && s < total; k++, s++) { losses.push(tr.step()); worst = Math.max(worst, L.outOfBounds(L.netWidth(net))) } ms += performance.now() - a
      const mx = Math.max(...losses), pts = losses.map((l, i) => `${(i / total * 300).toFixed(1)},${(46 - Math.sqrt(l / mx) * 42).toFixed(1)}`).join(' ')
      loss.innerHTML = `<polyline points="${pts}" class="rk2-line"/><text x="2" y="10" class="rk2-ax">error</text><text x="298" y="48" text-anchor="end" class="rk2-ax">step ${s}</text>`
      render(); $('#ly-code', root).textContent = L.source(toK(getW(net))); $('#ly-msg', root).textContent = `learning… ${s} / ${total}`
      if (s < total) { requestAnimationFrame(frameFn); return }
      busy = false; stats(); $<HTMLButtonElement>('#ly-mlp', root).disabled = false
      $('#ly-msg', root).textContent = `learned in ${total} steps (${Math.round(ms)} ms, including the bounds check). Out of bounds after any step: ${worst}. Now watch every width:`
      sweep(v, 320, 1400, () => sweep(320, 1440, 1800, () => sweep(1440, 1280, 600))) }
    requestAnimationFrame(frameFn)
  })
  $('#ly-mlp', root).addEventListener('click', () => {
    const m = L.mlpLayout(4), tr = L.trainer(m, drags, 0.01, m.weights.map(() => 1)); let s = 0; const t0 = performance.now(), btn = $<HTMLButtonElement>('#ly-mlp', root); btn.disabled = true
    const chunk = () => { for (let k = 0; k < 200 && s < 2000; k++, s++) tr.step(); $('#ly-mlp-msg', root).textContent = `training… ${s} / 2000`; if (s < 2000) { setTimeout(chunk, 0); return }
      mlp = m; const f = L.netWidth(m), bad = L.outOfBounds(f), err = Math.max(...drags.map(d => Math.abs(f(d.imp, d.v) - d.w)))
      $('#ly-mlp-msg', root).innerHTML = `Trained in ${Math.round(performance.now() - t0)} ms. It matches the examples to within ${err.toFixed(1)} px, yet <strong class="${bad ? 'bad' : 'ok'}">${bad} of ${L.CHECK.length}</strong> cards land out of bounds across 50 screen widths. Showing its layout now: drag the screen narrow.`
      showMlp.disabled = false; showMlp.checked = true; btn.disabled = false; render(); sweep(v, 320, 1400) }
    chunk()
  })
  showMlp.addEventListener('change', render)
  root.querySelectorAll<HTMLButtonElement>('#ly-predict .choice').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll('#ly-predict .choice').forEach(x => x.setAttribute('aria-pressed', String(x === b)))
    const el = $('#ly-reveal', root); el.hidden = false
    el.innerHTML = `${b.dataset.v === 'never' ? '<strong>Right.</strong>' : '<strong>Not here.</strong>'} Learning only moves BASE, PER_LEVEL and SHARE. The <code>clamp</code> line is part of the network, so it holds for any constants: the counter checks 1,000 cards at 50 widths after every training step. The generic model in step 4 is where your instinct is right.`
  }))
  // discoverability: a one-time demo of both handles when the stage first scrolls into view
  let hinted = false
  const stopHint = () => { touched = true; sweepId++; root.classList.remove('ly-hinting') }
  new IntersectionObserver((es, io) => { if (!es.some(e => e.isIntersecting) || hinted) return; hinted = true; io.disconnect(); if (touched || prefersReducedMotion()) return
    root.classList.add('ly-hinting'); sweep(1280, 760, 900, () => sweep(760, 1280, 900, () => { if (!touched) setTimeout(() => root.classList.remove('ly-hinting'), 4000) }, true), true) }, { threshold: .4 }).observe(wrap)
  update(); render()
  return { net, get drags() { return drags }, k: () => toK(getW(net)), get v() { return v } }
}
