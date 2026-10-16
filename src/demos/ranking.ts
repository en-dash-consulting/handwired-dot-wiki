import '../lib/site'
import { setStatus } from '../lib/dom'
import { mountRanking } from '../uc/ranking-ui'
const root = document.querySelector<HTMLElement>('[data-uc-ranking]')
if (root) { (window as unknown as { uc: unknown }).uc = mountRanking(root); setStatus('Handwired net loaded ✓') }
