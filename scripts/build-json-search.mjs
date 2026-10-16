#!/usr/bin/env node
// Adapts Cheng Lou's JSON search demo (MIT, © 2026 Cheng Lou, github.com/chenglou/handwired/tree/main/src/json-search)
// into pages/json-search-embed.html, unmodified except: the stylesheet is loaded by Vite, the "Back" link points here,
// and a credit line is added. Its worker is bundled from handwired's own demo-worker.ts into public/pages/demo-worker.js.
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
const up = 'node_modules/handwired'
let html = readFileSync(`${up}/assets/json-search.html`, 'utf8')
html = html.replace('<link rel="stylesheet" href="./json-search.css">', `<script async src="https://www.googletagmanager.com/gtag/js?id=G-DPVSE41LFK"></script>\n  <script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments)} gtag('js', new Date()); gtag('config', 'G-DPVSE41LFK');</script>\n  ` + '<meta name="robots" content="noindex" />\n  <link rel="canonical" href="https://handwired.wiki/pages/gpu-search.html" />')
  .replace('<a class="brand back" href="../">', '<a class="brand back" href="/pages/gpu-search.html" target="_top">')
  .replace('Back to demos', 'Back to the walkthrough')
  .replace(/<\/main>/, `  <p class="notes">Demo and code by <a href="https://chenglou.me" target="_top">Cheng Lou</a> (Handwired, MIT license, © 2026 Cheng Lou): <a href="https://github.com/chenglou/handwired/tree/main/src/json-search" target="_top">source</a> · <a href="https://github.com/chenglou/handwired/blob/main/LICENSE" target="_top">license</a>. Embedded unmodified by handwired.wiki.</p>\n  </main>`)
  .replace('<script type="module" src="../src/json-search/demo.ts"></script>', '<script type="module" src="/src/demos/json-search-embed.ts"></script>')
writeFileSync('pages/json-search-embed.html', html)
execSync(`npx -y esbuild@0.25.10 ${up}/src/json-search/demo-worker.ts --bundle --format=iife --minify --outfile=public/pages/demo-worker.js --log-level=warning`, { stdio: 'inherit' })
console.log('json search embed built')
