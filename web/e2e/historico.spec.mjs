// Histórico: seleção de ponto, filtro de período, tabela, gráficos e estados (modo mock).
import { test, expect } from 'harness-e2e'

const filtros = (page) => page.getByRole('region', { name: 'Filtros do histórico' })

test('sem ponto selecionado, orienta a escolher um ponto', async ({ page }) => {
  await page.goto('/historico')
  await expect(page.getByText('Escolha um ponto monitorado para ver o histórico de leituras.')).toBeVisible()
  await expect(page.getByRole('table')).toHaveCount(0)
})

test('selecionar ponto mostra evolução, tabela e atualiza a URL', async ({ page }) => {
  await page.goto('/historico')
  await filtros(page).getByRole('combobox', { name: 'Ponto monitorado' }).selectOption({ label: 'MOCK-01 — Av. Paulista × Rua da Consolação' })
  await expect(page).toHaveURL(/ponto=MOCK-01/)
  const tabela = page.getByRole('table', { name: /Leituras de Av\. Paulista × Rua da Consolação \(MOCK-01\)/ })
  await expect(tabela).toBeVisible()
  expect(await tabela.getByRole('row').count()).toBeGreaterThan(10)
  await expect(tabela.getByRole('columnheader')).toHaveText(['Data e hora', 'Temperatura', 'Umidade', 'Origem', 'Estado ambiental'])
  const evo = page.getByRole('region', { name: 'Evolução' })
  await expect(evo.getByRole('figure', { name: 'Temperatura (°C)' }).locator('svg path').first()).toBeVisible()
  await expect(evo.getByRole('figure', { name: 'Umidade (%)' })).toBeVisible()
})

test('filtro de período: 24 h, 7 dias e 30 dias', async ({ page }) => {
  await page.goto('/historico?ponto=MOCK-07&periodo=24h')
  const grupo = filtros(page).getByRole('group', { name: 'Período do histórico' })
  await expect(grupo.getByRole('button', { name: '24 h' })).toHaveAttribute('aria-pressed', 'true')
  for (const [botao, rotulo, param] of [['7 dias', 'Últimos 7 dias', '7d'], ['30 dias', 'Últimos 30 dias', '30d']]) {
    await grupo.getByRole('button', { name: botao }).click()
    await expect(grupo.getByRole('button', { name: botao })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('list', { name: 'Contexto da consulta' })).toContainText(`Período: ${rotulo}`)
    await expect(page).toHaveURL(new RegExp(`periodo=${param}`))
    await expect(page.getByRole('table')).toContainText(rotulo.toLowerCase())
  }
})

test('estados ambientais na tabela: atenção e crítico', async ({ page }) => {
  await page.goto('/historico?ponto=MOCK-02&periodo=24h')
  await expect(page.getByRole('table')).toContainText('Estado ambiental: Atenção')
  await page.goto('/historico?ponto=MOCK-03&periodo=24h')
  await expect(page.getByRole('table')).toContainText('Estado ambiental: Crítico')
})

test('ponto sem dados: sem tabela de leituras e com aviso', async ({ page }) => {
  await page.goto('/historico?ponto=MOCK-04&periodo=24h')
  await expect(page.getByRole('heading', { level: 1, name: 'Histórico' })).toBeVisible()
  await expect(page.getByText('Código MOCK-04')).toBeVisible()
  await expect(page.getByRole('table')).toHaveCount(0)
  await expect(page.getByRole('main')).toContainText(/nenhuma leitura|sem leituras|sem dados/i)
})

test('ponto demonstrativo identificado e leituras de origem Teste', async ({ page }) => {
  await page.goto('/historico?ponto=MOCK-08&periodo=24h')
  await expect(page.getByText('Ponto demonstrativo')).toBeVisible()
  await expect(page.getByRole('table')).toContainText('Teste — visível só para administradores')
})

test('?mock=erro: alerta com nova tentativa', async ({ page }) => {
  await page.goto('/historico?mock=erro')
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar os pontos')
  await expect(page.getByRole('alert').getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
})

test('?mock=lento: estado de carregamento anunciado e depois a tabela', async ({ page }) => {
  await page.goto('/historico?ponto=MOCK-01&periodo=24h&mock=lento')
  await expect(page.getByRole('status').filter({ hasText: 'Carregando leituras…' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Carregando tabela de leituras…' })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('status').filter({ hasText: 'Carregando leituras…' })).toHaveCount(0)
})

test('desktop: a página termina no rodapé (sem rolagem vazia causada pela tabela)', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.goto('/historico?ponto=MOCK-01&periodo=24h')
  await expect(page.getByRole('table')).toBeVisible()
  // regressão: textos sr-only (absolute) dentro do contêiner rolável esticavam a página até a altura da tabela
  const vazio = await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight)
    return Math.round(innerHeight - document.querySelector('footer').getBoundingClientRect().bottom)
  })
  expect(vazio).toBeLessThanOrEqual(2)
  const regiao = page.getByRole('region', { name: 'Tabela de leituras (com rolagem)' })
  await expect(regiao).toHaveAttribute('tabindex', '0')
})
