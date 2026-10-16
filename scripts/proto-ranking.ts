import * as R from '/Users/nick/development/endash/handwired.wiki/src/uc/ranking.ts'
import { evalNet, getW } from '/Users/nick/development/endash/handwired.wiki/src/uc/common.ts'
const list = R.results(42), js = R.compileJs(R.GUT), net = R.buildRanker(); R.WEIGHTS.forEach((k, i) => net.src[net.weights[i]!] = R.GUT[k])
const netF = (it: R.Item) => evalNet(net, R.featsOf(it))[net.out[0]!]!
const tests = R.testLists(2000, 7)
let same = 0; for (const L of tests) if (R.order(L, js).join() === R.order(L, netF).join()) same++
console.log('same order', same, '/', tests.length, 'score eq', tests.flat().every(it => js(it) === netF(it)))
console.log('gut top3', R.top3Rate(js, tests), 'hidden top3', R.top3Rate(it => R.utility(it), tests), R.ruleBreaks(js, tests))
const clicks = R.shoppers(list, R.order(list, js), 1000, 3)
const tr = R.clickTrainer(net, list, clicks, 0.15, [1, 1, 1, 1], [[0, 20], [0, 20], [0, 20], [0, 20]])
let t = performance.now(); for (let s = 0; s < 300; s++) { const l = tr.step(); if (s % 60 == 0) console.log(s, l.toFixed(4), getW(net).map(v => v.toFixed(2)).join(' ')) }
console.log('hw ms', (performance.now() - t).toFixed(0), 'top3', R.top3Rate(netF, tests), R.ruleBreaks(netF, tests))
const mlp = R.mlpRanker(11), mF = (it: R.Item) => evalNet(mlp, R.featsOf(it))[mlp.out[0]!]!
const tm = R.clickTrainer(mlp, list, clicks, 0.01, mlp.weights.map(() => 1))
t = performance.now(); for (let s = 0; s < 600; s++) tm.step()
console.log('mlp ms', (performance.now() - t).toFixed(0), 'top3', R.top3Rate(mF, tests), R.ruleBreaks(mF, tests))
