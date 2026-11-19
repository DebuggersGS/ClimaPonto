// Histórico: filtro de origem na URL, resumo por dia e exportação CSV (modo mock).
import { test, expect, snap, settle, horizontalOverflow, axeViolations } from 'harness-e2e'

const DESKTOP = { width: 1366, height: 900 }
const MOBILE = { width: 375, height: 812 }
const URL_BASE = '/historico?ponto=MOCK-01&periodo=24h'
const origem = (page) => page.getByRole('combobox', { name: 'Origem dos dados' })
const tabela = (page) => page.getByRole('table')

test.use({ viewport: DESKTOP })

test('select de origem lista só as presentes e atualiza a URL', async ({ page }) => {
  await page.goto(URL_BASE)
  await expect(tabela(page)).toBeVisible()
  await expect(origem(page).locator('option')).toHaveText(['Todas as origens', 'Simulação'])
  await origem(page).selectOption({ label: 'Simulação' })
  await expect(page).toHaveURL(/origem=simulation/)
  await expect(tabela(page)).toBeVisible()
})

test('origem na URL é aplicada à tabela: só linhas da origem', async ({ page }) => {
  await page.goto(`${URL_BASE}&origem=simulation`)
  await expect(tabela(page)).toBeVisible()
  await expect(origem(page)).toHaveValue('simulation')
  const linhas = tabela(page).getByRole('row')
  expect(await linhas.count()).toBeGreaterThan(10)
  const origens = await tabela(page).locator('tbody tr td:nth-child(4)').allTextContents()
  expect(origens.length).toBeGreaterThan(10)
  for (const o of origens) expect(o).toContain('Simulação')
})

test('origem sem leituras: estado vazio, sem exportação, e volta para todas', async ({ page }) => {
  await page.goto(`${URL_BASE}&origem=test`)
  await expect(page.getByText('Nenhuma leitura com esta origem')).toBeVisible()
  await expect(tabela(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Mostrar todas as origens' }).click()
  await expect(page).not.toHaveURL(/origem=/)
  await expect(tabela(page)).toBeVisible()
})

test('ponto sem leituras não oferece exportação', async ({ page }) => {
  await page.goto('/historico?ponto=MOCK-04&periodo=24h')
  await expect(page.getByRole('main')).toContainText('Nenhuma leitura no período')
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toHaveCount(0)
})

test('resumo por dia: recolhido por padrão e alternado por teclado', async ({ page }) => {
  await page.goto(URL_BASE)
  await expect(tabela(page)).toBeVisible()
  const botao = page.getByRole('button', { name: 'Mostrar resumo por dia' })
  await expect(botao).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByText('Dias civis no horário de São Paulo')).toBeHidden()
  await botao.focus()
  await page.keyboard.press('Enter')
  const aberto = page.getByRole('button', { name: 'Ocultar resumo por dia' })
  await expect(aberto).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('Dias civis no horário de São Paulo')).toBeVisible()
  await expect(page.getByText(/Temperatura mín\. \/ média \/ máx\./).first()).toBeVisible()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Mostrar resumo por dia' })).toHaveAttribute('aria-expanded', 'false')
})

test('CSV: download com BOM, cabeçalho, unidades, origem e uma linha por leitura exibida', async ({ page }) => {
  await page.goto(`${URL_BASE}&origem=simulation`)
  await expect(tabela(page)).toBeVisible()
  // A tabela pagina no cliente ("Exibindo 50 de N"); o CSV leva todas as N leituras do filtro atual.
  const status = await page.getByRole('status').filter({ hasText: /^Exibindo \d+ de \d+/ }).textContent()
  const exibidas = Number(status.match(/de (\d+)/)[1])
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar CSV' }).click()])
  expect(download.suggestedFilename()).toBe('climaponto-mock-01-24h-simulation.csv')
  const chunks = []
  for await (const c of await download.createReadStream()) chunks.push(c)
  const bruto = Buffer.concat(chunks)
  expect([...bruto.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
  const linhas = bruto.toString('utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean)
  expect(linhas[0]).toBe('ponto_codigo,ponto_nome,medido_em_utc,medido_em_local_america_sao_paulo,temperatura_c,umidade_pct,estado_ambiental,origem')
  expect(linhas.length - 1).toBe(exibidas)
  for (const l of linhas.slice(1)) {
    expect(l.startsWith('MOCK-01,')).toBe(true)
    expect(l.endsWith(',Simulação')).toBe(true)
  }
})

test('375 px: cartões em vez de tabela, sem rolagem horizontal, com origem e resumo', async ({ page }) => {
  await page.setViewportSize(MOBILE)
  await page.goto(`${URL_BASE}&origem=simulation`)
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeVisible()
  await page.getByRole('button', { name: 'Mostrar resumo por dia' }).click()
  await expect(page.getByText('Dias civis no horário de São Paulo')).toBeVisible()
  expect(await horizontalOverflow(page)).toEqual([])
})

for (const [vpNome, vp] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  for (const [temaNome, scheme] of [['claro', 'light'], ['escuro', 'dark']]) {
    test(`axe e screenshot: filtro e resumo por dia, ${vpNome} ${temaNome}`, async ({ page }, testInfo) => {
      await page.setViewportSize(vp)
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await page.goto(`${URL_BASE}&origem=simulation`)
      await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeVisible()
      await page.getByRole('button', { name: 'Mostrar resumo por dia' }).click()
      await expect(page.getByText('Dias civis no horário de São Paulo')).toBeVisible()
      await settle(page)
      expect(await axeViolations(page)).toEqual([])
      expect(await horizontalOverflow(page)).toEqual([])
      await snap(page, testInfo, `historico-filtro-resumo-${vpNome}-${temaNome}`)
    })
  }
}
