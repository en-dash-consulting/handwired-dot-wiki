# Toggle switch template

> Upstream Handwired's template app running live: a toggle switch whose hit testing, arming and spring animation are one numeric program, checked against plain JavaScript.

Source: https://handwired.wiki/pages/toggle.html

<p class="lede">This is Handwired's <code>template/</code> app, imported unmodified from the pinned upstream commit. Press and release on the switch: hit testing, arming and the thumb's spring all run as one program.</p>

*(Interactive demo: open https://handwired.wiki/pages/toggle.html)*

## What happens on each frame?

Event handlers queue pointer events with timestamps. Each frame `advanceFrame` plans evaluations — one per event timestamp, settle checks every 64 ms of simulated time, one at the frame — and the host writes the spring's step-matrix power into cells before evaluating. The DOM is written only from output numbers.

## Is it keyboard accessible?

Not yet: upstream's template is pointer-driven (it acts on press and release). Upstream notes a keyboard shortcut can queue an event through the same path; this embed shows the template as-is.
