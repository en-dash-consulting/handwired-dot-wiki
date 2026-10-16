import { $, prefersReducedMotion } from '../lib/dom'
import { getW, setW } from './common'
import * as C from './color'

const NS = 'http://www.w3.org/2000/svg', MODES = ['light', 'dark'] as const
export function mountColor(root: HTMLElement) {
  const nets = { light: C.buildTheme('light'), dark: C.buildTheme('dark') }
  const K = (m: C.Mode) => Object.fromEntries(C.KEYS.map((k, i) => [k, getW(nets[m])[i]!])) as C.K
  const reset = () => MODES.forEach(m => setW(nets[m], C.KEYS.map(k => C.START[m][k])))
  reset()
  let picks: C.Picks = structuredClone(C.PRESETS[0]!.picks), mlp: ReturnType<typeof C.mlpTheme> | null = null, busy = false, before = { light: K('light'), dark: K('dark') }
  const showMlp = $<HTMLInputElement>('#co-show-mlp', root), svg = $('#co-ui', root) as unknown as SVGSVGElement
  const theme = (m: C.Mode, hue = C.brandHue(picks)) => C.hexTheme(showMlp.checked && mlp ? C.mlpThemeOf(mlp, hue, m) : C.themeOf(nets[m], hue))

  // presets + pickers
  const presetBox = $('.co-presets', root)
  C.PRESETS.forEach((p, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'button secondary'; b.textContent = p.name; b.setAttribute('aria-pressed', String(i === 0)); b.addEventListener('click', () => { picks = structuredClone(p.picks); presetBox.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); syncInputs(); render() }); presetBox.appendChild(b) })
  const inputs = [...root.querySelectorAll<HTMLInputElement>('.co-pick input')]
  const syncInputs = () => inputs.forEach(i => { i.value = picks[i.dataset.mode as C.Mode][i.dataset.role as C.Role]! })
  inputs.forEach(i => i.addEventListener('input', () => { picks[i.dataset.mode as C.Mode][i.dataset.role as C.Role] = i.value; presetBox.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false')); render() }))

  const el = (tag: string, a: Record<string, string | number>, text?: string) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, String(a[k])); if (text) e.textContent = text; return e }
  function panel(x0: number, t: Record<C.Role, string>, bad: Set<string>) {
    const g = el('g', { transform: `translate(${x0} 0)` }), warn = (x: number, y: number, key: string) => { if (!bad.has(key)) return; g.append(el('rect', { x, y: y - 13, width: 20, height: 17, rx: 4, fill: '#ffd166', stroke: '#000' }), el('text', { x: x + 10, y: y, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#000' }, '!')) }
    g.append(el('rect', { width: 310, height: 250, rx: 14, fill: t.bg }), el('text', { x: 18, y: 30, 'font-size': 15, fill: t.text, 'font-weight': 700 }, 'Garden & Co.'), el('text', { x: 18, y: 52, 'font-size': 12, fill: t.muted }, 'Free delivery over $50'))
    g.append(el('rect', { x: 14, y: 66, width: 282, height: 170, rx: 12, fill: t.surface, stroke: t.accent, 'stroke-opacity': .25 }))
    g.append(el('text', { x: 30, y: 96, 'font-size': 16, 'font-weight': 700, fill: t.text }, 'Olive tree, 1.2 m'), el('text', { x: 30, y: 118, 'font-size': 12.5, fill: t.text }, 'Hardy, evergreen, likes full sun.'), el('text', { x: 30, y: 138, 'font-size': 11.5, fill: t.muted }, 'Ships in 3–5 days · 214 reviews'))
    g.append(el('text', { x: 30, y: 162, 'font-size': 12.5, fill: t.accent, 'text-decoration': 'underline' }, 'Care guide'))
    g.append(el('rect', { x: 30, y: 180, width: 120, height: 36, rx: 9, fill: t.accent }), el('text', { x: 90, y: 203, 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 700, fill: t.bg }, 'Add to cart'))
    g.append(el('rect', { x: 166, y: 186, width: 70, height: 24, rx: 12, fill: 'none', stroke: t.accent, 'stroke-width': 1.5 }), el('text', { x: 201, y: 202, 'text-anchor': 'middle', 'font-size': 11, fill: t.accent }, 'In stock'))
    warn(270, 30, 'text|bg'); warn(250, 118, 'text|surface'); warn(250, 52, 'muted|bg'); warn(250, 138, 'muted|surface'); warn(110, 162, 'accent|surface'); warn(152, 203, 'bg|accent')
    return g
  }
  function render() {
    const hue = C.brandHue(picks), th = { light: theme('light', hue), dark: theme('dark', hue) }
    svg.replaceChildren(...MODES.map((m, i) => panel(i * 330, th[m], new Set(C.violations(th[m]).map(([, a, b]) => `${a}|${b}`)))))
    $('#co-pairs', root).innerHTML = C.PAIRS.map(([name, a, b, min]) => `<tr><th scope="row">${name}</th>${MODES.map(m => { const r = C.contrast(th[m][a], th[m][b]); return `<td class="${r < min ? 'bad' : 'ok'}">${r.toFixed(2)}:1 ${r < min ? '✗' : '✓'}</td>` }).join('')}</tr>`).join('')
    code()
  }
  const code = () => { $('#co-code', root).textContent = `${C.source('light', K('light'))}\n${C.source('dark', K('dark'))}\n\n${C.SOURCE_BODY}` }
  function stats() {
    let v = 0, hd = 0
    for (const m of MODES) for (const h of C.CHECK_HUES) { const a = C.themeOf(nets[m], h), t = C.hexTheme(a); v += C.violations(t).length; const j = C.hexTheme(C.jsTheme(m, K(m), h)); for (const r of C.ROLES) if (t[r] !== j[r]) hd++ }
    $('#co-viol', root).textContent = String(v); $('#co-js', root).textContent = `${hd} of ${C.CHECK_HUES.length * 2 * 5}`
    $('#co-err', root).textContent = String(errOf(m => C.hexTheme(C.themeOf(nets[m], C.brandHue(picks)))))
    return v
  }
  const errOf = (f: (m: C.Mode) => Record<C.Role, string>) => Math.max(...MODES.flatMap(m => { const t = f(m); return Object.entries(picks[m]).map(([r, h]) => { const a = t[r as C.Role]; return Math.max(...[1, 3, 5].map(i => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(h!.slice(i, i + 2), 16)))) }) }))

  $('#co-learn', root).addEventListener('click', () => {
    if (busy) return; busy = true; $('#co-msg', root).textContent = 'learning…'; showMlp.checked = false; before = { light: K('light'), dark: K('dark') }
    const tr = C.trainer(nets, picks), total = 300, per = prefersReducedMotion() ? total : 5; let s = 0, worst = 0, ms = 0
    const frame = () => { const a = performance.now(); for (let k = 0; k < per && s < total; k++, s++) { tr.step(); for (const m of MODES) for (const h of C.CHECK_HUES) worst += C.violations(C.hexTheme(C.themeOf(nets[m], h))).length } ms += performance.now() - a
      render(); $('#co-msg', root).textContent = `learning… ${s} / ${total}`
      if (s < total) { requestAnimationFrame(frame); return }
      busy = false; stats(); diff()
      $('#co-msg', root).textContent = `learned in ${total} steps (${Math.round(ms)} ms, including checking 576 pairs after every step). Contrast failures over all ${total} steps: ${worst}.` }
    requestAnimationFrame(frame)
  })
  $('#co-reset', root).addEventListener('click', () => { reset(); mlp = null; showMlp.checked = false; showMlp.disabled = true; $('#co-msg', root).textContent = ''; $('#co-mlp-msg', root).textContent = ''; stats(); render() })
  showMlp.addEventListener('change', render)
  $('#co-mlp', root).addEventListener('click', () => {
    const hue = C.brandHue(picks), m = C.mlpTheme(3), tr = C.mlpTrainer(m, picks, { light: C.themeOf(nets.light, hue), dark: C.themeOf(nets.dark, hue) }); let s = 0; const t0 = performance.now(), btn = $<HTMLButtonElement>('#co-mlp', root); btn.disabled = true
    const chunk = () => { for (let k = 0; k < 150 && s < 1500; k++, s++) tr.step(); $('#co-mlp-msg', root).textContent = `training… ${s} / 1500`; if (s < 1500) { setTimeout(chunk, 0); return }
      mlp = m; btn.disabled = false; showMlp.disabled = false; showMlp.checked = true
      let here = 0, all = 0; for (const md of MODES) { here += C.violations(C.hexTheme(C.mlpThemeOf(m, hue, md))).length; for (const h of C.CHECK_HUES) all += C.violations(C.hexTheme(C.mlpThemeOf(m, h, md))).length }
      $('#co-mlp-msg', root).innerHTML = `Trained in ${Math.round(performance.now() - t0)} ms. Furthest from the picks: ${errOf(md => C.hexTheme(C.mlpThemeOf(m, hue, md)))} (8-bit units). Contrast failures: <strong class="${here ? 'bad' : 'ok'}">${here} of 16</strong> at this brand's hue, <strong class="${all ? 'bad' : 'ok'}">${all} of 576</strong> across 36 hues. Its ${m.weights.length} weights can't be told “stay readable”. Look for the <span class="co-warn">!</span> markers above.`
      render() }
    chunk()
  })
  function diff() {
    const f = (v: number) => (Math.round(v * 1000) / 1000).toString(), lines: string[] = [`<span class="hint">theme.js · constants only; the contrast lines are untouched</span>`]
    for (const m of MODES) for (const k of C.KEYS) { const a = f(before[m][k]), b = f(K(m)[k]); lines.push(a === b ? `  ${m.toUpperCase()}.${k} = ${a}` : `<span class="del">- ${m.toUpperCase()}.${k} = ${a}</span>\n<span class="add">+ ${m.toUpperCase()}.${k} = ${b}</span>`) }
    $('#co-diff', root).innerHTML = lines.join('\n')
  }
  root.querySelectorAll<HTMLButtonElement>('#co-predict .choice').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll('#co-predict .choice').forEach(x => x.setAttribute('aria-pressed', String(x === b)))
    const r = $('#co-reveal', root); r.hidden = false
    r.innerHTML = `${b.dataset.v === 'close' ? '<strong>Right.</strong>' : '<strong>No, and that\u2019s the point.</strong>'} The clamp sits between the constant and the colour, so learning can push <code>TEXT</code> as light as it likes; the colour stops at the lightest grey that still reads 4.6:1. Choose <em>Garden shop</em> and learn to see it; the table gives the ratio it lands at. (The learner may also brighten the background a little, which buys a lighter grey.)`
  }))
  syncInputs(); stats(); render()
  return { nets, get picks() { return picks }, K }
}
