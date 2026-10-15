const NS = 'http://www.w3.org/2000/svg'
export type Series = { points: [number, number][], className: string, kind?: 'line' | 'dots' }
export function plot(svg: SVGSVGElement, series: Series[], x: [number, number], y: [number, number], marker?: number) {
  const W = 600, H = 260, P = 34
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
  const sx = (v: number) => P + (v - x[0]) / (x[1] - x[0]) * (W - 2 * P)
  const sy = (v: number) => H - P - (v - y[0]) / (y[1] - y[0]) * (H - 2 * P)
  svg.replaceChildren()
  const g = (tag: string, attrs: Record<string, string | number>, text?: string) => {
    const el = document.createElementNS(NS, tag)
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
    if (text) el.textContent = text
    svg.appendChild(el); return el
  }
  g('line', { x1: P, y1: H - P, x2: W - P, y2: H - P, class: 'axis' })
  g('line', { x1: P, y1: P, x2: P, y2: H - P, class: 'axis' })
  const ticks = 5
  for (let i = 0; i <= ticks; i++) {
    const vx = x[0] + (x[1] - x[0]) * i / ticks, vy = y[0] + (y[1] - y[0]) * i / ticks
    g('text', { x: sx(vx), y: H - P + 18, 'text-anchor': 'middle', class: 'tick' }, String(+vx.toFixed(2)))
    g('text', { x: P - 6, y: sy(vy) + 4, 'text-anchor': 'end', class: 'tick' }, String(+vy.toFixed(2)))
  }
  if (marker !== undefined) g('line', { x1: sx(marker), y1: P, x2: sx(marker), y2: H - P, class: 'marker' })
  for (const s of series) {
    if (s.kind === 'dots') for (const [px, py] of s.points) g('circle', { cx: sx(px), cy: sy(py), r: 3.5, class: s.className })
    else g('path', { d: s.points.map(([px, py], i) => `${i ? 'L' : 'M'}${sx(px).toFixed(1)},${sy(py).toFixed(1)}`).join(''), class: s.className, fill: 'none' })
  }
}
