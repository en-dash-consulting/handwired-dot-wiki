import '../styles/main.css'
const toggle = document.querySelector<HTMLButtonElement>('.nav-toggle')
const nav = document.getElementById('site-nav')
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true'
    toggle.setAttribute('aria-expanded', String(open))
    nav.classList.toggle('open', open)
  })
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { toggle.click(); toggle.focus() }
  })
}
