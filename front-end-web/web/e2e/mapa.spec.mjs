// Explorar (mapa): vista padrão, alternância Mapa/Lista, filtros, estados e acessibilidade (modo mock).
// O gate roda sem rede: o OpenFreeMap é abortado e o mapa cai na lista de reserva (determinística).
// O mapa carregado (MapLibre) é coberto em explorar-mapa.spec.mjs.
import { test, expect, snap, settle, horizontalOverflow, obscuredElements, axeViolations, keyboardWalk } from 'harness-e2e'
import { CONSOLE_MAPA, abrirExplorarSemMapa, avisoMapa, botaoDoPonto, listaDoMapa } from './suporte-mapa.mjs'

test.use({ allowConsole: CONSOLE_MAPA })

const DESKTOP = { width: 1366, height: 900 }
const MOBILE = { width: 375, height: 812 }

const mapa = (page) => page.getByRole('figure', { name: 'Mapa dos pontos de ônibus' })
const marcadores = (page) => listaDoMapa(page).getByRole('button')
const marcador = (page, codigo) => botaoDoPonto(page, codigo)
const contagem = (page) => page.getByRole('status').filter({ hasText: /^Mostrando / })
const busca = (page) => page.getByRole('searchbox', { name: 'Buscar pontos' })

async function abrir(page, url = '/pontos') {
  await abrirExplorarSemMapa(page, url)
  await expect(marcadores(page)).toHaveCount(8)
}

test('o mapa é a vista padrão; sem rede, a lista de reserva tem 8 pontos focáveis com estado em texto', async ({ page }) => {
  await abrir(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Explorar pontos' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mapa', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(avisoMapa(page)).toContainText('Os pontos continuam disponíveis na lista abaixo')
  // sem mapa carregado não há figura enganosa nem grade falsa
  await expect(mapa(page)).toHaveCount(0)
  await expect(marcador(page, 'MOCK-02')).toContainText('Largo da Batata')
  await expect(marcador(page, 'MOCK-02')).toContainText(/Normal|Atenção|Crítico/)
  await expect(marcador(page, 'MOCK-04')).toContainText('Sem dados')
  await expect(marcador(page, 'MOCK-06')).toContainText('Offline')
  await marcador(page, 'MOCK-03').focus()
  await expect(marcador(page, 'MOCK-03')).toBeFocused()
  // todos têm posição própria: sem seção "Sem localização" no conjunto de demonstração
  await expect(page.getByRole('heading', { name: 'Sem localização' })).toHaveCount(0)
})

test('alternância Mapa/Lista refletida na URL; a lista preserva cartões, selos e link de Histórico', async ({ page }) => {
  await abrir(page)
  await page.getByRole('button', { name: 'Lista', exact: true }).click()
  await expect(page).toHaveURL(/vista=lista/)
  const itens = page.getByRole('main').getByRole('list').first().getByRole('listitem')
  await expect(itens).toHaveCount(8)
  await expect(itens.filter({ hasText: 'MOCK-08' })).toContainText('Demonstrativo')
  await expect(itens.filter({ hasText: 'MOCK-02' }).getByRole('link', { name: 'Ver histórico' })).toBeVisible()
  await expect(itens.filter({ hasText: 'MOCK-04' })).toContainText('Sem dados')
  await expect(avisoMapa(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Mapa', exact: true }).click()
  await expect(page).not.toHaveURL(/vista=/)
  await expect(avisoMapa(page)).toBeVisible()
  await expect(marcadores(page)).toHaveCount(8)
})

test('busca e filtros valem para o mapa, com contagem e Limpar', async ({ page }) => {
  await abrir(page)
  await page.getByRole('button', { name: /^Mais filtros/ }).click()
  await page.getByRole('combobox', { name: 'Bairro' }).selectOption({ label: 'Pinheiros (1)' })
  await expect(marcadores(page)).toHaveCount(1)
  await expect(marcador(page, 'MOCK-02')).toBeVisible()
  await expect(contagem(page)).toContainText('Mostrando 1 de 8 pontos')
  await page.getByRole('combobox', { name: 'Bairro' }).selectOption({ label: 'Todos os bairros' })
  await page.getByRole('group', { name: 'Filtrar por conectividade' }).getByRole('button', { name: /^Offline/ }).click()
  await expect(marcadores(page)).toHaveCount(1)
  await expect(marcador(page, 'MOCK-06')).toBeVisible()
  await busca(page).fill('zzz-inexistente')
  await expect(page.getByText('Nenhum ponto encontrado', { exact: true })).toBeVisible()
  await expect(listaDoMapa(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Limpar filtros' }).last().click()
  await expect(marcadores(page)).toHaveCount(8)
  await expect(contagem(page)).toHaveText('Mostrando 8 de 8 pontos')
})

test('única requisição externa permitida é a tentativa interceptada ao OpenFreeMap', async ({ page }) => {
  // Antes: "nenhum host externo". O mapa real busca estilo e blocos em tiles.openfreemap.org; o teste
  // aceita só esse host (interceptado e abortado) e continua reprovando qualquer outro host externo
  // (CDN, fontes, analytics, Supabase).
  const externos = []
  page.on('request', (request) => {
    const { hostname, protocol } = new URL(request.url())
    if (['http:', 'https:'].includes(protocol) && !['127.0.0.1', 'localhost'].includes(hostname)) externos.push(hostname)
  })
  await abrir(page)
  await marcador(page, 'MOCK-01').click()
  expect(externos.filter((host) => host !== 'tiles.openfreemap.org')).toEqual([])
})

test('?mock=erro: mensagem de erro e nova tentativa, sem mapa', async ({ page }) => {
  await page.goto('/pontos?mock=erro')
  const alerta = page.getByRole('alert')
  await expect(alerta).toContainText('Não foi possível carregar os pontos')
  await expect(alerta.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await expect(mapa(page)).toHaveCount(0)
  await expect(listaDoMapa(page)).toHaveCount(0)
})

test('?mock=lento: carregamento visível e nenhum mapa vazio enganoso', async ({ page }) => {
  await page.goto('/pontos?mock=lento')
  await expect(page.getByRole('status').filter({ hasText: 'Carregando pontos…' })).toBeVisible()
  await expect(mapa(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Mapa', exact: true })).toBeVisible({ timeout: 15_000 })
})

test('teclado: botões da lista de reserva entram na ordem de tabulação com foco visível', async ({ page }) => {
  await abrir(page)
  const ordem = await keyboardWalk(page, 70)
  expect(ordem.filter((x) => /\(MOCK-\d+\)/.test(x.name ?? '')).length).toBeGreaterThanOrEqual(8)
  expect(ordem.every((x) => x.visible && x.outline)).toBe(true)
})

for (const [nome, vp] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  test(`${nome}: sem rolagem lateral nem sobreposição; capturas claro e escuro`, async ({ page }, testInfo) => {
    await page.setViewportSize(vp)
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await abrir(page)
      await settle(page)
      expect(await horizontalOverflow(page)).toEqual([])
      expect(await obscuredElements(page)).toEqual([])
      await snap(page, testInfo, `pontos-mapa-${nome}-${colorScheme}`)
    }
  })
}

for (const colorScheme of ['light', 'dark']) {
  test(`axe-core: mapa (reserva) e lista (tema ${colorScheme})`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await abrir(page)
    await settle(page)
    expect(await axeViolations(page)).toEqual([])
    await page.getByRole('button', { name: 'Lista', exact: true }).click()
    await expect(page.getByRole('main').getByRole('list').first().getByRole('listitem')).toHaveCount(8)
    await settle(page)
    const v = await axeViolations(page)
    await testInfo.attach(`axe-pontos-lista-${colorScheme}`, { body: JSON.stringify(v, null, 2), contentType: 'application/json' })
    expect(v).toEqual([])
  })
}
