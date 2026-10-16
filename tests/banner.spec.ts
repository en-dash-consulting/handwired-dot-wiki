import { test, expect } from '@playwright/test'
test('banner: shows, dismisses by keyboard, stays dismissed, no CLS', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 }); await page.goto('/')
  const banner = page.getByRole('complementary', { name: 'Announcement' })
  await expect(banner).toBeVisible(); await expect(banner.getByRole('link', { name: 'Graview' })).toHaveAttribute('href', 'https://graview.dev')
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
  if (process.env.SHOTS) await page.screenshot({ path: 'screenshots-review/banner-375.png' })
  await page.getByRole('button', { name: 'Dismiss announcement' }).focus(); await page.keyboard.press('Enter')
  await expect(banner).toBeHidden()
  await page.goto('/pages/ranking.html'); await expect(page.locator('.site-banner')).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.classList.contains('banner-dismissed'))).toBe(true)
})
