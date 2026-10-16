import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const PAGES = ['/', '/pages/ranking.html', '/pages/layout.html', '/pages/physics.html', '/pages/color-themes.html', '/pages/gpu-search.html', '/pages/js-vs-nn.html', '/pages/faq.html', '/pages/concepts.html', '/pages/getting-started.html', '/pages/gallery.html', '/pages/about.html', '/pages/why-handwired.html', '/pages/train.html', '/pages/soft-switch.html', '/pages/toggle.html', '/pages/circuit-graph.html', '/pages/compare-explorer.html']
for (const scheme of ['light', 'dark'] as const) for (const w of [375, 768, 1280]) test(`kit axe ${scheme} @${w}`, async ({ page }) => {
  test.setTimeout(180_000); await page.emulateMedia({ colorScheme: scheme }); await page.setViewportSize({ width: w, height: 900 })
  const bad: string[] = []
  for (const u of PAGES) { await page.goto(u); await page.waitForTimeout(400)
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    for (const v of r.violations) if (v.impact === 'serious' || v.impact === 'critical') bad.push(`${u} ${v.id} ${v.nodes.slice(0, 3).map(n => n.target).join(',')}`)
    if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) bad.push(`${u} horizontal overflow`) }
  expect(bad).toEqual([])
})
