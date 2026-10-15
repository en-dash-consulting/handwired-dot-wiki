import '../lib/site'
import { mountLesson } from '../cat/lesson'
import { setStatus } from '../lib/dom'
const root = document.querySelector<HTMLElement>('[data-lesson]')
if (root) { (window as unknown as { lesson: unknown }).lesson = mountLesson(root); setStatus('Handwired net loaded ✓') }
