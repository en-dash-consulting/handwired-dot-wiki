# Unfreeze & train

> Interactive demo: start from an exact handwired program, unfreeze its threshold, slope and branch values, and fit new targets by gradient descent using Handwired's backpropagateReference.

Source: https://handwired.wiki/pages/train.html

<p class="lede">This program starts as the exact soft switch (<code>t = 4, k = 1, hi = 10, lo = 12</code>). Its constants live in cells, so <code>circuit.backpropagateReference</code> gives their gradients. Pick a target and train.</p>

*(Interactive demo: open https://handwired.wiki/pages/train.html)*

## What is being trained?

The circuit computes `s = clamp(k × (a − t), 0, 1)` with two ReLUs, then `y = s × hi + (1 − s) × lo` with `emitSelect`. Each step evaluates 21 sample points, backpropagates the squared error, and moves `t`, `k`, `hi` and `lo` by plain gradient descent.

## Why does the threshold sometimes get stuck?

Gradients only reach `t` and `k` where the ramp is between 0 and 1; outside it the ReLUs are flat. That's the general rule from [handwired's own notes](https://github.com/chenglou/handwired): exact decisions have zero slope, continuous quantities train well. Handwired's own Learned gallery trains a much larger network (244 coefficients) with Adam.
