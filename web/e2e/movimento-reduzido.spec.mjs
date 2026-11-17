// AC8: com prefers-reduced-motion: reduce, o conteúdo entra sem deslocamento, sem animações finitas em
// andamento e os gráficos não animam o traçado. As medições são feitas logo após a renderização (sem settle).
import { test, expect } from 'harness-e2e'

const PAGES = [
  ['Dashboard', '/', (page) => page.getByRole('region', { name: 'Resumo', exact: true })],
  ['Histórico', '/historico?ponto=MOCK-01&periodo=24h', (page) => page.getByRole('table')],
  ['Pontos', '/pontos?vista=lista', (page) => page.getByRole('link', { name: 'Ver histórico' }).first()],
]

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

for (const [nome, rota, pronto] of PAGES) {
  test(`${nome}: sem translação nem animação finita em execução`, async ({ page }) => {
    await page.goto(rota)
    await expect(pronto(page)).toBeVisible()
    const r = await page.evaluate(() => {
      const deslocados = [...document.querySelectorAll('main *')].flatMap((el) => {
        const t = getComputedStyle(el).transform
        const m = t && t !== 'none' && t.match(/matrix\(([^)]+)\)/)
        if (!m) return []
        const [, , , , tx, ty] = m[1].split(',').map(Number)
        return Math.abs(tx) > 0.5 || Math.abs(ty) > 0.5 ? [`${el.tagName.toLowerCase()} tx=${tx} ty=${ty}`] : []
      })
      const animacoes = document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.playState === 'running')
        .map((a) => a.animationName || a.id || a.constructor.name)
      return { deslocados, animacoes }
    })
    expect(r.deslocados, `${nome}: elementos com translação`).toEqual([])
    expect(r.animacoes, `${nome}: animações finitas em execução`).toEqual([])
  })
}

const GRAFICOS = [
  ['Dashboard', '/', (page) => page.getByRole('tabpanel', { name: 'Evolução (24 h)' })],
  ['Histórico', '/historico?ponto=MOCK-01&periodo=24h', (page) => page.getByRole('region', { name: 'Evolução' })],
]

for (const [nome, rota, regiao] of GRAFICOS) {
  test(`${nome}: linhas dos gráficos não animam o traçado`, async ({ page }) => {
    await page.goto(rota)
    const linha = regiao(page).getByRole('figure', { name: 'Temperatura (°C)' }).locator('svg path.recharts-area-curve').first()
    await expect(linha).toBeVisible()
    const amostra = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('main svg path.recharts-area-curve')].map((p) => {
          const cs = getComputedStyle(p)
          return { d: p.getAttribute('d'), dasharray: cs.strokeDasharray, dashoffset: cs.strokeDashoffset }
        }),
      )
    const a = await amostra()
    expect(a.length, `${nome}: nenhuma linha encontrada`).toBeGreaterThan(0)
    await page.waitForTimeout(150)
    expect(await amostra(), `${nome}: traçado mudou entre amostras`).toEqual(a)
  })
}
