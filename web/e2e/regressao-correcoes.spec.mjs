// Regressões da correção definitiva da interface (modo mock):
// - "Abrir ponto" deixava a página preta (exceção na lista de reserva do minimapa do Ponto 360°);
// - o worker do MapLibre não era emitido no build (mapa sempre caía no aviso de falha);
// - sidebar expandida ficava por baixo do cabeçalho / pin cobria o conteúdo; logo descentralizado;
// - cabeçalho inteligente (some ao descer, volta ao subir).
import { test, expect, horizontalOverflow } from 'harness-e2e'
import { CONSOLE_MAPA, mapaComEstiloVazio, mapaSemRede } from './suporte-mapa.mjs'

test.use({ allowConsole: CONSOLE_MAPA, viewport: { width: 1366, height: 900 } })

const CODIGOS = ['MOCK-01', 'MOCK-02', 'MOCK-03', 'MOCK-04', 'MOCK-05', 'MOCK-06', 'MOCK-07', 'MOCK-08']
const lateral = (page) => page.locator('[data-sidebar]')
const raizVazia = (page) => page.evaluate(() => document.getElementById('root').innerHTML.trim().length === 0)

test.describe('Ponto 360°: nunca tela preta', () => {
  for (const [nome, prepararMapa] of [['sem rede (lista de reserva)', mapaSemRede], ['estilo local (mapa)', mapaComEstiloVazio]]) {
    test(`"Abrir ponto" do Dashboard abre cada um dos 8 pontos — ${nome}`, async ({ page }) => {
      test.setTimeout(180_000)
      await prepararMapa(page)
      for (const codigo of CODIGOS) {
        await page.goto('/')
        const link = page.locator(`a[href="/pontos/${codigo}"]`, { hasText: 'Abrir ponto' }).first()
        await expect(link).toBeVisible()
        // clique pelo teclado: independe da posição do mouse sobre a barra lateral
        await link.focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(new RegExp(`/pontos/${codigo}$`))
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(page.getByRole('tablist', { name: 'Seções do ponto' })).toBeVisible()
        expect(await raizVazia(page), codigo).toBe(false)
        await expect(page.getByText('Esta página encontrou um erro')).toHaveCount(0)
      }
    })
  }

  test('as quatro abas renderizam para todos os pontos, sem exceção', async ({ page }) => {
    test.setTimeout(180_000)
    await mapaSemRede(page)
    for (const codigo of CODIGOS) {
      for (const aba of ['', 'medicoes', 'comparacao', 'qualidade']) {
        await page.goto(`/pontos/${codigo}${aba ? `?aba=${aba}` : ''}`)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(page.getByRole('tabpanel')).toBeVisible()
        await expect(page.getByText('Esta página encontrou um erro')).toHaveCount(0)
      }
    }
  })

  test('minimapa sem rede: aviso acessível dentro da aba, a página continua utilizável', async ({ page }) => {
    await mapaSemRede(page)
    await page.goto('/pontos/MOCK-01')
    await expect(page.getByRole('heading', { level: 3, name: 'Localização' })).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: 'Os pontos continuam disponíveis' })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Pontos com localização' }).getByRole('button')).toHaveCount(1)
    await page.getByRole('link', { name: 'Voltar ao mapa' }).first().click()
    await expect(page).toHaveURL(/\/pontos(\?|$)/)
  })
})

test('mapa: o worker do MapLibre é servido pelo próprio site (antes não existia no build)', async ({ page }) => {
  await mapaComEstiloVazio(page)
  const worker = page.waitForResponse((r) => /maplibre-gl-worker/.test(r.url()), { timeout: 20_000 })
  await page.goto('/pontos')
  const resposta = await worker
  expect(resposta.status()).toBe(200)
  expect(new URL(resposta.url()).origin).toBe(new URL(page.url()).origin)
})

test.describe('barra lateral e cabeçalho: camadas e alinhamento', () => {
  test.beforeEach(async ({ page }) => mapaSemRede(page))

  test('expandida por hover fica ACIMA do cabeçalho (nada cortado) e mostra todas as páginas', async ({ page }) => {
    await page.goto('/')
    await page.mouse.move(36, 420)
    await expect(lateral(page)).toHaveAttribute('data-sidebar', 'expanded')
    await expect.poll(() => lateral(page).evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(240)
    // ponto dentro da faixa que antes era coberta pelo cabeçalho
    const dentroDaBarra = await page.evaluate(() => Boolean(document.elementFromPoint(200, 30)?.closest('[data-sidebar]')))
    expect(dentroDaBarra).toBe(true)
    const nav = page.getByRole('navigation', { name: 'Navegação principal' })
    for (const nome of ['Visão geral', 'Explorar', 'Análises', 'Histórico', 'Laboratório', 'Relatórios']) {
      await expect(nav.getByRole('link', { name: nome, exact: true })).toBeVisible()
    }
    await expect(nav.locator('[aria-expanded]')).toHaveCount(0)
  })

  test('fixada: o conteúdo começa depois da barra (sem sobreposição) e sem rolagem horizontal', async ({ page }) => {
    await page.goto('/pontos')
    await page.getByRole('button', { name: 'Fixar menu lateral' }).click()
    await page.mouse.move(900, 600)
    await expect.poll(async () => {
      const barra = await lateral(page).evaluate((el) => el.getBoundingClientRect().right)
      const cabecalho = await page.getByRole('banner').evaluate((el) => el.getBoundingClientRect().left)
      const conteudo = await page.getByRole('main').evaluate((el) => el.getBoundingClientRect().left)
      return cabecalho >= barra - 0.5 && conteudo >= barra - 0.5
    }).toBe(true)
    expect(await horizontalOverflow(page)).toEqual([])
  })

  test('logo compacto centralizado no eixo dos ícones da navegação', async ({ page }) => {
    await page.goto('/')
    await expect(lateral(page)).toHaveAttribute('data-sidebar', 'compact')
    const centros = await page.evaluate(() => {
      const centro = (el) => {
        const r = el.getBoundingClientRect()
        return r.left + r.width / 2
      }
      const barra = document.querySelector('[data-sidebar]')
      const marca = barra.querySelector('[data-logo] img[src*="mark"]')
      const icone = barra.querySelector('nav svg')
      return { barra: centro(barra), marca: centro(marca), icone: centro(icone) }
    })
    expect(Math.abs(centros.marca - centros.icone)).toBeLessThanOrEqual(1)
    expect(Math.abs(centros.icone - centros.barra)).toBeLessThanOrEqual(1)
  })

  for (const [nome, viewport] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 375, height: 812 }]]) {
    test(`cabeçalho some ao descer e volta ao subir (${nome})`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/historico')
      await expect(page.getByRole('heading', { level: 1, name: 'Histórico' })).toBeVisible()
      const cabecalho = page.getByRole('banner')
      await expect(cabecalho).toHaveAttribute('data-header', 'visible')
      await page.mouse.move(viewport.width / 2, viewport.height / 2)
      await page.mouse.wheel(0, 900)
      await expect(cabecalho).toHaveAttribute('data-header', 'hidden')
      await page.mouse.wheel(0, -300)
      await expect(cabecalho).toHaveAttribute('data-header', 'visible')
      await page.evaluate(() => window.scrollTo(0, 0))
      await expect(cabecalho).toHaveAttribute('data-header', 'visible')
    })
  }

  test('cabeçalho com foco não se esconde (teclado)', async ({ page }) => {
    await page.goto('/historico')
    await expect(page.getByRole('heading', { level: 1, name: 'Histórico' })).toBeVisible()
    await page.mouse.move(900, 500)
    await page.mouse.wheel(0, 900)
    await expect(page.getByRole('banner')).toHaveAttribute('data-header', 'hidden')
    await page.getByRole('button', { name: /Busca rápida/ }).focus()
    await expect(page.getByRole('banner')).toHaveAttribute('data-header', 'visible')
  })
})
