#!/usr/bin/env node
// Generates every HTML page (index.html, pages/*.html), markdown copies (public/md),
// llms.txt, llms-full.txt and sitemap.xml from content/*.md. Run: npm run pages
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'
import { heroSvg } from './hero.mjs'
import { LESSON } from './lesson-ui.mjs'
import { RANKING, GPUSEARCH, LAYOUT, PHYSICS, COLOR } from './uc-ui.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://handwired.wiki'
export const GA = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-DPVSE41LFK"></script>
  <script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments)} gtag('js', new Date()); gtag('config', 'G-DPVSE41LFK');</script>`
const HANDWIRED_REPO = 'https://github.com/chenglou/handwired'
const NAV = ['gallery', 'why-handwired', 'concepts', 'getting-started', 'faq', 'about']
const ORDER = ['index', ...NAV, 'ranking', 'layout', 'physics', 'color-themes', 'gpu-search', 'js-vs-nn', 'soft-switch', 'compare-explorer', 'circuit-graph', 'train', 'toggle']
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const strip = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()

function parse(file) {
  const raw = readFileSync(join(ROOT, 'content', file), 'utf8')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/)
  const meta = {}; let list = null
  for (const line of m[1].split('\n')) {
    const item = line.match(/^\s+-\s+(.*)$/)
    if (item && list) { meta[list].push(JSON.parse(item[1])); continue }
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (!kv) continue
    if (kv[2] === '') { list = kv[1]; meta[list] = []; continue }
    meta[kv[1]] = kv[2].startsWith('"') ? JSON.parse(kv[2]) : kv[2]
  }
  meta.body = raw.slice(m[0].length)
  let lastmod
  try { lastmod = execSync(`git log -1 --format=%cs -- content/${file}`, { cwd: ROOT }).toString().trim() } catch {}
  meta.lastmod = lastmod || new Date().toISOString().slice(0, 10)
  return meta
}
const pages = readdirSync(join(ROOT, 'content')).filter(f => f.endsWith('.md')).map(parse)
  .sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug))
const bySlug = Object.fromEntries(pages.map(p => [p.slug, p]))
const path = slug => slug === 'index' ? '/' : `/pages/${slug}.html`
const url = slug => SITE + path(slug)
const navLabel = slug => bySlug[slug].nav

const verdict = `<div id="verdict" class="verdict exact" role="status" aria-live="polite"><p id="verdict-title" class="verdict-title">Exact match</p><p id="verdict-body" class="verdict-body"></p></div>`
const DEMOS = {
  lesson: LESSON(),
  ranking: RANKING(),
  'gpu-search': GPUSEARCH(),
  layout: LAYOUT(),
  physics: PHYSICS(),
  color: COLOR(),
  'soft-switch': `
<section class="demo demo-soft" aria-labelledby="demo-title">
  <h2 id="demo-title" class="visually-hidden">Interactive demo</h2>
  <div class="demo-top">
    <div class="code-card" aria-label="The JavaScript being replaced">
      <p class="card-kicker">your code</p>
      <pre class="big-code"><code>const a = <span id="a-val" class="tok-a">5</span>
const result = a &gt; 4
  ? <span id="code-hi" class="branch">10</span>
  : <span id="code-lo" class="branch">12</span></code></pre>
      <div class="results"><div><span class="r-label">circuit</span><output id="out-result" class="r-big">10</output></div><div><span class="r-label">plain JS</span><output id="out-js" class="r-big js">10</output></div></div>
    </div>
    <div class="circuit-card"><p class="card-kicker">turns into <span class="hand">live network</span></p>
      ${heroSvg({ code: false, id: 'circuit', cls: 'hw-hero-svg circuit-svg', title: 'Live circuit: input a feeds relu(a−4) and relu(a−5); their difference above4 selects between the on and off branch. Nodes light up with their activation.' }).replace('class="hw-hero-svg circuit-svg"', 'id="circuit" class="hw-hero-svg circuit-svg"')}
    </div>
  </div>
  ${verdict}
  <figure class="plot-fig"><svg id="plot" class="chart draggable" role="img" aria-label="Curves of relu(a−4), relu(a−5) and above4 for a from −1 to 9, with a draggable point at the current a"></svg>
  <figcaption><span class="key k-r1">relu(a − 4)</span> <span class="key k-r2">relu(a − 5)</span> <span class="key k-ab">above4 = difference</span> · drag the plot or use the slider · <span id="op-count"></span></figcaption></figure>
  <div class="controls a-controls">
    <label for="a-range">a</label>
    <input id="a-range" type="range" min="-1" max="9" step="1" value="5" />
    <output for="a-range" class="r-mid" id="a-out">5</output>
    <span class="switch-field"><input id="blend" type="checkbox" role="switch" /><label for="blend">allow in-between values <span class="hint">(see how the blend makes it differentiable)</span></label></span>
  </div>
  <div class="controls">
    <label for="hi">on branch</label><input id="hi" type="number" value="10" class="num" />
    <label for="lo">off branch</label><input id="lo" type="number" value="12" class="num" />
  </div>
</section>`,
  compare: `
<section class="demo" aria-labelledby="demo-title">
  <h2 id="demo-title" class="visually-hidden">Interactive demo</h2>
  <div class="cmp-top">
    <div id="lamp" class="lamp" aria-hidden="true"><span id="lamp-val">1</span></div>
    <div class="cmp-expr"><p class="card-kicker">emitCompare(circuit, a, rel, b)</p><p id="expr" class="r-big expr">614 &gt;= 614</p><p class="hint">JS says <output id="out-js-bit">true</output></p></div>
  </div>
  <svg id="line" class="chart draggable numline" role="img" aria-label="Number line from 0 to 1024 with draggable pins a and b"></svg>
  <div class="controls">
    <label for="a">a</label><input id="a" type="number" min="0" max="1024" value="614" class="num" />
    <label for="relation">relation</label>
    <select id="relation"><option>&gt;=</option><option>&gt;</option><option>&lt;</option><option>&lt;=</option><option>===</option></select>
    <label for="b">b</label><input id="b" type="number" min="0" max="1024" value="614" class="num" />
    <span class="switch-field"><input id="grid" type="checkbox" role="switch" checked /><label for="grid">integer grid</label></span>
  </div>
  <p class="buttons"><button type="button" class="button secondary ulp" data-dir="-1">a − 1 ULP</button><button type="button" class="button secondary ulp" data-dir="1">a + 1 ULP</button> <span class="hint">turn the grid off, then nudge a by the smallest FP32 step</span></p>
  ${verdict}
  <div class="side-by-side">
    <div class="mini"><span class="r-label">emitSelect(bit, b, a)</span><output id="out-picked" class="r-mid">614</output></div>
    <div class="mini"><span class="r-label">emitMinimumExact(a, b)</span><output id="out-min" class="r-mid">614</output></div>
  </div>
  <h3>What exactness costs</h3>
  <div class="cost"><div id="row-grid" class="cost-row"><span>with integer grid</span><span class="bar"><span id="bar-grid"></span></span><output id="cost-grid"></output></div>
  <div id="row-nogrid" class="cost-row"><span>any FP32 (sign cascade)</span><span class="bar"><span id="bar-nogrid"></span></span><output id="cost-nogrid"></output></div></div>
  <h3>Fuzz it</h3>
  <p class="buttons"><button id="fuzz" type="button" class="button">Test 5,000 random pairs</button> <output id="out-fuzz" aria-live="polite"></output></p>
  <div id="fuzz-grid" class="fuzz-grid" aria-hidden="true"></div>
</section>`,
  graph: `
<section class="demo" aria-labelledby="demo-title">
  <h2 id="demo-title" class="visually-hidden">Interactive demo</h2>
  <div class="controls">
    <label for="program">program</label>
    <select id="program">
      <option value="soft-switch">a &gt; 4 ? hi : lo</option>
      <option value="compare-grid">a &gt;= b (integer grid)</option>
      <option value="compare-nogrid">a &gt;= b (no grid)</option>
      <option value="clamp">clamp(x, lo, hi), exact</option>
    </select>
  </div>
  <pre class="big-code"><code id="js-code"></code></pre>
  <div id="graph-inputs" class="knobs"></div>
  <p class="r-mid" id="graph-result" aria-live="polite"></p>
  <p id="graph-stats" class="hint"></p>
  <div class="graph-wrap">
    <div class="graph-scroll" tabindex="0" role="region" aria-label="Circuit graph, scrollable. Tab to nodes to inspect them.">
      <svg id="graph" role="group" aria-label="Circuit graph"></svg>
    </div>
    <aside id="inspector" class="inspector" aria-live="polite" aria-label="Node inspector"></aside>
  </div>
  <details class="ops-details"><summary>All operations as text</summary><ol id="ops" class="ops"></ol></details>
</section>`,
  train: `
<section class="demo" aria-labelledby="demo-title">
  <h2 id="demo-title" class="visually-hidden">Interactive demo</h2>
  <div class="controls">
    <label for="target">target</label>
    <select id="target"><option>a &gt; 6 ? 3 : 15</option><option>ramp from 2 up to 14 between a = 3 and 7</option><option>a &gt; 2 ? 11 : 5</option></select>
    <label for="lr">learning rate</label><input id="lr" type="number" step="0.01" min="0.01" max="2" value="0.3" class="num" />
  </div>
  <p class="buttons"><button id="run" type="button" class="button" aria-pressed="false">▶ Train</button>
  <button id="step" type="button" class="button secondary">Step ×10</button>
  <button id="reset" type="button" class="button secondary">Reset to exact program</button></p>
  <figure class="plot-fig"><svg id="fit" class="chart" role="img" aria-label="Target points, the current program output, its errors, and the original exact program for a from 0 to 10"></svg>
  <figcaption><span class="key k-target">target</span> <span class="key k-ab">program now</span> <span class="key k-exact">exact starting program</span> <span class="key k-ghost">earlier steps</span></figcaption></figure>
  <div class="gauges">
    ${['t', 'k', 'hi', 'lo'].map(n => `<div class="gauge" id="g-${n}"><span class="r-label">${{ t: 'threshold t', k: 'slope k', hi: 'on value hi', lo: 'off value lo' }[n]}</span><output id="p-${n}" class="r-mid">–</output><span class="gauge-track" aria-hidden="true"><span class="gauge-exact"></span><span class="gauge-fill"></span></span><svg id="s-${n}" class="spark-svg" viewBox="0 0 120 30" aria-hidden="true"></svg></div>`).join('')}
  </div>
  <div class="side-by-side"><div class="mini"><span class="r-label">loss (MSE)</span><output id="loss" class="r-mid">–</output></div><div class="mini"><span class="r-label">steps</span><output id="steps" class="r-mid">0</output></div></div>
  <figure><svg id="loss-chart" class="chart small" role="img" aria-label="Loss over training steps, log scale"></svg></figure>
</section>`,
  toggle: `
<section class="demo" aria-labelledby="demo-title">
  <h2 id="demo-title" class="visually-hidden">Interactive demo</h2>
  <iframe class="embed" src="/pages/toggle-embed.html" title="Handwired toggle switch template (pointer operated)" loading="lazy"></iframe>
</section>`,
}

function jsonLd(p) {
  const org = { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'En Dash Consulting', url: 'https://endash.us' }
  const website = { '@type': 'WebSite', '@id': `${SITE}/#website`, name: 'handwired.wiki', url: SITE + '/', publisher: { '@id': `${SITE}/#org` }, inLanguage: 'en', description: bySlug.index.description }
  const cheng = { '@type': 'Person', '@id': `${SITE}/#chenglou`, name: 'Cheng Lou', url: 'https://chenglou.me' }
  const software = { '@type': 'SoftwareSourceCode', '@id': `${SITE}/#handwired`, name: 'Handwired', alternateName: ['handwired js', 'chenglou/handwired'],
    description: 'Turn your regular JavaScript code into a neural net; no training, exact, yet also fully differentiable.',
    codeRepository: HANDWIRED_REPO, url: 'https://chenglou.me/handwired/', author: { '@id': `${SITE}/#chenglou` }, license: 'https://opensource.org/licenses/MIT',
    programmingLanguage: ['TypeScript', 'JavaScript'], runtimePlatform: 'Bun, web browsers' }
  const crumbs = [{ name: 'Home', item: SITE + '/' }]
  if (p.type === 'demo') crumbs.push({ name: 'Gallery', item: url('gallery') })
  if (p.slug !== 'index') crumbs.push({ name: strip(p.h1), item: url(p.slug) })
  const breadcrumb = { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, ...c })) }
  const base = { '@id': `${url(p.slug)}#page`, url: url(p.slug), name: p.title, headline: strip(p.h1), description: p.description, inLanguage: 'en',
    isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': `${SITE}/#handwired` }, publisher: { '@id': `${SITE}/#org` }, dateModified: p.lastmod,
    image: `${SITE}/og-image.png` }
  let page
  if (p.type === 'home') page = { '@type': 'WebPage', ...base }
  else if (p.type === 'faq') page = { '@type': 'FAQPage', ...base, mainEntity: p.qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  else if (p.type === 'howto') page = { '@type': 'HowTo', ...base, name: strip(p.h1), step: p.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })) }
  else if (p.type === 'collection') page = { '@type': 'CollectionPage', ...base, mainEntity: { '@type': 'ItemList', itemListElement: pages.filter(x => x.type === 'demo').map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: url(d.slug), name: strip(d.h1) })) } }
  else page = { '@type': 'TechArticle', ...base, author: { '@id': `${SITE}/#org` }, proficiencyLevel: 'Beginner' }
  const graph = [website, org, cheng, software, page]
  if (p.slug !== 'index') graph.push(breadcrumb)
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 1).replace(/</g, '\\u003c')
}

function header(active) {
  const links = NAV.map(s => `<li><a href="${path(s)}"${s === active ? ' aria-current="page"' : ''}>${navLabel(s)}</a></li>`).join('')
  return `<a class="skip-link" href="#main">Skip to content</a>
  <aside class="site-banner" aria-label="Announcement"><p>New from En Dash: <a href="https://graview.dev" rel="noopener">Graview</a>, an agent-first context-graph–based app development kit</p><button type="button" class="banner-close" aria-label="Dismiss announcement"><span aria-hidden="true">×</span></button></aside>
  <header class="site-header">
    <a class="brand" href="/" aria-label="handwired.wiki home"><svg class="brand-mark hw-mark" role="img" aria-label="Handwired" width="14" height="20" viewBox="3 0 14 20"><path d="M7 2V6M7 14V18M11 10H12a4 4 0 0 1 4 4V18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle class="hw-eyelet" cx="7" cy="10" r="3" stroke-width="2"/></svg><span>handwired<span class="brand-tld">.wiki</span></span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav id="site-nav" aria-label="Main"><ul>${links}</ul></nav>
  </header>`
}
const footer = `<footer class="site-footer">
    <p><strong>handwired.wiki</strong> is an independent community resource by <a href="https://endash.us">En Dash Consulting</a>. It is not affiliated with or endorsed by Cheng Lou.</p>
    <p>Handwired © 2026 <a href="https://chenglou.me">Cheng Lou</a>, MIT license — <a href="${HANDWIRED_REPO}">github.com/chenglou/handwired</a> · <a href="https://chenglou.me/handwired/">official demos</a>.</p>
    <p><a href="/llms.txt">llms.txt</a> · <a href="/sitemap.xml">sitemap</a> · <a href="https://github.com/en-dash-consulting/handwired-dot-wiki">site source</a></p>
  </footer>`

function hero(p) {
  return `<section class="hero hero-lesson hero-uc" aria-labelledby="hero-title">
        <p class="kicker">a project by Cheng Lou · explained</p>
        <h1 id="hero-title">${p.h1}</h1>
        <p class="sub">${p.sub}</p>
      </section>
      ${RANKING(true)}`
}

function render(p) {
  let html = marked.parse(p.body.replace('<!-- demo -->', '@@DEMO@@'))
  html = html.replace(/<p>@@DEMO@@<\/p>|@@DEMO@@/, p.demo ? DEMOS[p.demo] : '')
  html = html.replace(/<pre>/g, '<pre tabindex="0">')
  html = html.replace(/<table>/g, '<div class="table-scroll" tabindex="0" role="region" aria-label="Table"><table>').replace(/<\/table>/g, '</table></div>')
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" rel="noopener"')
  if (p.type === 'faq') {
    p.qa = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>/g)].map(m => [strip(m[1]), strip(m[2])])
  }
  const crumbs = p.slug === 'index' ? '' : `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li>${p.type === 'demo' ? '<li><a href="/pages/gallery.html">Gallery</a></li>' : ''}<li aria-current="page">${p.h1}</li></ol></nav>`
  const related = p.type === 'demo' ? `<aside class="related" aria-label="More demos"><h2>More demos</h2><ul>${pages.filter(d => d.type === 'demo' && d.slug !== p.slug).map(d => `<li><a href="${path(d.slug)}">${d.h1}</a></li>`).join('')}</ul></aside>` : ''
  const script = p.demo ? `/src/demos/${p.demo === 'compare' ? 'compare' : p.demo}.ts` : '/src/pages/content.ts'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  ${GA}
  <script>try{if(localStorage.getItem('hw-banner-graview')==='dismissed')document.documentElement.classList.add('banner-dismissed')}catch(e){}</script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(p.title)}</title>
  <meta name="description" content="${esc(p.description)}" />
  <meta name="author" content="En Dash Consulting" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#121212" media="(prefers-color-scheme: dark)" />
  <link rel="canonical" href="${url(p.slug)}" />
  <link rel="alternate" type="text/markdown" href="/md/${p.slug}.md" title="Markdown version" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <meta property="og:type" content="${p.type === 'home' ? 'website' : 'article'}" />
  <meta property="og:title" content="${esc(p.title)}" />
  <meta property="og:description" content="${esc(p.description)}" />
  <meta property="og:url" content="${url(p.slug)}" />
  <meta property="og:site_name" content="handwired.wiki" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="handwired.wiki — JavaScript as an exact, differentiable neural net" />
  <meta property="og:locale" content="en_US" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(p.title)}" />
  <meta name="twitter:description" content="${esc(p.description)}" />
  <meta name="twitter:image" content="${SITE}/og-image.png" />
  <script type="application/ld+json">
${jsonLd(p)}
  </script>
</head>
<body>
  ${header(p.slug)}
  <main id="main" class="page${p.type === 'home' ? ' home' : ''}${p.demo ? ' demo-page' : ''}" tabindex="-1">
    ${crumbs}
    <article>
      ${p.type === 'home' ? hero(p) : `<h1>${p.h1}</h1>`}
      ${html}
    </article>
    ${p.demo ? '<p id="demo-status" class="status" role="status">Loading Handwired…</p>' : ''}
    ${related}
  </main>
  ${footer}
  <script type="module" src="${script}"></script>
</body>
</html>
`
}

mkdirSync(join(ROOT, 'pages'), { recursive: true })
mkdirSync(join(ROOT, 'public/md'), { recursive: true })
for (const p of pages) {
  writeFileSync(join(ROOT, p.slug === 'index' ? 'index.html' : `pages/${p.slug}.html`), render(p).replace(/<pre(?![^>]*tabindex)/g, "<pre tabindex=\"0\""))
  const md = `# ${strip(p.h1)}\n\n> ${p.description}\n\nSource: ${url(p.slug)}\n\n${p.body.replace('<!-- demo -->', `*(Interactive demo: open ${url(p.slug)})*`)}`
  writeFileSync(join(ROOT, `public/md/${p.slug}.md`), md)
}
// sitemap
writeFileSync(join(ROOT, 'public/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${url(p.slug)}</loc><lastmod>${p.lastmod}</lastmod><changefreq>${p.slug === 'index' ? 'weekly' : 'monthly'}</changefreq><priority>${p.slug === 'index' ? '1.0' : p.type === 'demo' ? '0.7' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`)
// llms.txt
const line = p => `- [${strip(p.h1)}](${url(p.slug)}): ${p.description} (markdown: ${SITE}/md/${p.slug}.md)`
writeFileSync(join(ROOT, 'public/llms.txt'), `# handwired.wiki

> Independent learning resource and live demo gallery for Handwired, Cheng Lou's open-source project that turns regular JavaScript code into a neural net: no training, exact, yet fully differentiable, runnable in a browser without a GPU. Cheng Lou's handwired repo: ${HANDWIRED_REPO} (MIT) and https://chenglou.me/handwired/.

Key facts:
- Handwired programs are fixed lists of FP32 operations: weighted sums (circuit.affine), products with a ReLU (circuit.reglu), boolean rounding (circuit.boolean) and table reads (circuit.indexRead).
- You write builder code (ordinary JavaScript that runs once and appends operations to a Circuit); no tool converts existing JavaScript source automatically.
- Example: \`a > 4 ? 10 : 12\` becomes \`above4 = relu(a - 4) - relu(a - 5); result = above4 * 10 + (1 - above4) * 12\`.
- Not published to npm; clone the repo and use Bun, or depend on it via git ("github:chenglou/handwired#<commit>").
- handwired.wiki is not affiliated with Cheng Lou; it is run by En Dash Consulting (https://endash.us).

## Guides
${pages.filter(p => !p.demo && p.slug !== 'faq').map(line).join('\n')}

## Interactive demos
${pages.filter(p => p.demo).map(line).join('\n')}

## FAQ
${line(bySlug.faq)}

## Optional
- [llms-full.txt](${SITE}/llms-full.txt): every page's full text in one file
- [Official handwired docs](${HANDWIRED_REPO}/tree/main/docs)
`)
writeFileSync(join(ROOT, 'public/llms-full.txt'), `# handwired.wiki — full text\n\n> All pages of handwired.wiki as markdown, for one-shot ingestion. Independent resource about Handwired by Cheng Lou (${HANDWIRED_REPO}).\n\n` +
  pages.map(p => `---\n\n# ${strip(p.h1)}\n\nURL: ${url(p.slug)}\n\n${p.body.replace('<!-- demo -->', '*(Interactive demo on the page.)*').replace(/<[^>]+>/g, '')}`).join('\n\n'))
console.log(`built ${pages.length} pages`)
