# Search 100,000 JSON documents on the GPU

> Cheng Lou's Handwired JSON search, embedded with credit: regex matching and JSON parsing written as plain-looking JavaScript, compiled to WebGPU, timed against native RegExp, with a CPU fallback when WebGPU is missing.

Source: https://handwired.wiki/pages/gpu-search.html

<p class="lede">Write the search loop once in JavaScript-style builder code; run it on every document at once on the GPU, with the same answers.</p>

*(Interactive demo: open https://handwired.wiki/pages/gpu-search.html)*
