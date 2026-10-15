// A side view of a cat jumping at a shelf. Pure presentation: it is told the power and what was needed.
import { h } from '../lib/svg'
import { prefersReducedMotion } from '../lib/dom'

export const TOL = 0.75 // a jump lands if the power is within 0.75 percentage points of what was needed
export type Outcome = 'land' | 'short' | 'long'
const FLOOR = 272, PX = 2.2, CAT_X = 74, SHELF_X = 292
const yOf = (cm: number) => FLOOR - cm * PX

export function createScene(svg: SVGSVGElement) {
  svg.replaceChildren()
  h('rect', { x: 0, y: 0, width: 420, height: 300, class: 'sc-bg' }, svg)
  for (let cm = 25; cm <= 100; cm += 25) { h('line', { x1: 40, x2: SHELF_X - 6, y1: yOf(cm), y2: yOf(cm), class: 'sc-grid' }, svg); h('text', { x: 44, y: yOf(cm) - 4, class: 'sc-tick' }, svg, `${cm} cm`) }
  h('rect', { x: 0, y: FLOOR, width: 420, height: 28, class: 'sc-floor' }, svg)
  h('rect', { x: 404, y: 0, width: 16, height: FLOOR, class: 'sc-wall' }, svg)
  const shelf = h('g', { class: 'sc-shelf' }, svg)
  h('rect', { x: SHELF_X, y: 0, width: 112, height: 10, rx: 3 }, shelf)
  h('rect', { x: 380, y: 10, width: 8, height: 18, class: 'sc-bracket' }, shelf)
  const shelfLabel = h('text', { x: 374, y: 24, 'text-anchor': 'end', class: 'sc-shelf-t' }, shelf)
  // power meter
  const meter = h('g', { class: 'sc-meter' }, svg)
  h('rect', { x: 10, y: yOf(100), width: 14, height: 100 * PX, rx: 7, class: 'sc-meter-bg' }, meter)
  const fill = h('rect', { x: 10, y: FLOOR, width: 14, height: 0, rx: 7, class: 'sc-meter-fill' }, meter)
  const meterT = h('text', { x: 17, y: yOf(100) - 8, 'text-anchor': 'middle', class: 'sc-meter-t' }, meter, '')
  h('text', { x: 6, y: FLOOR + 18, class: 'sc-tick' }, meter, 'jump power')
  // cat
  const cat = h('g', { class: 'sc-cat' }, svg), body = h('g', {}, cat)
  h('path', { d: 'M-20,-6 C-34,-10 -38,-26 -30,-34', class: 'sc-tail' }, body)
  const torso = h('ellipse', { cx: 0, cy: -11, rx: 22, ry: 12, class: 'sc-fur' }, body)
  h('circle', { cx: 20, cy: -24, r: 11, class: 'sc-fur' }, body)
  h('path', { d: 'M12,-31 L14,-42 L20,-33 Z M22,-33 L28,-42 L30,-30 Z', class: 'sc-fur' }, body)
  h('circle', { cx: 23, cy: -25, r: 1.8, class: 'sc-eye' }, body); h('circle', { cx: 28, cy: -25, r: 1.8, class: 'sc-eye' }, body)
  const say = h('text', { x: 0, y: 0, 'text-anchor': 'middle', class: 'sc-say' }, svg, '')
  let shelfCm = 62, heavy = false, anim = 0
  const place = (x: number, y: number, rot = 0, squash = 1) => cat.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${(heavy ? 1.18 : 1) / Math.sqrt(squash)},${(heavy ? 1.12 : 1) * squash})`)
  function setShelf(cm: number) { shelfCm = cm; shelf.setAttribute('transform', `translate(0,${yOf(cm)})`); shelfLabel.textContent = `${cm} cm` }
  function setPower(p: number | null) { const v = p ?? 0; fill.setAttribute('y', String(yOf(Math.max(0, Math.min(100, v))))); fill.setAttribute('height', String(Math.max(0, Math.min(100, v)) * PX)); meterT.textContent = p === null ? '' : `${Math.round(v * 100) / 100}%` }
  function setHeavy(b: boolean) { heavy = b; torso.setAttribute('rx', b ? '26' : '22'); place(CAT_X, FLOOR) }
  function rest() { cancelAnimationFrame(anim); say.textContent = ''; place(CAT_X, FLOOR) }
  /** Jump with `power` when the cat really needed `needed`. Resolves with the outcome. */
  function jump(power: number, needed: number): Promise<Outcome> {
    cancelAnimationFrame(anim); setPower(power)
    const miss = power - needed, out: Outcome = Math.abs(miss) <= TOL ? 'land' : miss < 0 ? 'short' : 'long'
    const reach = Math.max(4, shelfCm + miss * 1.6)
    const landX = SHELF_X + 46, apexCm = out === 'land' ? shelfCm + 14 : out === 'short' ? reach : reach + 10
    const endX = out === 'land' ? landX : out === 'short' ? SHELF_X - 14 : 392, endCm = out === 'land' ? shelfCm : out === 'short' ? reach - 6 : Math.min(118, reach + 6)
    const show = () => { say.textContent = out === 'land' ? 'landed!' : out === 'short' ? 'too weak' : 'too strong'; say.setAttribute('class', `sc-say ${out}`); say.setAttribute('x', String(out === 'land' ? landX : 230)); say.setAttribute('y', String(Math.max(20, yOf(Math.max(shelfCm, endCm)) - 54))) }
    if (prefersReducedMotion()) { if (out === 'land') place(landX, yOf(shelfCm)); else place(SHELF_X - 30, FLOOR, 0, .85); show(); return Promise.resolve(out) }
    say.textContent = ''
    return new Promise(res => {
      const t0 = performance.now(), D1 = 620, D2 = out === 'land' ? 160 : 420
      const tick = (now: number) => {
        const t = now - t0
        if (t < 140) { place(CAT_X, FLOOR, 0, 1 - 0.25 * (t / 140)) }
        else if (t < 140 + D1) {
          const u = (t - 140) / D1, x = CAT_X + (endX - CAT_X) * u
          const y0 = 0, y1 = endCm, ya = Math.max(apexCm, y0, y1)
          const cm = u < .6 ? y0 + (ya - y0) * Math.sin((u / .6) * Math.PI / 2) : ya + (y1 - ya) * (1 - Math.cos(((u - .6) / .4) * Math.PI / 2))
          place(x, yOf(cm), (u - .5) * -24, 1.08)
        } else if (t < 140 + D1 + D2) {
          const u = (t - 140 - D1) / D2
          if (out === 'land') place(endX, yOf(shelfCm), 0, 1 - 0.18 * Math.sin(u * Math.PI))
          else { const cm = endCm * (1 - u * u); place(endX - 30 * u, yOf(Math.max(0, cm)), 40 * u * (out === 'long' ? -1 : 1), 1) }
          if (u > .2) show()
        } else { if (out !== 'land') place(endX - 30, FLOOR, 0, .85); show(); res(out); return }
        anim = requestAnimationFrame(tick)
      }
      anim = requestAnimationFrame(tick)
    })
  }
  setShelf(62); setPower(null); place(CAT_X, FLOOR)
  return { setShelf, setPower, setHeavy, jump, rest, get shelf() { return shelfCm } }
}
export type Scene = ReturnType<typeof createScene>
