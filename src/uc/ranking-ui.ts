// Ranking demo: shoppers stream in, and two models learn from the same clicks side by side.
import { $, prefersReducedMotion } from '../lib/dom'
import { evalNet, getW, setW, type Net } from './common'
import * as R from './ranking'

const LIST_SEED = 1, TEST = R.testLists(200, 7), TOTAL = 1000, ROUND = 25, STEPS = 6
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const pct = (x: number) => `${Math.round(x * 100)}%`
const NS = 'http://www.w3.org/2000/svg'

export function mountRanking(root: HTMLElement) {
  const list = R.results(LIST_SEED), hw = R.buildRanker()
  const toW = (v: ArrayLike<number>): R.W => ({ W_MATCH: v[0]!, W_POP: v[1]!, W_FRESH: v[2]!, W_RATING: v[3]! })
  const gut = R.WEIGHTS.map(k => R.GUT[k])
  let mlp: Net, trHw: ReturnType<typeof R.clickTrainer>, trMlp: ReturnType<typeof R.clickTrainer>
  let clicks: R.Click[] = [], shopper = 0, playing = false, timer = 0, history: { n: number, hw: number, mlp: number }[] = []
  const f = (n: Net) => (it: R.Item) => evalNet(n, R.featsOf(it))[n.out[0]!]!
  const pending = () => clicks.filter(c => !list[c.clicked]!.pinned && list[c.clicked]!.inStock)

  function reset() {
    setW(hw, gut); mlp = R.mlpRanker(11)
    clicks = []; shopper = 0; history = []
    trHw = R.clickTrainer(hw, list, [], 0.15, [1, 1, 1, 1], [[0, 20], [0, 20], [0, 20], [0, 20]])
    trMlp = R.clickTrainer(mlp, list, [], 0.01, mlp.weights.map(() => 1))
    measure(); render(true)
    $('#rk-ticker', root).textContent = 'No shoppers yet. Left: the guessed formula. Right: a generic net, starting from random numbers as they do.'
  }
  // rows for both lists
  const rows = (id: string, clickable: boolean) => { const m = new Map<number, HTMLLIElement>(); list.forEach((it, i) => { const li = document.createElement('li'); li.dataset.i = String(i); const tag = clickable ? 'button' : 'span'; li.innerHTML = `<${tag}${clickable ? ' type="button"' : ''} class="rk-item${clickable ? '' : ' static'}${it.inStock ? '' : ' oos'}${it.pinned ? ' pinned' : ''}"><span class="rk-name">${it.pinned ? '📌 ' : ''}${esc(it.name)}${it.inStock ? '' : ' <em>out of stock</em>'}</span><span class="rk-dot" aria-hidden="true"></span></${tag}>`; m.set(i, li) }); return m }
  const hwRows = rows('hw', true), mlpRows = rows('mlp', false)
  hwRows.forEach((li, i) => li.querySelector('button')!.addEventListener('click', () => { stop(); addShopper(i) }))
  const hwList = $<HTMLOListElement>('#rk-hw-list', root), mlpList = $<HTMLOListElement>('#rk-mlp-list', root)
  function place(el: HTMLOListElement, ord: number[], map: Map<number, HTMLLIElement>, animate: boolean) {
    const first = new Map([...map].filter(([, li]) => li.isConnected).map(([i, li]) => [i, li.getBoundingClientRect().top]))
    ord.slice(0, R.TOP_N).forEach(i => el.appendChild(map.get(i)!)); ord.slice(R.TOP_N).forEach(i => map.get(i)!.remove())
    if (!animate || prefersReducedMotion()) return
    for (const i of ord.slice(0, R.TOP_N)) { const li = map.get(i)!; if (!first.has(i)) { li.animate([{ opacity: 0 }, { opacity: 1 }], 300); continue } const dy = first.get(i)! - li.getBoundingClientRect().top; if (dy) li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 350, easing: 'ease-out' }) }
  }
  const codeEl = $('#rk-code', root), wGrid = $('#rk-mlp-w', root)
  function render(animate: boolean) {
    const w = toW(getW(hw)), r = (v: number) => (Math.round(v * 10) / 10).toFixed(1)
    codeEl.innerHTML = `score = <b>${r(w.W_MATCH)}</b> × match\n      + <b>${r(w.W_POP)}</b> × popularity\n      + <b>${r(w.W_FRESH)}</b> × freshness\n      + <b>${r(w.W_RATING)}</b> × rating\n<span class="rule">if (pinned)   score += 100000\nif (!inStock) score -= 50000</span>`
    wGrid.innerHTML = getW(mlp).map(v => `<i style="--v:${Math.max(-1, Math.min(1, v)).toFixed(2)}"></i>`).join('')
    place(hwList, R.order(list, f(hw)), hwRows, animate); place(mlpList, R.order(list, f(mlp)), mlpRows, animate)
    chart()
  }
  function measure() {
    const a = R.top3Rate(f(hw), TEST), b = R.top3Rate(f(mlp), TEST), ra = R.ruleBreaks(f(hw), TEST), rb = R.ruleBreaks(f(mlp), TEST)
    history.push({ n: shopper, hw: a, mlp: b })
    $('#rk-hw-top3', root).textContent = pct(a); $('#rk-mlp-top3', root).textContent = pct(b)
    const badge = (id: string, n: number, text: string) => { const el = $(id, root); el.className = n ? 'bad' : 'ok'; el.textContent = n ? `✗ ${text}: broken on ${n} of ${TEST.length} test searches` : `✓ ${text}` }
    badge('#rk-hw-pin', ra.pin, '📌 pinned result first'); badge('#rk-hw-oos', ra.oos, 'no out-of-stock in the top 10')
    badge('#rk-mlp-pin', rb.pin, '📌 pinned result first'); badge('#rk-mlp-oos', rb.oos, 'no out-of-stock in the top 10')
    return { ra, rb }
  }
  function chart() {
    for (const [id, k] of [['#rk-hw-chart', 'hw'], ['#rk-mlp-chart', 'mlp']] as const) {
      const svg = $(id, root) as unknown as SVGSVGElement, X = (n: number) => 4 + n / TOTAL * 292, Y = (v: number) => 84 - v * 78
      const pts = history.map(h => `${X(h.n).toFixed(1)},${Y(h[k]).toFixed(1)}`).join(' ')
      svg.innerHTML = `<line x1="4" x2="296" y1="${Y(1)}" y2="${Y(1)}" class="rk2-grid"/><line x1="4" x2="296" y1="${Y(.5)}" y2="${Y(.5)}" class="rk2-grid"/><text x="296" y="${Y(1) - 2}" text-anchor="end" class="rk2-ax">100%</text><text x="296" y="${Y(.5) - 2}" text-anchor="end" class="rk2-ax">50%</text><polyline points="${pts}" class="rk2-line"/>${history.length ? `<circle cx="${X(history.at(-1)!.n)}" cy="${Y(history.at(-1)![k])}" r="3.5" class="rk2-pt"/>` : ''}<text x="4" y="89" class="rk2-ax">0 shoppers</text><text x="296" y="89" text-anchor="end" class="rk2-ax">1,000</text>`
    }
  }
  function addShopper(forced?: number) {
    const ord = R.order(list, f(hw)), shown = ord.slice(0, R.TOP_N)
    const c = forced !== undefined ? { clicked: forced, shown } : R.shoppers(list, ord, 1, 1000 + shopper)[0]!
    clicks.push(c); shopper++
    const li = hwRows.get(c.clicked); if (li && !prefersReducedMotion()) li.querySelector('.rk-dot')!.animate([{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], 600)
    $('#rk-ticker', root).textContent = `Shopper ${shopper.toLocaleString()} of ${TOTAL.toLocaleString()} clicked “${list[c.clicked]!.name}” (#${shown.indexOf(c.clicked) + 1}).`
    if (shopper % ROUND === 0 || forced !== undefined) learn()
    if (shopper >= TOTAL) finish()
  }
  function learn() {
    const data = pending(); if (!data.length) return
    // new click data each round; the same Adam state carries over, so learning is continuous
    trHw = R.clickTrainer(hw, list, data, 0.15, [1, 1, 1, 1], [[0, 20], [0, 20], [0, 20], [0, 20]], 24, shopper, trHw.opt)
    trMlp = R.clickTrainer(mlp, list, data, 0.01, mlp.weights.map(() => 1), undefined, 24, shopper, trMlp.opt)
    for (let s = 0; s < STEPS; s++) { trHw.step(); trMlp.step() }
    measure(); render(true)
  }
  function finish() {
    stop(); $<HTMLButtonElement>('#rk-play', root).disabled = true
    const { ra, rb } = measure()
    $('#rk-explain', root).innerHTML = `Done. Both models learned the shoppers’ taste. Yours ${ra.pin + ra.oos ? 'broke a rule' : 'never broke a rule'}, because the rules are lines of code that learning can't touch. The generic net broke the pinned rule on <strong>${rb.pin}</strong> and the stock rule on <strong>${rb.oos}</strong> of ${TEST.length} test searches: it learned that pinned and out-of-stock items get clicked, not that they're rules.`
    const d = root.closest('.uc')?.querySelector('#rk-diff'); if (d) d.innerHTML = diff(R.GUT, toW(getW(hw)))
  }
  function tick() { const n = shopper < 10 ? 1 : shopper < 50 ? 2 : 6; for (let k = 0; k < n && shopper < TOTAL; k++) addShopper(); if (playing) timer = window.setTimeout(tick, shopper < 10 ? 260 : 40) }
  const stop = () => { playing = false; clearTimeout(timer); $('#rk-play', root).textContent = shopper ? '▶ Keep going' : '▶ Let 1,000 shoppers in' }
  $('#rk-play', root).addEventListener('click', () => { if (playing) { stop(); return } playing = true; $('#rk-play', root).textContent = '⏸ Pause'; if (prefersReducedMotion()) { while (shopper < TOTAL) addShopper(); return } tick() })
  $('#rk-one', root).addEventListener('click', () => { stop(); if (shopper < TOTAL) addShopper() })
  $('#rk-reset', root).addEventListener('click', () => { stop(); $<HTMLButtonElement>('#rk-play', root).disabled = false; reset(); $('#rk-explain', root).innerHTML = 'Each shopper sees the list on the left and clicks what they like. After every 25 shoppers, <strong>both</strong> models take a few learning steps on all the clicks so far.' })

  // predict (page only)
  root.closest('.uc')?.querySelectorAll<HTMLButtonElement>('#rk-predict .choice').forEach(b => b.addEventListener('click', () => {
    b.closest('fieldset')!.querySelectorAll('.choice').forEach(x => x.setAttribute('aria-pressed', String(x === b)))
    const lists = R.testLists(1000, 7), js = R.compileJs(R.GUT), net = R.buildRanker(); setW(net, gut)
    let same = 0; for (const L of lists) if (R.order(L, js).join() === R.order(L, f(net)).join()) same++
    const el = root.closest('.uc')!.querySelector<HTMLElement>('#rk-reveal')!; el.hidden = false
    el.innerHTML = `${b.dataset.v === 'always' ? '<strong>Right.</strong>' : '<strong>Surprise:</strong>'} checked just now on 1,000 random searches: <strong>${same.toLocaleString()} of 1,000</strong> in the identical order. No training; the net <em>is</em> the code. That is what lets it learn without losing the rules.`
  }))
  reset()
  return { hw, list, get clicks() { return clicks }, get shopper() { return shopper }, weights: () => toW(getW(hw)) }
}

function diff(a: R.W, b: R.W) {
  const f = (v: number) => (Math.round(v * 10) / 10).toFixed(1)
  const lines = R.WEIGHTS.map(k => `<span class="del">- ${k} = ${f(a[k])}</span>\n<span class="add">+ ${k} = ${f(b[k])}</span>`)
  return `<span class="hint">ranking.js: 4 numbers changed by 1,000 shoppers, 0 rule lines touched</span>\n${lines.join('\n')}\n  if (pinned)   score += 100000\n  if (!inStock) score -= 50000`
}
