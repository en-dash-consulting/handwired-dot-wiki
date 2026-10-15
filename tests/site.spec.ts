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

test('soft switch: exact at integers, framed blend when allowed', async ({ page }) => {
  await page.goto('/pages/soft-switch.html')
  for (const [a, want] of [['3', '12'], ['4', '12'], ['5', '10'], ['9', '10']] as const) {
    await page.fill('#a-range', a)
    await expect(page.locator('#out-result')).toHaveText(want)
    await expect(page.locator('#out-js')).toHaveText(want)
    await expect(page.locator('#verdict-title')).toHaveText('Exact match')
  }
  // the slider snaps to whole numbers while blending is off
  await expect(page.locator('#a-range')).toHaveAttribute('step', '1')
  await expect(page.locator('#verdict-title')).toHaveText('Exact match')
  await page.check('#blend')
  await page.fill('#a-range', '4.5')
  await expect(page.locator('#out-result')).toHaveText('11')
  await expect(page.locator('#verdict-title')).toHaveText('In-between, on purpose')
  await expect(page.locator('#circuit .hw-node.lit')).not.toHaveCount(0)
})

test('soft switch: dragging the plot moves a', async ({ page }) => {
  await page.goto('/pages/soft-switch.html')
  await page.locator('#plot').scrollIntoViewIfNeeded()
  const box = (await page.locator('#plot').boundingBox())!
  await page.mouse.click(box.x + box.width * 0.2, box.y + box.height / 2)
  await expect(page.locator('#out-result')).toHaveText('12')
})

test('compare explorer: fuzz finds no mismatches, ULP nudges stay exact', async ({ page }) => {
  await page.goto('/pages/compare-explorer.html')
  for (const rel of ['>=', '>', '===']) {
    await page.selectOption('#relation', rel)
    await page.click('#fuzz')
    await expect(page.locator('#out-fuzz')).toContainText('5,000 random pairs (20% equal): 0 mismatches', { timeout: 15000 })
  }
  await page.uncheck('#grid')
  await page.fill('#a', '614'); await page.fill('#b', '614')
  await page.selectOption('#relation', '>')
  await expect(page.locator('#lamp-val')).toHaveText('0')
  await page.click('.ulp[data-dir="1"]')
  await expect(page.locator('#lamp-val')).toHaveText('1')
  await expect(page.locator('#verdict-title')).toHaveText('Exact match')
  await page.click('#fuzz')
  await expect(page.locator('#out-fuzz')).toContainText(': 0 mismatches', { timeout: 15000 })
})

test('graph renders operations for every program', async ({ page }) => {
  await page.goto('/pages/circuit-graph.html')
  for (const v of ['soft-switch', 'compare-grid', 'compare-nogrid', 'clamp']) {
    await page.selectOption('#program', v)
    expect(await page.locator('#ops li').count()).toBeGreaterThan(1)
    expect(await page.locator('#graph rect').count()).toBeGreaterThan(2)
  }
  await page.selectOption('#program', 'soft-switch')
  await page.fill('#in-a', '3')
  await expect(page.locator('#graph-result')).toContainText('result = 12')
  await page.locator('#graph .gnode').first().focus()
  await expect(page.locator('#inspector')).toContainText('input cell')
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
  await expect(page.locator('#lamp-val')).toHaveText('1')
  await expect(page.locator('#out-picked')).toHaveText('7')
})
