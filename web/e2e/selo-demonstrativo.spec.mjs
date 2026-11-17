// O selo "Demonstrativo" aparece no cabeçalho de toda rota pública (o modo mock só tem dados demonstrativos).
import { test, expect } from 'harness-e2e'
import { CONSOLE_MAPA, mapaSemRede } from './suporte-mapa.mjs'

test.use({ allowConsole: CONSOLE_MAPA })
test.beforeEach(async ({ page }) => mapaSemRede(page))

const ROTAS = ['/', '/pontos', '/pontos/MOCK-01', '/analises', '/historico', '/laboratorio', '/relatorios', '/rota-que-nao-existe']

for (const [nome, viewport] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 375, height: 812 }]]) {
  test(`selo Demonstrativo visível em todas as rotas públicas (${nome})`, async ({ page }) => {
    await page.setViewportSize(viewport)
    for (const rota of ROTAS) {
      await page.goto(rota)
      const selo = page.getByRole('banner').getByText('Demonstrativo').first()
      await expect(selo, rota).toBeVisible()
    }
  })
}
