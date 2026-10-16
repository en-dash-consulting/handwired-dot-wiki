import '../lib/site'
const rk = document.querySelector<HTMLElement>('[data-uc-ranking]')
if (rk) void import('../uc/ranking-ui').then(({ mountRanking }) => { (window as unknown as { uc: unknown }).uc = mountRanking(rk) })
