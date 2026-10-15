import '../lib/site'
import { mountJsnn } from '../jsnn/demo'
import { setStatus } from '../lib/dom'
const root = document.querySelector<HTMLElement>('.jsnn')
if (root) { (window as unknown as { jsnn: unknown }).jsnn = mountJsnn(root); setStatus('Handwired net loaded ✓') }
