import { test, expect, type Page } from '@playwright/test'
type St = { pretrained: number, hwExact: number, mlpExact: number, checked: number, hwFitAt: number, mlpFitAt: number, hwSteps: number, mlpSteps: number, training: boolean, viol: { js: number, hw: number, mlp: number }, exportMatch: number, hwErr: number }
const st = (page: Page) => page.evaluate(() => (window as unknown as { jsnn: St }).jsnn)

for (const url of ['/pages/js-vs-nn.html', '/']) test(`js vs nn, all three beats, measured (${url})`, async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto(url)
  const root = page.locator('.jsnn')
  await expect(root).toHaveAttribute('data-exact', 'done', { timeout: 30_000 })
  let s = await st(page)
  expect(s.checked).toBe(6401); expect(s.hwExact).toBe(6401); expect(s.mlpExact).toBeLessThan(6401)
  await expect(root.locator('.col.hw [data-st="exact"] dd')).toHaveText('6,401 / 6,401')
  console.log('beat1', JSON.stringify({ mlpExact: s.mlpExact, viol: s.viol }), await root.locator('[data-say]').textContent())

  await root.locator('[data-beat="2"]').click()
  await root.locator('[data-train]').click()
  await expect.poll(async () => (await st(page)).training, { timeout: 90_000 }).toBe(false)
  s = await st(page)
  console.log('beat2', JSON.stringify(s), await root.locator('[data-say]').textContent())
  expect(s.hwFitAt).toBeGreaterThan(0); expect(s.viol.hw).toBe(0); expect(s.viol.js).toBe(0)
  if (s.mlpFitAt > 0) expect(s.hwFitAt).toBeLessThan(s.mlpFitAt)

  // keyboard: drag an invoice with arrows, both retrain
  const inv = root.locator('circle.inv').nth(5); await inv.focus(); await page.keyboard.press('Shift+ArrowUp')
  await expect.poll(async () => (await st(page)).training, { timeout: 90_000 }).toBe(false)
  expect((await st(page)).viol.hw).toBe(0)

  await root.locator('[data-beat="3"]').click()
  await expect(root.locator('[data-diff]')).toBeVisible()
  s = await st(page); expect(s.exportMatch).toBe(6401)
  await expect(root.locator('[data-export]')).toContainText('6,401 / 6,401')
})
