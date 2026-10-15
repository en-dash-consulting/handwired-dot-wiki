// Static markup for the home hero: a JS ternary whose tokens rewire into a ReLU network.
const N = {
  a: [110, 235], r1: [360, 160], r2: [360, 310], ab: [560, 235], hi: [700, 120], lo: [700, 350], out: [860, 235],
}
const wire = (id, [x1, y1], [x2, y2], cls = '') => {
  const mx = (x1 + x2) / 2
  const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`
  return `<path class="hw-wire ${cls}" data-w="${id}" d="${d}" pathLength="1"/><path class="hw-flow ${cls}" data-f="${id}" d="${d}"/>`
}
const node = (id, [x, y], label, sub, r = 34) => `<g class="hw-node" data-n="${id}" style="--x:${x}px;--y:${y}px">
  <circle class="hw-halo" cx="${x}" cy="${y}" r="${r + 10}"/><circle class="hw-body" cx="${x}" cy="${y}" r="${r}"/>
  <text class="hw-label" x="${x}" y="${y - 2}" text-anchor="middle">${label}</text>
  <text class="hw-val" data-v="${id}" x="${x}" y="${y + 17}" text-anchor="middle">${sub}</text></g>`
const toks = [
  ['const result = ', 40, 'kw'], ['a', 274, 'a'], [' > 4', 290, 'cmp'], [' ?', 352, 'p'], [' 10', 383, 'hi'], [' :', 430, 'p'], [' 12', 461, 'lo'],
]
// where each token flies to when the code rewires
const fly = { a: N.a, cmp: [(N.r1[0]), (N.r1[1] + N.r2[1]) / 2], hi: N.hi, lo: N.lo, p: N.out, kw: N.out }
export function heroSvg({ code = true, id = 'hero-svg', cls = 'hw-hero-svg', title = 'Animation: the JavaScript ternary a &gt; 4 ? 10 : 12 rewires into a network of two ReLUs, a difference and a select.' } = {}) {
  return `<svg class="${cls}" viewBox="0 ${code ? 0 : 70} 960 ${code ? 420 : 350}" role="img" aria-labelledby="${id}-title">
  <title id="${id}-title">${title}</title>
  <g class="hw-code">${code ? '' : '<!--'}${toks.map(([t, x, k]) => `<text class="hw-tok tok-${k}" data-k="${k}" x="${x}" y="58" style="--dx:${fly[k][0] - x - 20}px;--dy:${fly[k][1] - 52}px">${t.replace(/>/g, '&gt;').replace(/ /g, '\u00a0')}</text>`).join('')}${code ? '' : '-->'}</g>
  <g class="hw-net">
    ${wire('a-r1', N.a, N.r1)}${wire('a-r2', N.a, N.r2)}${wire('r1-ab', N.r1, N.ab)}${wire('r2-ab', N.r2, N.ab, 'neg')}
    ${wire('ab-out', N.ab, N.out)}${wire('hi-out', N.hi, N.out)}${wire('lo-out', N.lo, N.out)}
    ${node('a', N.a, 'a', '5')}${node('r1', N.r1, 'relu(a−4)', '1', 46)}${node('r2', N.r2, 'relu(a−5)', '0', 46)}
    ${node('ab', N.ab, 'above4', '1', 40)}${node('hi', N.hi, 'on', '10', 28)}${node('lo', N.lo, 'off', '12', 28)}${node('out', N.out, 'result', '10', 40)}
  </g>
  <text class="hw-note" x="430" y="405" text-anchor="middle">both branches always run — the bit picks one</text>
</svg>`
}
