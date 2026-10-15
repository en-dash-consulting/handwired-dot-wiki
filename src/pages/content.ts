import '../lib/site'
const root = document.querySelector<HTMLElement>('.jsnn')
if (root) void import('../jsnn/demo').then(({ mountJsnn }) => { (window as unknown as { jsnn: unknown }).jsnn = mountJsnn(root) })
