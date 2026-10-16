import '../lib/site'
import { setStatus } from '../lib/dom'
import { mountLayout } from '../uc/layout-ui'
const root = document.querySelector<HTMLElement>('[data-uc-layout]')
if (root) { (window as unknown as { uc: unknown }).uc = mountLayout(root); setStatus('Handwired net loaded ✓') }
