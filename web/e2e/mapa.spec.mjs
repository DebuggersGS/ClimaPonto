// Pontos: mapa esquemático (vista padrão), alternância Mapa/Lista, filtros, estados e acessibilidade (modo mock).
import { test, expect, snap, settle, horizontalOverflow, obscuredElements, axeViolations, keyboardWalk } from 'harness-e2e'

const DESKTOP = { width: 1366, height: 900 }
const MOBILE = { width: 375, height: 812 }

const mapa = (page) => page.getByRole('figure', { name: 'Mapa esquemático dos pontos de ônibus' })
const marcadores = (page) => mapa(page).getByRole('button')
const marcador = (page, codigo) => mapa(page).getByRole('button', { name: new RegExp(codigo) })
const contagem = (page) => page.getByRole('status').filter({ hasText: /^Mostrando / })

async function abrir(page, url = '/pontos') {
  await page.goto(url)
  await expect(marcadores(page)).toHaveCount(8)
}

test('o mapa é a vista padrão, com nome, legenda em texto e 8 pontos focáveis com estado em texto', async ({ page }) => {
  await abrir(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Pontos' })).toBeVisible()
  await expect(mapa(page)).toBeVisible()
  await expect(mapa(page)).toContainText('posição relativa pelas coordenadas cadastradas; sem ruas/mapa base')
  await expect(page.getByRole('button', { name: 'Mapa', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(marcador(page, 'MOCK-02')).toHaveAccessibleName(/Largo da Batata, MOCK-02\. Estado ambiental: .+\. Conectividade: .+\./)
  await expect(marcador(page, 'MOCK-04')).toHaveAccessibleName(/Estado ambiental: sem leitura\. Conectividade: Sem dados\./)
  await expect(marcador(page, 'MOCK-06')).toHaveAccessibleName(/Conectividade: Offline\./)
  await marcador(page, 'MOCK-03').focus()
  await expect(marcador(page, 'MOCK-03')).toBeFocused()
  // todos têm posição própria e visível, sem lista de "pontos fora do mapa" no dataset de demonstração
  await expect(page.getByRole('heading', { name: 'Pontos fora do mapa' })).toHaveCount(0)
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
  await expect(mapa(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Mapa', exact: true }).click()
  await expect(page).not.toHaveURL(/vista=/)
  await expect(marcadores(page)).toHaveCount(8)
})

test('busca e filtros valem para o mapa, com contagem e Limpar', async ({ page }) => {
  await abrir(page)
  await page.getByRole('combobox', { name: 'Bairro' }).selectOption({ label: 'Pinheiros (1)' })
  await expect(marcadores(page)).toHaveCount(1)
  await expect(marcador(page, 'MOCK-02')).toBeVisible()
  await expect(contagem(page)).toHaveText('Mostrando 1 de 8 pontos')
  await page.getByRole('combobox', { name: 'Bairro' }).selectOption({ label: 'Todos os bairros' })
  await page.getByRole('group', { name: 'Filtrar por conectividade' }).getByRole('button', { name: /^Offline/ }).click()
  await expect(marcadores(page)).toHaveCount(1)
  await expect(marcador(page, 'MOCK-06')).toBeVisible()
  await page.getByRole('searchbox', { name: 'Buscar pontos' }).fill('zzz-inexistente')
  await expect(page.getByText('Nenhum ponto encontrado', { exact: true })).toBeVisible()
  await expect(mapa(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Limpar filtros' }).last().click()
  await expect(marcadores(page)).toHaveCount(8)
  await expect(contagem(page)).toHaveText('Mostrando 8 de 8 pontos')
})

test('não faz requisição a hosts externos (sem tiles nem CDN de mapa)', async ({ page }) => {
  const externos = []
  page.on('request', (request) => {
    const { hostname, protocol } = new URL(request.url())
    if (['http:', 'https:'].includes(protocol) && !['127.0.0.1', 'localhost'].includes(hostname)) externos.push(request.url())
  })
  await abrir(page)
  await marcador(page, 'MOCK-01').click()
  expect(externos).toEqual([])
})

test('?mock=erro: mensagem de erro e nova tentativa, sem mapa', async ({ page }) => {
  await page.goto('/pontos?mock=erro')
  const alerta = page.getByRole('alert')
  await expect(alerta).toContainText('Não foi possível carregar os pontos')
  await expect(alerta.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await expect(mapa(page)).toHaveCount(0)
})

test('?mock=lento: carregamento visível e nenhum mapa vazio enganoso', async ({ page }) => {
  await page.goto('/pontos?mock=lento')
  await expect(page.getByRole('status').filter({ hasText: 'Carregando pontos…' })).toBeVisible()
  await expect(mapa(page)).toHaveCount(0)
  await expect(marcadores(page)).toHaveCount(8, { timeout: 15_000 })
})

test('teclado: marcadores entram na ordem de tabulação com foco visível', async ({ page }) => {
  await abrir(page)
  const ordem = await keyboardWalk(page, 60)
  expect(ordem.filter((x) => /MOCK-\d+\./.test(x.name ?? '')).length).toBeGreaterThanOrEqual(8)
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
  test(`axe-core: mapa e lista (tema ${colorScheme})`, async ({ page }, testInfo) => {
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
