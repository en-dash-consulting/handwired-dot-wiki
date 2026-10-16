import { test, expect } from '@playwright/test'
test('gpu search embed runs upstream demo (CPU fallback ok)', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []; page.on('pageerror', e => errors.push(String(e)))
  await page.goto('/pages/json-search-embed.html')
  await expect(page.locator('#status')).toContainText(/ms/, { timeout: 60_000 })
  console.log('STATUS', await page.locator('#status').textContent(), '| NOTICE', await page.locator('#notice').textContent())
  expect(errors).toEqual([])
  await page.goto('/pages/gpu-search.html')
  await expect(page.locator('#gs-gpu')).not.toContainText('Checking')
  if (process.env.SHOTS) { await page.setViewportSize({ width: 1280, height: 900 }); await page.locator('iframe').scrollIntoViewIfNeeded(); await page.waitForTimeout(4000); await page.screenshot({ path: 'screenshots-review/gpu-search-1280.png' }) }
})
