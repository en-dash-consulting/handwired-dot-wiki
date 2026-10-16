// Ranking demo UI, used on /pages/ranking.html and (compact) on the home page.
import { $, prefersReducedMotion } from '../lib/dom'
import { evalNet, getW, setW } from './common'
import * as R from './ranking'

const LIST_SEED = 1, TEST = R.testLists(1000, 7)
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const pct = (x: number) => `${Math.round(x * 1000) / 10}%`

export function mountRanking(root: HTMLElement) {
  const list = R.results(LIST_SEED), net = R.buildRanker()
  const toW = (v: ArrayLike<number>): R.W => ({ W_MATCH: v[0]!, W_POP: v[1]!, W_FRESH: v[2]!, W_RATING: v[3]! })
  const fromW = (w: R.W) => R.WEIGHTS.map(k => w[k])
  setW(net, fromW(R.GUT))
  const score = (it: R.Item) => evalNet(net, R.featsOf(it))[net.out[0]!]!
  let clicks: R.Click[] = [], prev = fromW(R.GUT), busy = false

  const codeEl = $('#rk-code', root), listEl = $<HTMLOListElement>('#rk-list', root)
  function renderCode(changed = false) {
    const w = toW(getW(net)), src = esc(R.source(w, true))
    const wl = root.querySelector('#rk-wline'); if (wl) wl.textContent = R.WEIGHTS.map(k => `${k} ${Math.round(w[k] * 100) / 100}`).join(' · ')
    codeEl.innerHTML = src.replace(/(W_\w+) = ([\d.]+)/g, (_, k, v) => `${k} = <span class="tok-a${changed ? ' tick' : ''}">${v}</span>`).replace(/(if \(.*?\) s \+= -?\d+)/g, '<span class="rule">$1</span>')
  }
  const rows = new Map<number, HTMLLIElement>()
  list.forEach((it, i) => {
    const li = document.createElement('li'); li.dataset.i = String(i)
    li.innerHTML = `<button type="button" class="rk-item${it.inStock ? '' : ' oos'}${it.pinned ? ' pinned' : ''}"><span class="rk-name">${it.pinned ? '📌 ' : ''}${esc(it.name)}${it.inStock ? '' : ' <em>out of stock</em>'}</span><span class="rk-f" aria-label="match ${it.match}, popularity ${it.pop}, freshness ${it.fresh}, rating ${it.rating}">m${it.match} p${it.pop} f${it.fresh} r${it.rating}</span></button>`
    li.querySelector('button')!.addEventListener('click', () => { if (!busy) { clicks.push({ clicked: i, shown: current().slice(0, R.TOP_N) }); li.classList.add('clicked'); setTimeout(() => li.classList.remove('clicked'), 400); updateClicks() } })
    rows.set(i, li)
  })
  const current = () => R.order(list, score)
  function renderList(el: HTMLOListElement, ord: number[], map: Map<number, HTMLLIElement>) {
    const first = new Map([...map].filter(([, li]) => li.isConnected).map(([i, li]) => [i, li.getBoundingClientRect().top]))
    ord.forEach((i, pos) => { const li = map.get(i)!; li.classList.toggle('cut', pos === R.TOP_N); el.appendChild(li) })
    if (prefersReducedMotion()) return
    for (const [i, li] of map) { if (!first.has(i)) continue; const dy = first.get(i)! - li.getBoundingClientRect().top; if (!dy) continue; li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' }) }
  }
  function rules() {
    const o = current(), pinOk = list[o[0]!]!.pinned === 1, oos = o.slice(0, R.TOP_N).filter(i => !list[i]!.inStock).length
    $('#rk-pin', root).textContent = pinOk ? '✓' : '✗'; $('#rk-oos', root).textContent = String(oos)
    $('#rk-top3', root).textContent = pct(R.top3Rate(score, TEST))
  }
  const updateClicks = () => { $('#rk-clicks', root).textContent = `${clicks.length.toLocaleString()} clicks logged`; ($('#rk-learn', root) as HTMLButtonElement).disabled = clicks.length === 0 }
  const refresh = (changed = false) => { renderCode(changed); renderList(listEl, current(), rows); rules() }

  $('#rk-sim', root).addEventListener('click', () => { clicks = clicks.concat(R.shoppers(list, current(), 1000, 3 + clicks.length)); updateClicks(); $('#rk-learn-msg', root).textContent = 'ready to learn' })
  $('#rk-reset', root).addEventListener('click', () => { setW(net, fromW(R.GUT)); clicks = []; updateClicks(); $('#rk-learn-msg', root).textContent = ''; refresh() })
  $('#rk-learn', root).addEventListener('click', () => {
    if (busy) return; busy = true; prev = getW(net)
    const tr = R.clickTrainer(net, list, clicks, 0.15, [1, 1, 1, 1], [[0, 20], [0, 20], [0, 20], [0, 20]])
    const total = 300, per = prefersReducedMotion() ? total : 6; let s = 0, breaks = 0; const t0 = performance.now(); let ms = 0
    const frame = () => {
      const a = performance.now(); for (let k = 0; k < per && s < total; k++, s++) { tr.step(); const o = current(); if (!list[o[0]!]!.pinned || o.slice(0, R.TOP_N).some(i => !list[i]!.inStock)) breaks++ } ms += performance.now() - a
      renderCode(true); renderList(listEl, current(), rows)
      $('#rk-learn-msg', root).textContent = `learning… step ${s} / ${total}`
      if (s < total) { requestAnimationFrame(frame); return }
      rules(); busy = false
      $('#rk-learn-msg', root).textContent = `learned in ${total} steps (${Math.round(ms)} ms of compute, ${Math.round(performance.now() - t0)} ms animated). Rules checked after every step: ${breaks} breaks.`
      root.dispatchEvent(new CustomEvent('learned'))
      const d = root.querySelector('#rk-diff'); if (d) d.innerHTML = diff(toW(prev), toW(getW(net)))
      const m = root.querySelector<HTMLButtonElement>('#rk-mlp'); if (m) m.disabled = false
    }
    requestAnimationFrame(frame)
  })

  // predict
  root.querySelectorAll<HTMLButtonElement>('#rk-predict .choice').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll('#rk-predict .choice').forEach(x => x.setAttribute('aria-pressed', String(x === b)))
    let same = 0, eq = 0, n = 0; const js = R.compileJs(toW(getW(net)))
    for (const L of TEST) { const a = R.order(L, js), c = R.order(L, score); if (a.join() === c.join()) same++; for (const it of L) { n++; if (js(it) === score(it)) eq++ } }
    const el = $('#rk-reveal', root); el.hidden = false
    el.innerHTML = `${b.dataset.v === 'always' ? '<strong>Right.</strong>' : '<strong>Surprise:</strong>'} measured just now on ${TEST.length.toLocaleString()} random lists: <strong>${same.toLocaleString()} / ${TEST.length.toLocaleString()}</strong> in the identical order, and ${eq.toLocaleString()} / ${n.toLocaleString()} scores equal to the last digit. No training; the net <em>is</em> the code. (Exact because the features and weights here are whole numbers; float32 and JavaScript's float64 agree on them.)`
  }))

  // foil
  const mlpBtn = root.querySelector<HTMLButtonElement>('#rk-mlp')
  if (mlpBtn) {
    const mrows = new Map<number, HTMLLIElement>(), mlist = $<HTMLOListElement>('#rk-mlp-list', root)
    list.forEach((it, i) => { const li = document.createElement('li'); li.innerHTML = `<span class="rk-item static${it.inStock ? '' : ' oos'}${it.pinned ? ' pinned' : ''}"><span class="rk-name">${it.pinned ? '📌 ' : ''}${esc(it.name)}${it.inStock ? '' : ' <em>out of stock</em>'}</span></span>`; mrows.set(i, li) })
    mlpBtn.addEventListener('click', () => {
      mlpBtn.disabled = true; const msg = $('#rk-mlp-msg', root); msg.textContent = 'training in a Web Worker…'
      const w = new Worker(new URL('./ranking-worker.ts', import.meta.url), { type: 'module' })
      w.onmessage = (e: MessageEvent) => {
        const d = e.data
        if (d.progress !== undefined) { msg.textContent = `training in a Web Worker… ${Math.round(d.progress * 100)}%`; return }
        renderList(mlist, d.order, mrows)
        const bad = (x: number) => `<span class="${x ? 'bad' : 'ok'}">${x.toLocaleString()} / ${d.total.toLocaleString()}</span>`
        $('#rk-mlp-pin', root).innerHTML = bad(d.pin); $('#rk-mlp-oos', root).innerHTML = bad(d.oos); $('#rk-mlp-top3', root).textContent = pct(d.top3)
        $('#rk-mlp-w', root).textContent = `${d.weights} unlabeled numbers`
        msg.textContent = `trained ${d.steps} steps in ${(d.ms / 1000).toFixed(1)} s. It ranks well, and still breaks both rules: it learned that pinned and out-of-stock items get clicked, not that they are rules.`
        mlpBtn.disabled = false; w.terminate()
      }
      w.postMessage({ seed: LIST_SEED, clicks })
    })
  }
  refresh()
  return { net, list, get clicks() { return clicks }, weights: () => toW(getW(net)), current }
}

function diff(a: R.W, b: R.W) {
  const f = (v: number) => (Math.round(v * 100) / 100).toString()
  const lines = R.WEIGHTS.flatMap(k => f(a[k]) === f(b[k]) ? [`  const ${k} = ${f(a[k])}`] : [`<span class="del">- const ${k} = ${f(a[k])}</span>`, `<span class="add">+ const ${k} = ${f(b[k])}</span>`])
  return `<span class="hint">score.js · 4 numbers changed by clicks, 0 rule lines touched</span>\n${lines.join('\n')}\n  if (item.pinned) s += ${R.PIN}\n  if (!item.inStock) s += ${R.OUT_OF_STOCK}`
}
