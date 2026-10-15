import { test, expect } from '@playwright/test'
import { walk } from './lesson-walk'
import AxeBuilder from '@axe-core/playwright'
test('lesson: every step, measured', async ({ page }) => {
  test.setTimeout(180_000)
  const s = await walk(page)
  await page.waitForTimeout(1200); const axe = await new AxeBuilder({ page }).analyze()
  expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id)).toEqual([])
  console.log('MEASURED', JSON.stringify({ race: s.race, landedOld: s.landedOld, learn: s.learn, vs: s.vs }))
})
test('home: hook + step 1 live above the fold', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 }); await page.goto('/')
  const box = (await page.locator('[data-step="1"] .scene').boundingBox())!
  expect(box.y).toBeLessThan(800)
  await expect(page.locator('[data-step="1"] .sc-say')).toHaveText('landed!', { timeout: 5000 })
  await expect(page.locator('a[href="/pages/js-vs-nn.html#step-2"]')).toBeVisible()
})
