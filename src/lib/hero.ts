// Home hero: code → network rewiring loop. Values are computed by the real Handwired circuit.
import { buildSoftSwitch, evaluate } from './programs'
import { prefersReducedMotion } from './dom'

export function mountHero() {
  const found = document.querySelector<SVGSVGElement>('.hw-hero-svg')
  if (!found) return
  const svg: SVGSVGElement = found
  const built = buildSoftSwitch()
  const o = built.outputs
  const q = (s: string) => svg.querySelector(s)
  const setVal = (id: string, v: number) => { const t = q(`[data-v="${id}"]`); if (t) t.textContent = String(+v.toFixed(2)) }
  const lit = (id: string, act: number) => { const n = q(`[data-n="${id}"]`) as SVGGElement | null; if (!n) return; n.classList.toggle('lit', act > 0); n.style.setProperty('--act', String(Math.min(1, act))) }
  const hot = (id: string, on: boolean) => { q(`[data-w="${id}"]`)?.classList.toggle('hot', on); q(`[data-f="${id}"]`)?.classList.toggle('hot', on) }
  function show(a: number) {
    const v = evaluate(built, { a, hi: 10, lo: 12 })
    const r1 = v[o.r1!]!, r2 = v[o.r2!]!, ab = v[o.above4!]!, res = v[o.result!]!
    setVal('a', a); setVal('r1', r1); setVal('r2', r2); setVal('ab', ab); setVal('out', res)
    lit('a', 1); lit('r1', r1); lit('r2', r2); lit('ab', ab); lit('hi', ab); lit('lo', 1 - ab); lit('out', 1)
    hot('a-r1', r1 > 0); hot('a-r2', r2 > 0); hot('r1-ab', r1 > 0); hot('r2-ab', r2 > 0); hot('ab-out', ab > 0); hot('hi-out', ab > 0); hot('lo-out', ab === 0)
    svg.querySelector('.tok-hi')?.classList.toggle('on', ab === 1); svg.querySelector('.tok-hi')?.classList.toggle('off', ab === 0)
    svg.querySelector('.tok-lo')?.classList.toggle('on', ab === 0); svg.querySelector('.tok-lo')?.classList.toggle('off', ab === 1)
  }
  if (prefersReducedMotion()) { svg.classList.add('wired'); show(5); return }
  const seq = [3, 4, 5, 6, 7, 2]
  let i = 0
  const cycle = () => {
    svg.classList.remove('wired', 'rewiring'); show(5)
    setTimeout(() => svg.classList.add('rewiring'), 1400)
    setTimeout(() => { svg.classList.add('wired'); svg.classList.remove('rewiring') }, 2300)
    const run = setInterval(() => show(seq[i++ % seq.length]!), 1100)
    setTimeout(() => { clearInterval(run); cycle() }, 14000)
  }
  // Pause when off-screen to save CPU.
  cycle()
}
