// Favoritos locais: botão alternável, persistência após recarregar, filtro "Somente favoritos" e valor corrompido.
import { test, expect } from 'harness-e2e'
import { CONSOLE_MAPA, abrirExplorarSemMapa, listaDoMapa } from './suporte-mapa.mjs'

test.use({ allowConsole: CONSOLE_MAPA })

const CHAVE = 'climaponto:pontos-favoritos'
// Sem rede o mapa cai na lista de reserva: um botão por ponto localizado.
const pontosNoMapa = (page) => listaDoMapa(page).getByRole('button')
const itens = (page) => page.getByRole('main').getByRole('list').first().getByRole('listitem')
const favorito = (page, nome) => page.getByRole('button', { name: `Favorito: ${nome}` })
// "Somente favoritos" fica no Popover "Mais filtros".
const somente = (page) => page.getByRole('button', { name: 'Somente favoritos' })
async function abrirMais(page) {
  if (!(await somente(page).isVisible())) await page.getByRole('button', { name: /^Mais filtros/ }).click()
  await expect(somente(page)).toBeVisible()
  return somente(page)
}
const guardado = (page) => page.evaluate((chave) => window.localStorage.getItem(chave), CHAVE)

test('marcar na lista persiste após recarregar e só grava o código do ponto', async ({ page }) => {
  await page.goto('/pontos?vista=lista')
  await expect(itens(page)).toHaveCount(8)
  const botao = favorito(page, 'Largo da Batata')
  await expect(botao).toHaveAttribute('aria-pressed', 'false')
  await botao.click()
  await expect(botao).toHaveAttribute('aria-pressed', 'true')
  expect(JSON.parse(await guardado(page))).toEqual(['MOCK-02'])
  await page.reload()
  await expect(itens(page)).toHaveCount(8)
  await expect(favorito(page, 'Largo da Batata')).toHaveAttribute('aria-pressed', 'true')
  await favorito(page, 'Largo da Batata').click()
  await expect(favorito(page, 'Largo da Batata')).toHaveAttribute('aria-pressed', 'false')
  expect(JSON.parse(await guardado(page))).toEqual([])
})

test('ficha e lista compartilham o favorito; "Somente favoritos" vale para a lista e o mapa', async ({ page }) => {
  await abrirExplorarSemMapa(page, '/pontos?ponto=MOCK-03')
  const painel = page.getByRole('complementary', { name: 'Terminal Parque Dom Pedro II' })
  await painel.getByRole('button', { name: /^Favorito:/ }).click()
  await expect(painel.getByRole('button', { name: /^Favorito:/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(await abrirMais(page)).toHaveAttribute('aria-pressed', 'false')
  await somente(page).click()
  await expect(somente(page)).toHaveAttribute('aria-pressed', 'true')
  await expect(pontosNoMapa(page)).toHaveCount(1)
  await expect(page.getByRole('status').filter({ hasText: /^Mostrando / })).toHaveText('Mostrando 1 de 8 pontos')
  await page.getByRole('button', { name: 'Lista', exact: true }).click()
  await expect(itens(page)).toHaveCount(1)
  await expect(itens(page).first()).toContainText('MOCK-03')
  await expect(favorito(page, 'Terminal Parque Dom Pedro II').first()).toHaveAttribute('aria-pressed', 'true')
})

test('sem favoritos, o filtro mostra o estado vazio com Limpar filtros', async ({ page }) => {
  await abrirExplorarSemMapa(page, '/pontos')
  await expect(pontosNoMapa(page)).toHaveCount(8)
  await (await abrirMais(page)).click()
  await expect(page.getByText('Nenhum ponto encontrado', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Limpar filtros' }).last().click()
  await expect(pontosNoMapa(page)).toHaveCount(8)
})

test.describe('valores inválidos no localStorage', () => {
  for (const [nome, valor] of [['JSON corrompido', '{não é json'], ['não é lista', '{"a":1}']]) {
    test(`${nome}: a página abre e a lista de favoritos fica vazia`, async ({ page }) => {
      await page.addInitScript(([chave, v]) => window.localStorage.setItem(chave, v), [CHAVE, valor])
      await page.goto('/pontos?vista=lista')
      await expect(itens(page)).toHaveCount(8)
      await expect(favorito(page, 'Largo da Batata')).toHaveAttribute('aria-pressed', 'false')
      await (await abrirMais(page)).click()
      await expect(page.getByText('Nenhum ponto encontrado', { exact: true })).toBeVisible()
    })
  }

  test('itens que não são texto são ignorados e os códigos válidos são mantidos', async ({ page }) => {
    await page.addInitScript(([chave, v]) => window.localStorage.setItem(chave, v), [CHAVE, '[1,null,"MOCK-03",{},"MOCK-03"]'])
    await page.goto('/pontos?vista=lista')
    await expect(itens(page)).toHaveCount(8)
    await expect(favorito(page, 'Terminal Parque Dom Pedro II')).toHaveAttribute('aria-pressed', 'true')
  })
})
