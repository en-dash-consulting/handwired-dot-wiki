import '../lib/site'
import { setStatus } from '../lib/dom'
import { mountColor } from '../uc/color-ui'
const root = document.querySelector<HTMLElement>('[data-uc-color]')
if (root) { (window as unknown as { uc: unknown }).uc = mountColor(root); setStatus('Handwired net loaded ✓') }
