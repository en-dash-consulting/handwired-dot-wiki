import { test } from '@playwright/test'
import { walk } from './lesson-walk'
// Review screenshots (gitignored). Run: SHOTS=1 npx playwright test screenshots
for (const [label, w, h] of [['mobile', 390, 844], ['desktop', 1280, 860]] as const) {
  test(`screenshot lesson ${label}`, async ({ page }) => {
    test.skip(!process.env.SHOTS, 'set SHOTS=1')
    test.setTimeout(240_000)
    await page.setViewportSize({ width: w, height: h })
    process.env.SHOTS_TAG = label; await walk(page, `-${label}`)
  })
  test(`screenshot home ${label}`, async ({ page }) => {
    test.skip(!process.env.SHOTS, 'set SHOTS=1')
    await page.setViewportSize({ width: w, height: h }); await page.goto('/'); await page.waitForTimeout(1500)
    await page.screenshot({ path: `screenshots-review/home-${label}.png` })
  })
}
