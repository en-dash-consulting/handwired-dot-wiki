---
slug: js-vs-nn
title: "JS vs Neural Net: One Rule as Plain JS, a Handwired Net and a Trained Net | handwired.wiki"
nav: false
h1: "JS vs neural net: the same rule, three ways"
description: "Live side-by-side: a shipping-price rule as plain JavaScript, as an exact Handwired neural net, and as a generic neural net trained to copy it. Exactness, retraining on new data with hard rules intact, and readable learned constants, all measured in your browser."
type: demo
demo: jsnn
---
<p class="lede">Handwired turns the JS rule into a neural net with exactly the same answers. Because it's a net, you can train it on new data. And because it's still your code, what it learns reads as JS.</p>

<!-- demo -->

## What is each column?

**Plain JS** is the source shown, run with `new Function`. **The Handwired net** is the same rule written with Handwired's builder (`affine`, `multiply`, `emitCompare` for `kg > HEAVY`, `emitClampExact` for the min/max): 41 operations whose source cells hold `BASE`, `PER_KG` and `SURCHARGE`. **The generic net** is a 1 → 16 → 1 ReLU network (65 operations, 49 weights), also run on the Handwired runtime so both nets use the same evaluator, backprop and Adam loop. It starts from seed 7 and trains for 2,500 steps on random weights between 0 and 100 kg priced by the JS rule.

## What does each step measure?

1. **Exactness.** Every parcel weight from 0 to 100 kg in 1/64 kg steps (6,401 inputs) runs through all three. An answer counts as a match only if it equals the JS number exactly, with no tolerance. The weights are on a 1/64 grid and the constants are whole cents, so float32 represents every intermediate value exactly. That's why the Handwired net matches the float64 JS bit for bit.
2. **Change the prices.** Thirteen invoices from the carrier's new price list appear. Plain JS has no gradients, so it stays where it was. *Unfreeze & train* runs Adam on both nets with the same loss (mean squared error on the invoices). Only `BASE`, `PER_KG` and `SURCHARGE` unfreeze; `HEAVY` and `CAP` stay frozen, and the clamp is still an exact min/max. So the Handwired net can't return less than $0 or more than $60. The generic net has no such structure. **Breaks a hard rule** counts how many of the 6,401 outputs fall below −1¢ or above $60.01.
3. **Read it.** The Handwired net's learned weights are the program's constants, so they print as a JS diff. The page rounds them to whole cents, re-runs the 6,401-input check on the exported JS against the net with those constants, and reports the match count. The generic net's 49 numbers have no such reading.

## Where is the honest fine print?

- The Handwired net is shaped like the rule, so of course it fits a change in the rule's own constants quickly. That is the point: you start from code you already trust. It would not learn an unrelated pattern; drag the invoices into a shape the rule can't express and its error stays above zero.
- Gradients cannot move `HEAVY`: a comparison is flat almost everywhere, as upstream's docs explain. That's why it stays frozen.
- The generic net's step count depends on its seed, size and learning rate. We use one fixed setup (seed 7, 16 hidden units, Adam with lr 0.02, then 0.004 after step 1,500; fine-tuning at 0.01) and report what that run does. You could also bolt a clamp onto it. Handwired's point is that you get that clamp by writing the rule, not by designing a model.
- Exactness holds for the inputs and constants above. With arbitrary fractional constants, float32 and JS's float64 can differ in the last bits; upstream's [execution model](https://github.com/chenglou/handwired/blob/main/docs/execution-model.md) covers that.
