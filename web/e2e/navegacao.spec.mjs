// Navegação, modo de dados e estrutura comum (ClimaPonto, modo mock: VITE_DATA_MODE=mock).
import { test, expect, snap, settle } from 'harness-e2e'

const PAGES = [
  ['Dashboard', '/', 'Dashboard · ClimaPonto'],
  ['Pontos', '/pontos', 'Pontos · ClimaPonto'],
  ['Histórico', '/historico', 'Histórico · ClimaPonto'],
]

test('navegação principal leva a cada página, com título e link ativo', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Navegação principal' })
  for (const [nome, rota, titulo] of PAGES) {
    await nav.getByRole('link', { name: nome, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${rota === '/' ? '/$' : rota + '$'}`))
    await expect(page).toHaveTitle(titulo)
    await expect(page.getByRole('heading', { level: 1, name: nome })).toBeVisible()
    await expect(nav.getByRole('link', { name: nome, exact: true })).toHaveAttribute('aria-current', 'page')
  }
  await page.getByRole('link', { name: 'ClimaPonto' }).click()
  await expect(page).toHaveTitle('Dashboard · ClimaPonto')
})

test('modo mock é sinalizado em todas as páginas e o Supabase não é consultado', async ({ page }) => {
  const externas = []
  page.on('request', (r) => /supabase/i.test(r.url()) && externas.push(r.url()))
  for (const [, rota] of PAGES) {
    await page.goto(rota)
    await expect(page.getByText('Modo de dados: Modo demonstração')).toBeVisible()
    await expect(page.getByRole('note', { name: 'Aviso sobre os dados' })).toContainText('Nenhuma medição real e nenhuma consulta ao Supabase')
  }
  expect(externas).toEqual([])
})

test('rota inexistente mostra a página de não encontrado dentro do layout', async ({ page }) => {
  await page.goto('/rota-que-nao-existe')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible()
})

test('404: título, explicação e link de volta ao Dashboard', async ({ page }) => {
  await page.goto('/rota-que-nao-existe')
  await expect(page).toHaveTitle('Página não encontrada · ClimaPonto')
  await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible()
  await expect(page.getByRole('main')).toContainText('Este endereço não existe')
  await expect(page.getByRole('main')).toContainText('O link pode estar incorreto ou a página foi movida.')
  await page.getByRole('main').getByRole('link', { name: 'Voltar para o Dashboard' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
})

for (const [vpNome, vp] of [['mobile', { width: 375, height: 812 }], ['desktop', { width: 1366, height: 900 }]]) {
  test(`snap da página 404 (${vpNome})`, async ({ page }, testInfo) => {
    await page.setViewportSize(vp)
    await page.goto('/rota-que-nao-existe')
    await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible()
    await settle(page)
    await snap(page, testInfo, `estado-404-${vpNome}`)
  })
}
