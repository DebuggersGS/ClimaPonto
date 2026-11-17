// Explorar: busca, filtros combinados, painel do ponto, URL preservada e favoritos (modo mock, 1366 px).
// Sem rede o mapa cai na lista de reserva (um botão por ponto), que é a superfície verificada aqui.
import { test, expect } from 'harness-e2e'
import { CONSOLE_MAPA, abrirExplorarSemMapa, botaoDoPonto, listaDoMapa } from './suporte-mapa.mjs'

test.use({ allowConsole: CONSOLE_MAPA, viewport: { width: 1366, height: 900 } })

const CHAVE_FAVORITOS = 'climaponto:pontos-favoritos'
const pontos = (page) => listaDoMapa(page).getByRole('button')
const busca = (page) => page.getByRole('searchbox', { name: 'Buscar pontos' })
const contagem = (page) => page.getByRole('status').filter({ hasText: /^Mostrando / })
const limpar = (page) => page.getByRole('button', { name: 'Limpar filtros' })
const grupo = (page, nome) => page.getByRole('group', { name: nome })

async function abrirMais(page) {
  const bairro = page.getByRole('combobox', { name: 'Bairro' })
  if (!(await bairro.isVisible())) await page.getByRole('button', { name: /^Mais filtros/ }).click()
  await expect(bairro).toBeVisible()
  return bairro
}

test.beforeEach(async ({ page }) => {
  await abrirExplorarSemMapa(page)
  await expect(pontos(page)).toHaveCount(8)
})

test('busca por nome deixa 1 resultado e o campo é uma searchbox rotulada', async ({ page }) => {
  await expect(busca(page)).toBeVisible()
  await busca(page).fill('batata')
  await expect(pontos(page)).toHaveCount(1)
  await expect(botaoDoPonto(page, 'MOCK-02')).toBeVisible()
  await expect(contagem(page)).toContainText('Mostrando 1 de 8 pontos')
  await expect(page).toHaveURL(/q=batata/)
})

test('o painel abre com carimbo da leitura e origem, e a URL guarda o ponto', async ({ page }) => {
  await botaoDoPonto(page, 'MOCK-02').click()
  await expect(page).toHaveURL(/ponto=MOCK-02/)
  const painel = page.getByRole('complementary', { name: 'Largo da Batata' })
  await expect(painel).toBeVisible()
  await expect(painel.getByText('Carimbo da leitura')).toBeVisible()
  await expect(painel.getByText('Origem', { exact: true })).toBeVisible()
  await expect(painel).toContainText('Simulação')
  await expect(painel.getByRole('link', { name: /Ver análise detalhada/ })).toBeVisible()
})

test('filtros combinados alteram a lista e a URL; recarregar preserva; Limpar restaura', async ({ page }) => {
  await grupo(page, 'Filtrar por conectividade').getByRole('button', { name: /^Online/ }).click()
  await expect(pontos(page)).toHaveCount(5)
  await grupo(page, 'Filtrar por estado ambiental').getByRole('button', { name: /^Atenção/ }).click()
  await expect(pontos(page)).toHaveCount(1)
  await expect(botaoDoPonto(page, 'MOCK-02')).toBeVisible()
  await (await abrirMais(page)).selectOption({ label: 'Pinheiros (1)' })
  await expect(pontos(page)).toHaveCount(1)
  await expect(contagem(page)).toContainText('Mostrando 1 de 8 pontos')
  await expect(page).toHaveURL(/conexao=/)
  await expect(page).toHaveURL(/ambiente=/)
  await expect(page).toHaveURL(/bairro=/)

  const url = page.url()
  await page.reload()
  await expect(page).toHaveURL(url)
  await expect(pontos(page)).toHaveCount(1)
  await expect(grupo(page, 'Filtrar por conectividade').getByRole('button', { name: /^Online/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(grupo(page, 'Filtrar por estado ambiental').getByRole('button', { name: /^Atenção/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(await abrirMais(page)).toHaveValue(/.+/)

  await limpar(page).first().click()
  await expect(pontos(page)).toHaveCount(8)
  await expect(contagem(page)).toHaveText('Mostrando 8 de 8 pontos')
  await expect(page).not.toHaveURL(/conexao=|ambiente=|bairro=|q=/)
})

test('combinação sem resultado mostra o estado vazio com Limpar', async ({ page }) => {
  await busca(page).fill('lapa')
  await grupo(page, 'Filtrar por estado ambiental').getByRole('button', { name: /^Crítico/ }).click()
  await expect(page.getByText('Nenhum ponto encontrado', { exact: true })).toBeVisible()
  await expect(listaDoMapa(page)).toHaveCount(0)
  await limpar(page).last().click()
  await expect(pontos(page)).toHaveCount(8)
  await expect(busca(page)).toHaveValue('')
})

test('favorito persiste após recarregar e vale para "Somente favoritos"', async ({ page }) => {
  await botaoDoPonto(page, 'MOCK-03').click()
  const painel = page.getByRole('complementary', { name: 'Terminal Parque Dom Pedro II' })
  await painel.getByRole('button', { name: /^Favorito:/ }).click()
  await expect(painel.getByRole('button', { name: /^Favorito:/ })).toHaveAttribute('aria-pressed', 'true')
  expect(JSON.parse(await page.evaluate((c) => window.localStorage.getItem(c), CHAVE_FAVORITOS))).toEqual(['MOCK-03'])
  await page.reload()
  await expect(page.getByRole('complementary', { name: 'Terminal Parque Dom Pedro II' }).getByRole('button', { name: /^Favorito:/ })).toHaveAttribute('aria-pressed', 'true')
  await abrirMais(page)
  await page.getByRole('button', { name: 'Somente favoritos' }).click()
  await expect(pontos(page)).toHaveCount(1)
  await expect(botaoDoPonto(page, 'MOCK-03')).toBeVisible()
})
