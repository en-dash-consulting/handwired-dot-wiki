import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
test('physics: learns constants, new throw follows, foil off', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []; page.on('pageerror', e => errors.push(String(e)))
  await page.goto('/pages/physics.html')
  await expect(page.locator('#demo-status')).toContainText('✓')
  await page.getByRole('button', { name: 'Learn from the recording' }).click()
  await expect(page.locator('#ph-msg')).toContainText('learned', { timeout: 40_000 })
  await page.getByRole('button', { name: 'Yes, closely' }).click()
  await page.getByRole('button', { name: 'Train the generic model' }).click()
  await expect(page.locator('#ph-mlp-msg')).toContainText('Trained', { timeout: 40_000 })
  await page.getByRole('button', { name: 'Throw a new ball' }).click()
  await expect(page.locator('#ph-floor')).toHaveText('0')
  console.log('RESULT', await page.locator('#ph-code').textContent(), await page.locator('#ph-msg').textContent(), await page.locator('#ph-fit').textContent(), await page.locator('#ph-js').textContent(), await page.locator('#ph-new-msg').textContent(), await page.locator('#ph-mlp-msg').textContent())
  await page.waitForTimeout(800)
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes.map(n => n.target).join())).toEqual([])
  expect(errors).toEqual([])
  if (process.env.SHOTS) for (const w of [390, 1280]) { await page.setViewportSize({ width: w, height: 900 }); await page.locator('#ph-svg').scrollIntoViewIfNeeded(); await page.screenshot({ path: `screenshots-review/physics-newthrow-${w}.png` }) }
})
