// Pontos: lista, ponto demonstrativo, acesso ao histórico e estado de erro (modo mock).
import { test, expect } from 'harness-e2e'

const itens = (page) => page.getByRole('main').getByRole('list').first().getByRole('listitem')

test('lista os 8 pontos com código, bairro e acesso ao histórico', async ({ page }) => {
  await page.goto('/pontos')
  await expect(itens(page)).toHaveCount(8)
  for (const code of ['MOCK-01', 'MOCK-04', 'MOCK-08']) await expect(itens(page).filter({ hasText: code })).toHaveCount(1)
  await expect(itens(page).filter({ hasText: 'MOCK-02' }).getByRole('heading', { level: 2 })).toHaveText('Largo da Batata')
  await expect(itens(page).filter({ hasText: 'MOCK-08' })).toContainText('Demonstrativo')
  await expect(itens(page).filter({ hasText: 'MOCK-01' })).not.toContainText('Demonstrativo')
})

test('Ver histórico abre o histórico do ponto escolhido', async ({ page }) => {
  await page.goto('/pontos')
  await itens(page).filter({ hasText: 'MOCK-02' }).getByRole('link', { name: 'Ver histórico' }).click()
  await expect(page).toHaveURL(/\/historico\?.*ponto=MOCK-02/)
  await expect(page.getByText('Código MOCK-02')).toBeVisible()
})

test('?mock=erro: alerta com nova tentativa e nenhuma lista parcial', async ({ page }) => {
  await page.goto('/pontos?mock=erro')
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar os pontos')
  await expect(page.getByRole('link', { name: 'Ver histórico' })).toHaveCount(0)
})
