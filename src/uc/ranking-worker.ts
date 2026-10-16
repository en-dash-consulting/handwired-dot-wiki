// Trains the generic 6→8→1 model off the main thread, then measures it on the same test lists.
import { evalNet } from './common'
import * as R from './ranking'
self.onmessage = (e: MessageEvent<{ seed: number, clicks: R.Click[] }>) => {
  const list = R.results(e.data.seed), mlp = R.mlpRanker(11), steps = 600, t0 = performance.now()
  const tr = R.clickTrainer(mlp, list, e.data.clicks, 0.01, mlp.weights.map(() => 1))
  for (let s = 0; s < steps; s++) { tr.step(); if (s % 60 === 0) postMessage({ progress: s / steps }) }
  const ms = performance.now() - t0, f = (it: R.Item) => evalNet(mlp, R.featsOf(it))[mlp.out[0]!]!
  const test = R.testLists(1000, 7), br = R.ruleBreaks(f, test)
  postMessage({ order: R.order(list, f), ...br, top3: R.top3Rate(f, test), weights: mlp.weights.length, steps, ms })
}
