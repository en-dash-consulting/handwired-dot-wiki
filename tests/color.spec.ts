import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
test('color themes: learn picks, 0 contrast failures; generic model fails', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []; page.on('pageerror', e => errors.push(String(e)))
  await page.goto('/pages/color-themes.html')
  await expect(page.locator('#demo-status')).toContainText('✓')
  const pickRatio = 'see node'
  await page.getByRole('button', { name: 'Garden shop' }).click()
  await page.getByRole('button', { name: 'as close to it as AA allows' }).click()
  await page.getByRole('button', { name: 'Learn from the picks' }).click()
  await expect(page.locator('#co-msg')).toContainText('learned', { timeout: 40_000 })
  await expect(page.locator('#co-viol')).toHaveText('0')
  const learned = await page.locator('#co-pairs').textContent()
  await page.getByRole('button', { name: 'Train the generic model' }).click()
  await expect(page.locator('#co-mlp-msg')).toContainText('Trained', { timeout: 40_000 })
  console.log('RESULT', JSON.stringify([pickRatio, await page.locator('#co-code').textContent(), await page.locator('#co-msg').textContent(), await page.locator('#co-err').textContent(), await page.locator('#co-js').textContent(), learned, await page.locator('#co-mlp-msg').textContent(), await page.locator('#co-diff').textContent()]))
  for (const p of ['Calm bank', 'Sunset studio']) { await page.locator('#co-show-mlp').uncheck(); await page.getByRole('button', { name: p }).click(); await page.getByRole('button', { name: 'Learn from the picks' }).click(); await expect(page.locator('#co-msg')).toContainText('learned', { timeout: 40_000 }); await expect(page.locator('#co-viol')).toHaveText('0'); await page.getByRole('button', { name: 'Train the generic model' }).click(); await expect(page.locator('#co-mlp-msg')).toContainText('Trained', { timeout: 40_000 }); console.log('PRESET', p, await page.locator('#co-err').textContent(), await page.locator('#co-msg').textContent(), await page.locator('#co-mlp-msg').textContent()) }
  // keyboard: colour input reachable and focusable
  await page.locator('#co-light-text').focus(); await expect(page.locator('#co-light-text')).toBeFocused()
  await page.waitForTimeout(800)
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']).analyze()
  expect(r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes.map(n => n.target).join())).toEqual([])
  expect(errors).toEqual([])
  if (process.env.SHOTS) for (const w of [390, 768, 1280]) { await page.setViewportSize({ width: w, height: 900 }); await page.locator('#co-ui').scrollIntoViewIfNeeded(); await page.screenshot({ path: `screenshots-review/color-foil-${w}.png` }) }
})
test('color themes: reduced motion learns instantly', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/pages/color-themes.html')
  await page.getByRole('button', { name: 'Learn from the picks' }).click()
  await expect(page.locator('#co-msg')).toContainText('learned', { timeout: 20_000 })
  if (process.env.SHOTS) { await page.setViewportSize({ width: 1280, height: 900 }); await page.screenshot({ path: 'screenshots-review/color-learned-1280.png' }) }
})
for (const [path, btns] of [['color-themes', ['#co-learn', '#co-mlp']], ['ranking', ['#rk-play', '#rk-reset', '#rk-play']], ['layout', ['#ly-sim', '#ly-learn', '#ly-mlp']], ['physics', ['#ph-learn', '#ph-mlp']]] as const) {
  test(`no horizontal scroll @375 after learning + foil: ${path}`, async ({ page }) => {
    test.setTimeout(60_000); await page.setViewportSize({ width: 375, height: 800 }); await page.goto(`/pages/${path}.html`)
    for (const b of btns) { await page.click(b); await page.waitForTimeout(3000) }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  })
}
