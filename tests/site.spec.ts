import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readdirSync } from 'node:fs'

const pages = ['/', ...readdirSync('pages').filter(f => f.endsWith('.html')).map(f => `/pages/${f}`)]
const demos = ['soft-switch', 'compare-explorer', 'circuit-graph', 'train', 'toggle']

for (const scheme of ['light', 'dark'] as const) {
  for (const path of pages) {
    test(`axe ${scheme}: ${path}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
      const bad = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
      expect(bad.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([])
    })
  }
}

for (const width of [375, 768, 1280]) {
  for (const path of pages) {
    test(`no horizontal scroll @${width}: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
}

test('mobile nav opens with keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Menu' })
  await toggle.focus(); await page.keyboard.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'FAQ' })).toBeVisible()
})

for (const d of demos) {
  test(`demo loads Handwired: ${d}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(String(e)))
    await page.goto(`/pages/${d}.html`)
    await expect(page.locator('#demo-status')).toContainText('✓')
    expect(errors).toEqual([])
  })
}

test('soft switch matches JS at integers and blends at 4.5', async ({ page }) => {
  await page.goto('/pages/soft-switch.html')
  for (const [a, want] of [['3', '12'], ['4', '12'], ['5', '10'], ['9', '10']] as const) {
    await page.fill('#a-num', a)
    await expect(page.locator('#out-result')).toHaveText(want)
    await expect(page.locator('#out-agree')).toContainText('Matches')
  }
  await page.fill('#a-num', '4.5')
  await expect(page.locator('#out-result')).toHaveText('11')
})

test('compare explorer: fuzz finds no mismatches with and without grid', async ({ page }) => {
  await page.goto('/pages/compare-explorer.html')
  for (const rel of ['>=', '>', '===']) {
    await page.selectOption('#relation', rel)
    await page.click('#fuzz')
    await expect(page.locator('#out-fuzz')).toContainText(': 0 mismatches')
  }
  await page.uncheck('#grid')
  await page.fill('#a', '614.0001'); await page.fill('#b', '614')
  await page.selectOption('#relation', '>')
  await expect(page.locator('#out-bit')).toHaveText('1')
  await page.click('#fuzz')
  await expect(page.locator('#out-fuzz')).toContainText(': 0 mismatches')
})

test('graph renders operations for every program', async ({ page }) => {
  await page.goto('/pages/circuit-graph.html')
  for (const v of ['soft-switch', 'compare-grid', 'compare-nogrid', 'clamp']) {
    await page.selectOption('#program', v)
    expect(await page.locator('#ops li').count()).toBeGreaterThan(1)
    expect(await page.locator('#graph rect').count()).toBeGreaterThan(2)
  }
})

test('training reduces loss', async ({ page }) => {
  await page.goto('/pages/train.html')
  const before = Number(await page.locator('#loss').textContent())
  for (let i = 0; i < 20; i++) await page.click('#step')
  const after = Number(await page.locator('#loss').textContent())
  expect(after).toBeLessThan(before * 0.5)
})

test('toggle flips on press and release', async ({ page }) => {
  await page.goto('/pages/toggle.html')
  const frame = page.frameLocator('iframe.embed')
  const track = frame.locator('.track')
  await expect(track).toHaveAttribute('aria-checked', 'false')
  await track.click()
  await expect(track).toHaveAttribute('aria-checked', 'true')
})

test('getting-started snippet output is correct', async ({ page }) => {
  await page.goto('/pages/compare-explorer.html')
  await page.fill('#a', '7'); await page.fill('#b', '3'); await page.selectOption('#relation', '>=')
  await expect(page.locator('#out-bit')).toHaveText('1')
  await expect(page.locator('#out-picked')).toHaveText('7')
})
