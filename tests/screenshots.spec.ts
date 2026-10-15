import { test } from '@playwright/test'
// Review screenshots (gitignored). Run: npx playwright test screenshots
const shots = [['home', '/'], ['soft-switch', '/pages/soft-switch.html'], ['train', '/pages/train.html'], ['circuit-graph', '/pages/circuit-graph.html']] as const
for (const [name, path] of shots) for (const [label, w, h] of [['mobile', 375, 812], ['tablet', 768, 1024], ['desktop', 1280, 900]] as const) {
  test(`screenshot ${name} ${label}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h })
    await page.goto(path); await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `screenshots-review/${name}-${label}.png`, fullPage: true })
  })
}
