import '../lib/site'
const root = document.querySelector<HTMLElement>('[data-home-lesson]')
if (root) void import('../cat/lesson').then(({ mountLesson }) => { (window as unknown as { lesson: unknown }).lesson = mountLesson(root, { home: true }) })
