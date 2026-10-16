import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('ranking: exact, learns, rules hold; generic model breaks them', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []; page.on('pageerror', e => errors.push(String(e)))
  await page.goto('/pages/ranking.html')
  await expect(page.locator('#demo-status')).toContainText('✓')
  await page.getByRole('button', { name: 'Always the same' }).click()
  await expect(page.locator('#rk-reveal')).toContainText('1,000 / 1,000')
  const before = await page.locator('#rk-top3').textContent()
  await page.getByRole('button', { name: 'Simulate 1,000 shoppers' }).click()
  await page.getByRole('button', { name: 'Learn from the clicks' }).click()
  await expect(page.locator('#rk-learn-msg')).toContainText('learned', { timeout: 30_000 })
  await expect(page.locator('#rk-pin')).toHaveText('✓'); await expect(page.locator('#rk-oos')).toHaveText('0')
  const after = await page.locator('#rk-top3').textContent()
  expect(parseFloat(after!)).toBeGreaterThan(parseFloat(before!) + 20)
  await expect(page.locator('#rk-diff')).toContainText('+ const W_FRESH')
  await page.getByRole('button', { name: 'Train the generic model' }).click()
  await expect(page.locator('#rk-mlp-msg')).toContainText('trained', { timeout: 60_000 })
  expect(parseInt((await page.locator('#rk-mlp-pin').textContent())!.replace(/,/g, ''))).toBeGreaterThan(0)
  console.log('RESULT', before, after, await page.locator('#rk-learn-msg').textContent(), await page.locator('#rk-code').textContent(), await page.locator('#rk-mlp-pin').textContent(), await page.locator('#rk-mlp-oos').textContent(), await page.locator('#rk-mlp-top3').textContent(), await page.locator('#rk-mlp-msg').textContent())
  await page.waitForTimeout(1200)
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes.map(n => n.target).join())).toEqual([])
  expect(errors).toEqual([])
  if (process.env.SHOTS) for (const w of [390, 1280]) { await page.setViewportSize({ width: w, height: 900 }); await page.screenshot({ path: `screenshots-review/ranking-done-${w}.png`, fullPage: true }) }
})

test('home: ranking live above the fold, keyboard learnable', async ({ page }) => {
  for (const w of [390, 1280]) {
    await page.setViewportSize({ width: w, height: w > 400 ? 800 : 844 })
    await page.goto('/')
    await expect(page.locator('#rk-list li').first()).toBeInViewport()
    await expect(page.getByRole('button', { name: 'Simulate 1,000 shoppers' })).toBeAttached()
    if (process.env.SHOTS) await page.screenshot({ path: `screenshots-review/home-uc-${w}.png` })
  }
  await page.getByRole('button', { name: 'Simulate 1,000 shoppers' }).focus(); await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Learn from the clicks' }).focus(); await page.keyboard.press('Enter')
  await expect(page.locator('#rk-learn-msg')).toContainText('learned', { timeout: 30_000 })
  await expect(page.locator('#rk-oos')).toHaveText('0')
})
