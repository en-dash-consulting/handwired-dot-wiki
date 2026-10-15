import { test } from '@playwright/test'
// Review screenshots (gitignored). Run: npx playwright test screenshots
const sizes = [['mobile', 375, 812], ['desktop', 1280, 900]] as const
const shots = [['home', '/'], ['gallery', '/pages/gallery.html'], ['soft-switch', '/pages/soft-switch.html'], ['train', '/pages/train.html']] as const
for (const [name, path] of shots) for (const [label, w, h] of sizes) {
  test(`screenshot ${name} ${label}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(path); await page.waitForLoadState('networkidle')
    if (name === 'home') await page.locator('.jsnn[data-exact="done"]').waitFor({ timeout: 30_000 })
    await page.screenshot({ path: `screenshots-review/${name}-${label}.png`, fullPage: true })
  })
}
for (const [label, w, h] of sizes) test(`screenshot js-vs-nn beats ${label}`, async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: w, height: h })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/pages/js-vs-nn.html')
  const root = page.locator('.jsnn'); await root.locator('[data-exact="done"], :scope[data-exact="done"]').or(page.locator('.jsnn[data-exact="done"]')).first().waitFor({ timeout: 30_000 })
  await page.screenshot({ path: `screenshots-review/js-vs-nn-1-exact-${label}.png`, fullPage: true })
  await root.locator('[data-beat="2"]').click(); await root.locator('[data-train]').click()
  await page.locator('.jsnn[data-training="done"]').waitFor({ timeout: 90_000 })
  await page.screenshot({ path: `screenshots-review/js-vs-nn-2-trained-${label}.png`, fullPage: true })
  await root.locator('[data-beat="3"]').click()
  await page.screenshot({ path: `screenshots-review/js-vs-nn-3-read-${label}.png`, fullPage: true })
})
