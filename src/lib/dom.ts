export function $<T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(selector)
  if (!el) throw new Error(`missing element ${selector}`)
  return el
}
export const fmt = (n: number, digits = 4) => Number.isInteger(n) ? String(n) : n.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '')
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export function setStatus(text: string) { const s = document.getElementById('demo-status'); if (s) s.textContent = text }
