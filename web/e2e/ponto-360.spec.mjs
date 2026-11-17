// Ponto 360° (/pontos/:id): deep link, redirecionamento id→código, abas, período, comparação, CSV e voltar (modo mock).
// Dataset: MOCK-01 normal, MOCK-02 atenção (simulação), MOCK-04 sem leituras. ids: mock-stop-<cenário>.
import { test, expect, horizontalOverflow } from 'harness-e2e'
import { CONSOLE_MAPA, abrirExplorarSemMapa, mapaSemRede } from './suporte-mapa.mjs'

test.use({ allowConsole: CONSOLE_MAPA, viewport: { width: 1366, height: 900 } })
test.beforeEach(async ({ page }) => mapaSemRede(page))

const aba = (page, nome) => page.getByRole('tab', { name: nome, exact: true })
const periodo = (page, nome) => page.getByRole('group', { name: 'Período do histórico' }).getByRole('button', { name: nome, exact: true })
const graficos = (page) => page.locator('main .recharts-wrapper')

test('deep link com período e aba: abre direto em Medições com 7 dias', async ({ page }) => {
  await page.goto('/pontos/MOCK-01?periodo=7d&aba=medicoes')
  await expect(page.getByRole('heading', { level: 1, name: 'Av. Paulista × Rua da Consolação' })).toBeVisible()
  await expect(page.getByText('Código MOCK-01')).toBeVisible()
  await expect(aba(page, 'Medições')).toHaveAttribute('aria-selected', 'true')
  await expect(periodo(page, '7 dias')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { level: 2, name: 'Medições' })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page).toHaveURL(/periodo=7d/)
})

test('id interno redireciona para o código, preservando os parâmetros', async ({ page }) => {
  await page.goto('/pontos/mock-stop-normal?periodo=30d&aba=qualidade')
  await expect(page).toHaveURL(/\/pontos\/MOCK-01\?/)
  await expect(page).toHaveURL(/periodo=30d/)
  await expect(page).toHaveURL(/aba=qualidade/)
  await expect(aba(page, 'Qualidade')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('heading', { level: 2, name: 'Qualidade dos dados' })).toBeVisible()
})

test('as quatro abas existem e a escolha vai para a URL', async ({ page }) => {
  await page.goto('/pontos/MOCK-01')
  await expect(page.getByRole('tablist', { name: 'Seções do ponto' }).getByRole('tab')).toHaveText(['Visão', 'Medições', 'Comparação', 'Qualidade'])
  await expect(aba(page, 'Visão')).toHaveAttribute('aria-selected', 'true')
  await aba(page, 'Comparação').click()
  await expect(page).toHaveURL(/aba=comparacao/)
  await aba(page, 'Visão').click()
  await expect(page).not.toHaveURL(/aba=/)
  await periodo(page, '30 dias').click()
  await expect(page).toHaveURL(/periodo=30d/)
  await expect(periodo(page, '30 dias')).toHaveAttribute('aria-pressed', 'true')
})

test('id inexistente: aviso "Ponto não encontrado" e caminho de volta ao mapa', async ({ page }) => {
  await page.goto('/pontos/NAO-EXISTE')
  await expect(page.getByText('Ponto não encontrado', { exact: true })).toBeVisible()
  await expect(page.getByRole('tablist')).toHaveCount(0)
  await page.getByRole('link', { name: 'Voltar ao mapa' }).click()
  await expect(page).toHaveURL(/\/pontos$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Explorar pontos' })).toBeVisible()
})

test('ponto sem leituras: estado vazio honesto, sem gráfico nem indicadores inventados', async ({ page }) => {
  await page.goto('/pontos/MOCK-04')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('Sem leituras no período')).toBeVisible()
  await expect(graficos(page)).toHaveCount(0)
  await aba(page, 'Medições').click()
  await expect(page.getByText('Sem leituras no período')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toHaveCount(0)
  await expect(page.getByRole('table')).toHaveCount(0)
})

test('comparação A/B: escolher o segundo ponto grava ?comparar e mostra o resultado ou o motivo', async ({ page }) => {
  await page.goto('/pontos/MOCK-01?aba=comparacao')
  await expect(page.getByText('Escolha um segundo ponto')).toBeVisible()
  const seletor = page.getByRole('combobox', { name: 'Comparar com' })
  await expect(seletor.locator('option[value="MOCK-01"]')).toHaveCount(0)
  await seletor.selectOption('MOCK-02')
  await expect(page).toHaveURL(/comparar=MOCK-02/)
  await expect(page.getByText(/Origem comum:|Não comparável/).first()).toBeVisible({ timeout: 15_000 })
  // um ponto sem leituras nunca é comparado em silêncio
  await seletor.selectOption('MOCK-04')
  await expect(page.getByText('Não comparável', { exact: true })).toBeVisible({ timeout: 15_000 })
})

test('download CSV em Medições: nome do arquivo, cabeçalho, origem e selo Demonstrativo na página', async ({ page }) => {
  await page.goto('/pontos/MOCK-02?aba=medicoes')
  await expect(page.getByRole('banner').getByText('Demonstrativo').first()).toBeVisible()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar CSV' }).click()])
  expect(download.suggestedFilename()).toBe('climaponto-MOCK-02-24h-todas.csv')
  const stream = await download.createReadStream()
  let texto = ''
  for await (const parte of stream) texto += parte.toString('utf8')
  const linhas = texto.replace(/^﻿/, '').trim().split(/\r?\n/)
  expect(linhas[0]).toBe('ponto_codigo,ponto_nome,medido_em_utc,medido_em_local_america_sao_paulo,temperatura_c,umidade_pct,estado_ambiental,origem')
  expect(linhas.length).toBeGreaterThan(1)
  for (const linha of linhas.slice(1)) {
    expect(linha.startsWith('MOCK-02,')).toBe(true)
    // origem declarada em cada linha: leitura de simulação não é medição real
    expect(linha).toMatch(/Simulação|Teste|desconhecida/i)
  }
})

test('voltar: "Voltar ao mapa" reabre o Explorar com o ponto; Voltar do navegador retorna ao painel', async ({ page }) => {
  await abrirExplorarSemMapa(page, '/pontos?ponto=MOCK-02')
  await page.getByRole('complementary', { name: 'Largo da Batata' }).getByRole('link', { name: /Ver análise detalhada/ }).click()
  await expect(page).toHaveURL(/\/pontos\/MOCK-02$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/pontos\?ponto=MOCK-02/)
  await expect(page.getByRole('complementary', { name: 'Largo da Batata' })).toBeVisible()
  await page.goto('/pontos/MOCK-02')
  await page.getByRole('link', { name: 'Voltar ao mapa' }).click()
  await expect(page).toHaveURL(/\/pontos\?ponto=MOCK-02/)
  await expect(page.getByRole('complementary', { name: 'Largo da Batata' })).toBeVisible()
})

test('375 px: sem rolagem horizontal em cada aba', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  for (const nome of ['visao', 'medicoes', 'comparacao', 'qualidade']) {
    await page.goto(`/pontos/MOCK-01?aba=${nome}`)
    await expect(page.getByRole('tablist', { name: 'Seções do ponto' })).toBeVisible()
    expect(await horizontalOverflow(page), nome).toEqual([])
  }
})
