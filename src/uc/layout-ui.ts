import { $, prefersReducedMotion } from '../lib/dom'
import { getW, setW } from './common'
import * as L from './layout'

const CARDS = [3, 1, 0, 2, 0, 1, 3, 0, 2, 1]
const NAMES = ['Hero story', 'Update', 'Note', 'Feature', 'Tip', 'Event', 'Big launch', 'Link', 'Guide', 'Poll']
export function mountLayout(root: HTMLElement) {
  const net = L.buildLayout(), toK = (v: ArrayLike<number>): L.K => ({ BASE: v[0]!, PER_LEVEL: v[1]!, SHARE: v[2]! })
  setW(net, [L.START.BASE, L.START.PER_LEVEL, L.START.SHARE])
  let drags: L.Drag[] = [], mlp: ReturnType<typeof L.mlpLayout> | null = null, busy = false
  const screen = $('#ly-screen', root), vp = $<HTMLInputElement>('#ly-vp', root), showMlp = $<HTMLInputElement>('#ly-show-mlp', root)
  const override = new Map<number, number>()
  const cards = CARDS.map((imp, i) => {
    const el = document.createElement('div'); el.className = 'ly-card'
    el.innerHTML = `<span class="ly-t">${NAMES[i]}</span><span class="ly-imp">importance ${imp}</span><span class="ly-w"></span><span class="ly-handle" role="slider" tabindex="0" aria-label="${NAMES[i]} width"></span>`
    const h = el.querySelector<HTMLElement>('.ly-handle')!
    const set = (w: number) => { const v = +vp.value; w = Math.round(Math.max(L.MIN_W, Math.min(v - L.GUTTER, w))); override.set(i, w); render() }
    const commit = () => { const w = override.get(i); if (w === undefined) return; drags = drags.filter(d => !(d.imp === imp && d.v === +vp.value)); drags.push({ imp, v: +vp.value, w }); update() }
    h.addEventListener('pointerdown', e => { if (busy) return; h.setPointerCapture(e.pointerId); const x0 = e.clientX, w0 = width(i), s = scale(); const mv = (ev: PointerEvent) => set(w0 + (ev.clientX - x0) / s); const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); commit() }; h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up) })
    h.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 10 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -10 : 0; if (!d || busy) return; e.preventDefault(); set(width(i) + d); commit() })
    screen.appendChild(el); return el
  })
  const scale = () => Math.min(1, (screen.parentElement!.clientWidth - 2) / +vp.value)
  const model = () => showMlp.checked && mlp ? L.netWidth(mlp) : L.netWidth(net)
  const width = (i: number) => override.get(i) ?? model()(CARDS[i]!, +vp.value)
  function render() {
    const v = +vp.value, s = scale()
    screen.style.width = `${v}px`; screen.style.transform = `scale(${s})`; screen.parentElement!.style.height = `${screen.scrollHeight * s + 4}px`
    $('#ly-vp-out', root).textContent = `${v} px`
    cards.forEach((el, i) => { const w = width(i), bad = w > v - L.GUTTER + .5 || w < L.MIN_W - .5; el.style.width = `${w}px`; el.classList.toggle('bad', bad); el.classList.toggle('mine', override.has(i)); el.querySelector('.ly-w')!.textContent = `${Math.round(w)} px${bad ? ' · overflows' : ''}`; const h = el.querySelector('.ly-handle')!; h.setAttribute('aria-valuenow', String(Math.round(w))); h.setAttribute('aria-valuemin', String(L.MIN_W)); h.setAttribute('aria-valuemax', String(v - L.GUTTER)); h.setAttribute('aria-valuetext', `${Math.round(w)} pixels`) })
    screen.parentElement!.style.height = `${screen.scrollHeight * s + 4}px`
  }
  function stats() {
    const k = toK(getW(net)), f = L.netWidth(net)
    $('#ly-code', root).textContent = L.source(k)
    $('#ly-oob', root).textContent = String(L.outOfBounds(f))
    let md = 0; for (const [i, v] of L.CHECK) md = Math.max(md, Math.abs(f(i, v) - L.jsWidth(k, i, v)))
    $('#ly-jsdiff', root).textContent = md < 0.001 ? `${md.toExponential(1)} px` : `${md.toFixed(3)} px`
    $('#ly-err', root).textContent = drags.length ? `${Math.max(...drags.map(d => Math.abs(f(d.imp, d.v) - d.w))).toFixed(1)} px` : '–'
  }
  const update = () => { $('#ly-drags', root).textContent = `${drags.length} drag${drags.length === 1 ? '' : 's'} logged at ${new Set(drags.map(d => d.v)).size} screen width(s)`; $<HTMLButtonElement>('#ly-learn', root).disabled = !drags.length; stats() }
  vp.addEventListener('input', () => { override.clear(); render() })
  window.addEventListener('resize', render)
  $('#ly-sim', root).addEventListener('click', () => { drags = L.designerDrags(); override.clear(); update(); render() })
  $('#ly-reset', root).addEventListener('click', () => { setW(net, [L.START.BASE, L.START.PER_LEVEL, L.START.SHARE]); drags = []; override.clear(); mlp = null; showMlp.checked = false; showMlp.disabled = true; update(); render() })
  $('#ly-learn', root).addEventListener('click', () => {
    if (busy) return; busy = true; override.clear()
    const tr = L.trainer(net, drags, 0.05, L.SCALE, L.RANGES), total = 400, per = prefersReducedMotion() ? total : 8; let s = 0, worst = 0, ms = 0
    const frame = () => { const a = performance.now(); for (let k = 0; k < per && s < total; k++, s++) { tr.step(); worst = Math.max(worst, L.outOfBounds(L.netWidth(net))) } ms += performance.now() - a
      render(); $('#ly-code', root).textContent = L.source(toK(getW(net))); $('#ly-msg', root).textContent = `learning… ${s} / ${total}`
      if (s < total) { requestAnimationFrame(frame); return }
      busy = false; stats(); $('#ly-msg', root).textContent = `learned in ${total} steps (${Math.round(ms)} ms, including the bounds check). Bounds checked after every step: ${worst} out of bounds.`; $<HTMLButtonElement>('#ly-mlp', root).disabled = false }
    requestAnimationFrame(frame)
  })
  $('#ly-mlp', root).addEventListener('click', () => {
    const m = L.mlpLayout(4), tr = L.trainer(m, drags, 0.01, m.weights.map(() => 1)); let s = 0; const t0 = performance.now(), btn = $<HTMLButtonElement>('#ly-mlp', root); btn.disabled = true
    const chunk = () => { for (let k = 0; k < 200 && s < 2000; k++, s++) tr.step(); $('#ly-mlp-msg', root).textContent = `training… ${s} / 2000`; if (s < 2000) { setTimeout(chunk, 0); return }
      mlp = m; const f = L.netWidth(m), bad = L.outOfBounds(f), err = Math.max(...drags.map(d => Math.abs(f(d.imp, d.v) - d.w)))
      $('#ly-mlp-msg', root).innerHTML = `Trained in ${Math.round(performance.now() - t0)} ms. It matches your drags to within ${err.toFixed(1)} px, and <strong class="${bad ? 'bad' : 'ok'}">${bad} of ${L.CHECK.length}</strong> cards land out of bounds across the 50 screen widths. Its 49 weights don't say why. Try it at 320 px.`
      showMlp.disabled = false; btn.disabled = false }
    chunk()
  })
  showMlp.addEventListener('change', render)
  root.querySelectorAll<HTMLButtonElement>('#ly-predict .choice').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll('#ly-predict .choice').forEach(x => x.setAttribute('aria-pressed', String(x === b)))
    const el = $('#ly-reveal', root); el.hidden = false
    el.innerHTML = `${b.dataset.v === 'never' ? '<strong>Right.</strong>' : '<strong>Not here.</strong>'} Learning only moves BASE, PER_LEVEL and SHARE. The <code>clamp</code> line is part of the network, so it holds for any constants: the counter above checks 1,000 cards at 50 widths after every training step. The generic model in step 4 is where your instinct is right.`
  }))
  update(); render()
  return { net, get drags() { return drags }, k: () => toK(getW(net)) }
}
