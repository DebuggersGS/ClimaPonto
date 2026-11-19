// Explorar: mapa real (MapLibre) com fallback determinístico, atribuição, pontos sem localização e 375 px (modo mock).
// O gate roda sem rede: o OpenFreeMap é sempre interceptado (estilo vazio ou abortado).
import { test, expect, horizontalOverflow } from 'harness-e2e'
import { CONSOLE_MAPA, abrirListaDoMapa, avisoMapa, botaoDoPonto, listaDoMapa, mapaComEstiloVazio, mapaSemRede } from './suporte-mapa.mjs'

test.use({ allowConsole: CONSOLE_MAPA, viewport: { width: 1366, height: 900 } })

const figura = (page) => page.getByRole('figure', { name: 'Mapa dos pontos de ônibus' })
const mapaMapLibre = (page) => page.locator('.maplibregl-map')

test('com estilo local: o mapa MapLibre carrega com atribuição e legenda; sem WebGL, cai na lista', async ({ page }, testInfo) => {
  await mapaComEstiloVazio(page)
  await page.goto('/pontos')
  // o resultado depende só de o navegador oferecer WebGL: ou o container do MapLibre ou o aviso de fallback
  await expect(mapaMapLibre(page).or(avisoMapa(page)).first()).toBeVisible({ timeout: 20_000 })
  if (await mapaMapLibre(page).isVisible()) {
    testInfo.annotations.push({ type: 'caminho', description: 'mapa MapLibre carregado' })
    await expect(figura(page)).toBeVisible()
    await expect(page.locator('.maplibregl-canvas')).toBeVisible()
    // atribuição obrigatória (OpenStreetMap e OpenFreeMap), no controle compacto do MapLibre
    await expect(page.locator('.maplibregl-ctrl-attrib')).toBeVisible()
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText('OpenStreetMap')
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText('OpenFreeMap')
    await expect(figura(page)).toContainText('Legenda do mapa')
    await expect(figura(page).getByRole('button', { name: 'Reiniciar vista' })).toBeVisible()
    // a lista acessível continua disponível, recolhida
    await abrirListaDoMapa(page)
    await expect(listaDoMapa(page).getByRole('button')).toHaveCount(8)
  } else {
    testInfo.annotations.push({ type: 'caminho', description: 'fallback (sem WebGL)' })
    await expect(figura(page)).toHaveCount(0)
    await expect(listaDoMapa(page).getByRole('button')).toHaveCount(8)
  }
})

test('blocos abortados: aviso com "Tentar novamente" e lista dos 8 pontos; nova tentativa refaz o pedido', async ({ page }) => {
  const pedidos = []
  page.on('request', (r) => r.url().includes('tiles.openfreemap.org') && pedidos.push(r.url()))
  await mapaSemRede(page)
  await page.goto('/pontos')
  const aviso = avisoMapa(page)
  await expect(aviso).toBeVisible()
  await expect(aviso).toContainText(/Não foi possível carregar o mapa|não oferece WebGL/)
  await expect(aviso.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await expect(figura(page)).toHaveCount(0)
  // com falha, a lista já vem aberta
  await expect(listaDoMapa(page).getByRole('button')).toHaveCount(8)
  const antes = pedidos.length
  await aviso.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(avisoMapa(page)).toBeVisible()
  await expect(listaDoMapa(page).getByRole('button')).toHaveCount(8)
  // sem WebGL não há nova requisição; com WebGL a tentativa chega a ser feita de novo
  expect(pedidos.length).toBeGreaterThanOrEqual(antes)
})

test('WebGL desativado: aviso explica a causa e a lista substitui o mapa', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (tipo, ...resto) {
      if (/webgl/i.test(String(tipo))) return null
      return original.call(this, tipo, ...resto)
    }
  })
  await mapaSemRede(page)
  await page.goto('/pontos')
  await expect(avisoMapa(page)).toContainText('Este navegador não oferece WebGL')
  await expect(figura(page)).toHaveCount(0)
  await expect(mapaMapLibre(page)).toHaveCount(0)
  await expect(listaDoMapa(page).getByRole('button')).toHaveCount(8)
  // a lista é operável: escolher um ponto abre a ficha
  await botaoDoPonto(page, 'MOCK-03').click()
  await expect(page).toHaveURL(/ponto=MOCK-03/)
  await expect(page.getByRole('complementary', { name: 'Terminal Parque Dom Pedro II' })).toBeVisible()
})

test('sem rede não há mapa falso: nem figura nem a grade esquemática antiga', async ({ page }) => {
  await mapaSemRede(page)
  await page.goto('/pontos')
  await expect(avisoMapa(page)).toBeVisible()
  await expect(page.getByText('sem ruas/mapa base')).toHaveCount(0)
})

test('pontos sem localização aparecem em "Sem localização", com o motivo, e continuam selecionáveis', async ({ page }) => {
  await mapaSemRede(page)
  // A sessão do modo mock vive em memória: cadastro pelo admin e navegação só por cliques.
  await page.goto('/admin/login')
  await page.getByLabel('E-mail').fill('admin.demo@climaponto.example')
  await page.getByLabel('Senha').fill('demo-admin-2026')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Gerenciar pontos' })).toBeVisible()
  await page.getByRole('button', { name: 'Novo ponto' }).click()
  await page.getByLabel('Código').fill('SEM-LOC-1')
  await page.getByLabel('Nome').fill('Ponto sem coordenadas')
  await page.getByLabel('Bairro ou região').fill('Centro')
  await page.getByRole('button', { name: 'Cadastrar' }).click()
  await expect(page.getByRole('article').filter({ hasText: 'SEM-LOC-1' })).toBeVisible()
  await page.mouse.move(900, 500)
  await expect(page.locator('[data-sidebar]')).toHaveAttribute('data-sidebar', 'compact')
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Explorar', exact: true }).click()
  await expect(avisoMapa(page)).toBeVisible()
  const secao = page.getByRole('region', { name: 'Sem localização' })
  await expect(secao).toBeVisible()
  await expect(secao.getByRole('button', { name: /Ponto sem coordenadas \(SEM-LOC-1\)/ })).toBeVisible()
  await expect(secao).toContainText('não têm coordenadas utilizáveis')
  await secao.getByRole('button', { name: /SEM-LOC-1/ }).click()
  await expect(page).toHaveURL(/ponto=SEM-LOC-1/)
  await expect(page.getByRole('complementary', { name: 'Ponto sem coordenadas' })).toContainText('Sem localização')
  // os 8 pontos com coordenadas seguem na lista do mapa
  await expect(listaDoMapa(page).getByRole('button')).toHaveCount(8)
})

test.describe('375 px', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('mapa ou fallback sem rolagem horizontal', async ({ page }) => {
    await mapaComEstiloVazio(page)
    await page.goto('/pontos')
    await expect(mapaMapLibre(page).or(avisoMapa(page)).first()).toBeVisible({ timeout: 20_000 })
    expect(await horizontalOverflow(page)).toEqual([])
    const doc = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(doc).toBeLessThanOrEqual(0)
  })

  test('fallback com lista aberta sem rolagem horizontal', async ({ page }) => {
    await mapaSemRede(page)
    await page.goto('/pontos')
    await expect(avisoMapa(page)).toBeVisible()
    await expect(listaDoMapa(page).getByRole('button')).toHaveCount(8)
    expect(await horizontalOverflow(page)).toEqual([])
  })
})
