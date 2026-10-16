import { test, expect } from '@playwright/test'
import { walk } from './lesson-walk'
import AxeBuilder from '@axe-core/playwright'
test('lesson: every step, measured', async ({ page }) => {
  test.setTimeout(180_000)
  const s = await walk(page)
  await page.waitForTimeout(1200); const axe = await new AxeBuilder({ page }).analyze()
  expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes.map(n => n.target + ' ' + n.failureSummary).join(' | '))).toEqual([])
  console.log('MEASURED', JSON.stringify({ race: s.race, landedOld: s.landedOld, learn: s.learn, vs: s.vs }))
})
