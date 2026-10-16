import '../lib/site'
import { setStatus } from '../lib/dom'
import { mountPhysics } from '../uc/physics-ui'
const root = document.querySelector<HTMLElement>('[data-uc-physics]')
if (root) { (window as unknown as { uc: unknown }).uc = mountPhysics(root); setStatus('Handwired net loaded ✓') }
