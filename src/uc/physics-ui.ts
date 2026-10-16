import { $, prefersReducedMotion } from '../lib/dom'
import { getW, setW } from './common'
import * as P from './physics'

const NS = 'http://www.w3.org/2000/svg'
export function mountPhysics(root: HTMLElement) {
  const net = P.buildPhysics(), toK = (v: ArrayLike<number>): P.K => ({ GRAVITY: v[0]!, DRAG: v[1]!, BOUNCE: v[2]! })
  const startW = [P.START.GRAVITY, P.START.DRAG, P.START.BOUNCE]; setW(net, startW)
  const ghost = P.recording(), svg = $('#ph-svg', root) as unknown as SVGSVGElement
  let throwNow: P.Throw = P.THROW, learned = false, busy = false, mlp: ReturnType<typeof P.mlpPhysics> | null = null
  const X = (x: number) => 20 + x * 1.5, Y = (y: number) => 280 - y * 1.5
  const el = (tag: string, a: Record<string, string | number>) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, String(a[k])); return e }
  const line = (p: [number, number][], cls: string) => el('polyline', { points: p.map(q => `${X(q[0]).toFixed(1)},${Y(q[1]).toFixed(1)}`).join(' '), class: cls, fill: 'none' })
  const ball = el('circle', { r: 7, class: 'ph-ball' })
  function draw() {
    svg.replaceChildren(el('line', { x1: 0, x2: 640, y1: Y(0), y2: Y(0), class: 'ph-floor' }))
    if (throwNow === P.THROW) ghost.forEach(q => svg.appendChild(el('circle', { cx: X(q[0]).toFixed(1), cy: Y(q[1]).toFixed(1), r: 2.6, class: 'ph-dot' })))
    else svg.appendChild(line(P.jsPath(P.REAL, throwNow), 'ph-real'))
    if (mlp) svg.appendChild(line(P.mlpPath(mlp, throwNow), 'ph-mlp'))
    const p = P.netPath(net, throwNow); svg.appendChild(line(p, 'ph-sim')); const last = p[p.length - 1]!; ball.setAttribute('cx', String(X(last[0]))); ball.setAttribute('cy', String(Y(last[1]))); svg.appendChild(ball)
    return p
  }
  function stats() {
    const k = toK(getW(net)), p = draw()
    $('#ph-code', root).textContent = P.source(k)
    $('#ph-fit', root).textContent = `${P.maxDiff(P.netPath(net, P.THROW), ghost).toFixed(1)} px`
    const d = P.maxDiff(p, P.jsPath(k, throwNow)); $('#ph-js', root).textContent = `${d.toExponential(1)} px`
    $('#ph-floor', root).textContent = String(P.belowFloor(p))
  }
  $('#ph-learn', root).addEventListener('click', () => {
    if (busy) return; busy = true; throwNow = P.THROW
    const tr = P.trainer(net, ghost), total = 400, per = prefersReducedMotion() ? total : 4; let s = 0, ms = 0
    const frame = () => { const a = performance.now(); for (let k = 0; k < per && s < total; k++, s++) tr.step(Math.min(P.T, 12 + Math.floor(s / 5))); ms += performance.now() - a
      $('#ph-code', root).textContent = P.source(toK(getW(net))); draw(); $('#ph-msg', root).textContent = `learning… step ${s} / ${total}, matching the first ${Math.min(P.T, 12 + Math.floor(s / 5))} frames`
      if (s < total) { requestAnimationFrame(frame); return }
      busy = false; learned = true; stats(); $<HTMLButtonElement>('#ph-new', root).disabled = false
      $('#ph-msg', root).textContent = `learned in ${total} steps (${Math.round(ms)} ms of compute). Real values were hidden; compare them in the fine print.` }
    requestAnimationFrame(frame)
  })
  $('#ph-play', root).addEventListener('click', () => {
    const p = P.netPath(net, throwNow); if (prefersReducedMotion()) return; let i = 0
    const f = () => { const q = p[i]!; ball.setAttribute('cx', String(X(q[0]))); ball.setAttribute('cy', String(Y(q[1]))); if (++i < p.length) setTimeout(f, 1000 / 60) }; f()
  })
  $('#ph-reset', root).addEventListener('click', () => { setW(net, startW); throwNow = P.THROW; learned = false; mlp = null; $<HTMLButtonElement>('#ph-new', root).disabled = true; $('#ph-msg', root).textContent = ''; $('#ph-new-msg', root).textContent = ''; $('#ph-mlp-msg', root).textContent = ''; stats() })
  $('#ph-new', root).addEventListener('click', () => {
    throwNow = throwNow === P.THROW ? P.NEW_THROW : P.THROW; stats()
    $('#ph-new', root).textContent = throwNow === P.THROW ? 'Throw a new ball' : 'Back to the recorded throw'
    if (throwNow !== P.THROW) $('#ph-new-msg', root).textContent = `New throw: the learned physics stays within ${P.maxDiff(P.netPath(net, P.NEW_THROW), P.jsPath(P.REAL, P.NEW_THROW)).toFixed(2)} px of the real ball over all 72 frames${mlp ? `; the generic model is ${P.maxDiff(P.mlpPath(mlp, P.NEW_THROW), P.jsPath(P.REAL, P.NEW_THROW)).toFixed(0)} px off` : ''}.`
  })
  $('#ph-mlp', root).addEventListener('click', () => {
    const m = P.mlpPhysics(3), tr = P.mlpTrainer(m, ghost, 0.03), btn = $<HTMLButtonElement>('#ph-mlp', root); btn.disabled = true; let s = 0; const t0 = performance.now()
    const chunk = () => { for (let k = 0; k < 40 && s < 800; k++, s++) tr.step(); $('#ph-mlp-msg', root).textContent = `training… ${s} / 800`; if (s < 800) { setTimeout(chunk, 0); return }
      mlp = m; stats(); btn.disabled = false
      $('#ph-mlp-msg', root).textContent = `Trained in ${(Math.round(performance.now() - t0) / 1000).toFixed(1)} s. On the recording it's up to ${P.maxDiff(P.mlpPath(m, P.THROW), ghost).toFixed(0)} px off: it smooths over the bounces. On the new throw it's ${P.maxDiff(P.mlpPath(m, P.NEW_THROW), P.jsPath(P.REAL, P.NEW_THROW)).toFixed(0)} px off, because one recording can't teach it what a throw is. ${learned ? '' : 'Learn your physics too, to compare.'}` }
    chunk()
  })
  root.querySelectorAll<HTMLButtonElement>('#ph-predict .choice').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll('#ph-predict .choice').forEach(x => x.setAttribute('aria-pressed', String(x === b)))
    const r = $('#ph-reveal', root); r.hidden = false
    r.innerHTML = `${b.dataset.v === 'yes' ? '<strong>Right.</strong>' : '<strong>It does.</strong>'} It learned three physical constants, not a path, so any new throw uses the same physics. Learn, then press <em>Throw a new ball</em> to measure it.`
  }))
  stats()
  return { net, k: () => toK(getW(net)) }
}
