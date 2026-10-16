import '../lib/site'
import { setStatus } from '../lib/dom'
const gpu = document.getElementById('gs-gpu')!
const has = 'gpu' in navigator && !!(navigator as { gpu?: unknown }).gpu
gpu.textContent = has ? 'Your browser has WebGPU, so the demo below runs the search on your GPU.' : 'Your browser has no WebGPU. The demo below still works: it runs the same programs on the CPU, as generated JavaScript, and says so. The GPU speed-up won\u2019t show here; try Chrome or Edge on a recent machine.'
document.querySelectorAll<HTMLButtonElement>('#gs-predict .choice').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#gs-predict .choice').forEach(x => x.setAttribute('aria-pressed', String(x === b)))
  document.getElementById('gs-reveal')!.hidden = false
}))
setStatus('Page ready ✓')
