// Pontos (vista Lista; o mapa é o padrão e tem spec próprio): lista, ponto demonstrativo, acesso ao histórico e estado de erro (modo mock).
import { test, expect, snap, settle } from 'harness-e2e'

const itens = (page) => page.getByRole('main').getByRole('list').first().getByRole('listitem')

test('lista os 8 pontos com código, bairro e acesso ao histórico', async ({ page }) => {
  await page.goto('/pontos?vista=lista')
  await expect(itens(page)).toHaveCount(8)
  for (const code of ['MOCK-01', 'MOCK-04', 'MOCK-08']) await expect(itens(page).filter({ hasText: code })).toHaveCount(1)
  await expect(itens(page).filter({ hasText: 'MOCK-02' }).getByRole('heading', { level: 2 })).toHaveText('Largo da Batata')
  await expect(itens(page).filter({ hasText: 'MOCK-08' })).toContainText('Demonstrativo')
  await expect(itens(page).filter({ hasText: 'MOCK-01' })).not.toContainText('Demonstrativo')
})

test('Ver histórico abre o histórico do ponto escolhido', async ({ page }) => {
  await page.goto('/pontos?vista=lista')
  await itens(page).filter({ hasText: 'MOCK-02' }).getByRole('link', { name: 'Ver histórico' }).click()
  await expect(page).toHaveURL(/\/historico\?.*ponto=MOCK-02/)
  await expect(page.getByText('Código MOCK-02')).toBeVisible()
})

test('?mock=erro: alerta com nova tentativa e nenhuma lista parcial', async ({ page }) => {
  await page.goto('/pontos?mock=erro')
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar os pontos')
  await expect(page.getByRole('link', { name: 'Ver histórico' })).toHaveCount(0)
})

test('?mock=lento: status de carregamento visível e depois a lista', async ({ page }) => {
  await page.goto('/pontos?vista=lista&mock=lento')
  await expect(page.getByRole('status').filter({ hasText: 'Carregando pontos…' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver histórico' })).toHaveCount(0)
  await expect(itens(page)).toHaveCount(8, { timeout: 15_000 })
  await expect(page.getByRole('status').filter({ hasText: 'Carregando pontos…' })).toHaveCount(0)
})

test('?mock=erro: a nova tentativa é visível e acionável', async ({ page }) => {
  await page.goto('/pontos?mock=erro')
  const alerta = page.getByRole('alert')
  await expect(alerta.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await alerta.getByRole('button', { name: 'Tentar novamente' }).click()
  // o modo mock continua falhando: o alerta permanece e nenhuma lista parcial aparece
  await expect(alerta).toContainText('Não foi possível carregar os pontos')
  await expect(page.getByRole('link', { name: 'Ver histórico' })).toHaveCount(0)
})

const VPS = [['mobile', { width: 375, height: 812 }], ['desktop', { width: 1366, height: 900 }]]
for (const [vpNome, vp] of VPS) {
  test(`snap dos estados de carregamento e erro de Pontos (${vpNome})`, async ({ page }, testInfo) => {
    await page.setViewportSize(vp)
    await page.goto('/pontos?mock=lento')
    await expect(page.getByRole('status').filter({ hasText: 'Carregando pontos…' })).toBeVisible()
    await snap(page, testInfo, `estado-carregando-pontos-${vpNome}`)
    await page.goto('/pontos?mock=erro')
    await expect(page.getByRole('alert')).toContainText('Não foi possível carregar os pontos')
    await settle(page)
    await snap(page, testInfo, `estado-erro-pontos-${vpNome}`)
  })
}
