#!/usr/bin/env node
// Renders public/og-image.png (1200×630) with Playwright. Favicons are En Dash's (copied from html-in-canvas-dot-dev), not generated.
import { chromium } from '@playwright/test'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const og = `<html><body style="margin:0;width:1200px;height:630px;background:#111114;color:#ececf1;font-family:Inter,system-ui,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box;position:relative;overflow:hidden">
<div style="position:absolute;right:-120px;top:-120px;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,#fb923c55,transparent 65%)"></div>
<div style="font:500 34px ui-monospace,Menlo,monospace;color:#fb923c;margin-bottom:28px">⌁ handwired.wiki</div>
<div style="font-weight:800;font-size:76px;line-height:1.05;letter-spacing:-2px;max-width:960px">Turn JavaScript into an exact, differentiable neural net</div>
<pre style="font:26px ui-monospace,Menlo,monospace;color:#b4b4c0;margin:40px 0 0;line-height:1.5">a &gt; 4 ? 10 : 12  →  relu(a − 4) − relu(a − 5)</pre>
<div style="position:absolute;bottom:44px;left:90px;font-size:24px;color:#a8a8b4">Live demos &amp; guides for Handwired by Cheng Lou · independent, by En Dash</div>
</body></html>`
const icon = s => `<html><body style="margin:0;width:${s}px;height:${s}px;background:#111114;display:flex;align-items:center;justify-content:center;border-radius:${s * .2}px"><span style="color:#fb923c;font:700 ${s * .72}px ui-monospace,Menlo,monospace;line-height:1">⌁</span></body></html>`
const browser = await chromium.launch()
const shot = async (html, w, h, file) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  await page.setContent(html); await page.screenshot({ path: join(OUT, file), omitBackground: file !== 'og-image.png' }); await page.close()
}
await shot(og, 1200, 630, 'og-image.png')
await browser.close()
console.log('og image written')
