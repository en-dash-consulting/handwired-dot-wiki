import '../styles/main.css'
import '../styles/toggle.css'
// Smoke test: Handwired is consumed as a pinned git dependency (raw TS sources, no npm build).
import { mountToggle } from 'handwired/template/toggle.ts'

const status = document.getElementById('hw-status')
try {
  mountToggle()
  if (status) status.textContent = 'Handwired loaded ✓ — toggle is running as a compiled circuit.'
} catch (err) {
  if (status) status.textContent = `Handwired failed to load: ${String(err)}`
  throw err
}
