// Runs handwired's own template app unmodified (pinned git dependency).
import { mountToggle } from 'handwired/template/toggle.ts'
mountToggle()
const track = document.querySelector('.track')!, state = document.getElementById('state')!
new MutationObserver(() => { state.textContent = `Switch is ${track.getAttribute('aria-checked') === 'true' ? 'on' : 'off'} — computed by one Handwired program.` })
  .observe(track, { attributes: true, attributeFilter: ['aria-checked'] })
window.parent.postMessage({ handwired: 'toggle-ready' }, '*')
