const NS = 'http://www.w3.org/2000/svg'
export function h<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, parent?: Element, text?: string): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
  if (text !== undefined) el.textContent = text
  parent?.appendChild(el)
  return el
}
export type Scale = { (v: number): number, invert: (px: number) => number }
export function scale([d0, d1]: [number, number], [r0, r1]: [number, number]): Scale {
  const f = ((v: number) => r0 + (v - d0) / (d1 - d0) * (r1 - r0)) as Scale
  f.invert = px => d0 + (px - r0) / (r1 - r0) * (d1 - d0)
  return f
}
export const pathOf = (pts: [number, number][], sx: Scale, sy: Scale) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('')
/** Pointer x in SVG user units. */
export function svgX(svg: SVGSVGElement, e: PointerEvent) {
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
  return pt.matrixTransform(svg.getScreenCTM()!.inverse()).x
}
export function axes(g: SVGGElement, sx: Scale, sy: Scale, xt: number[], yt: number[], w: [number, number], hgt: [number, number]) {
  for (const t of yt) { h('line', { x1: w[0], x2: w[1], y1: sy(t), y2: sy(t), class: t === 0 ? 'ax zero' : 'ax' }, g); h('text', { x: w[0] - 8, y: sy(t) + 4, 'text-anchor': 'end', class: 'tick' }, g, String(t)) }
  for (const t of xt) h('text', { x: sx(t), y: hgt[1] + 20, 'text-anchor': 'middle', class: 'tick' }, g, String(t))
}
