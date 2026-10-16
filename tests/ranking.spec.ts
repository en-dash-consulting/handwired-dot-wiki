import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('ranking: shoppers stream in, both learn, only the generic net breaks rules', async ({ page }) => {
  test.setTimeout(120_000)
  const errors: string[] = []; page.on('pageerror', e => errors.push(String(e)))
  await page.goto('/pages/ranking.html')
  await expect(page.locator('#demo-status')).toContainText('✓')
  await page.getByRole('button', { name: 'Always the same' }).click()
  await expect(page.locator('#rk-reveal')).toContainText('1,000 of 1,000')
  const before = await page.locator('#rk-hw-top3').textContent()
  await page.getByRole('button', { name: '+1 shopper' }).click()
  await expect(page.locator('#rk-ticker')).toContainText('Shopper 1 of 1,000')
  await page.getByRole('button', { name: /Let 1,000 shoppers in/ }).click()
  await page.waitForTimeout(2500)
  if (process.env.SHOTS) for (const w of [390, 1280]) { await page.setViewportSize({ width: w, height: 900 }); await page.locator('.rk2').scrollIntoViewIfNeeded(); await page.screenshot({ path: `screenshots-review/ranking2-midway-${w}.png` }) }
  await expect(page.locator('#rk-explain')).toContainText('Done', { timeout: 90_000 })
  await expect(page.locator('#rk-hw-pin')).toHaveClass('ok'); await expect(page.locator('#rk-hw-oos')).toHaveClass('ok')
  await expect(page.locator('#rk-mlp-pin')).toHaveClass('bad')
  const after = await page.locator('#rk-hw-top3').textContent()
  console.log('RESULT', JSON.stringify([before, after, await page.locator('#rk-mlp-top3').textContent(), await page.locator('#rk-code').textContent(), await page.locator('#rk-explain').textContent(), await page.locator('#rk-mlp-pin').textContent(), await page.locator('#rk-mlp-oos').textContent()]))
  expect(parseFloat(after!)).toBeGreaterThan(parseFloat(before!) + 20)
  await expect(page.locator('#rk-diff')).toContainText('+ W_FRESH')
  await page.waitForTimeout(800)
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes.map(n => n.target).join())).toEqual([])
  expect(errors).toEqual([])
  if (process.env.SHOTS) for (const w of [390, 1280]) { await page.setViewportSize({ width: w, height: 900 }); await page.locator('.rk2').scrollIntoViewIfNeeded(); await page.screenshot({ path: `screenshots-review/ranking2-done-${w}.png` }) }
})

test('home: ranking above the fold; keyboard play; reduced motion finishes instantly', async ({ page }) => {
  for (const w of [390, 1280]) {
    await page.setViewportSize({ width: w, height: w > 400 ? 800 : 844 }); await page.goto('/')
    await expect(page.getByRole('button', { name: /Let 1,000 shoppers in/ })).toBeInViewport()
    if (process.env.SHOTS) await page.screenshot({ path: `screenshots-review/home2-${w}.png` })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload()
  await page.getByRole('button', { name: /Let 1,000 shoppers in/ }).focus(); await page.keyboard.press('Enter')
  await expect(page.locator('#rk-explain')).toContainText('Done', { timeout: 60_000 })
  await expect(page.locator('#rk-hw-oos')).toHaveClass('ok')
})
