import '../lib/site'
import { setStatus } from '../lib/dom'
window.addEventListener('message', e => { if (e.data?.handwired === 'toggle-ready') setStatus('Handwired template loaded ✓') })
