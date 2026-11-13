// Dashboard: indicadores, estados por ponto, gráficos e estados de carregamento/erro (modo mock).
// Dataset determinístico: MOCK-01 normal, MOCK-02 atenção, MOCK-03 crítico, MOCK-04 sem dados,
// MOCK-05 atrasado, MOCK-06 offline, MOCK-07 histórico longo, MOCK-08 demonstrativo.
import { test, expect } from 'harness-e2e'

const resumo = (page) => page.getByRole('region', { name: 'Resumo' })
const cards = (page) => page.getByRole('region', { name: 'Pontos monitorados' }).getByRole('listitem')
const card = (page, code) => cards(page).filter({ hasText: code })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(resumo(page)).toBeVisible()
})

test('indicadores do resumo refletem o dataset mock', async ({ page }) => {
  const r = resumo(page)
  for (const [titulo, valor] of [['Pontos monitorados', '8'], ['Com leituras', '7'], ['Sem dados', '1'], ['Demonstrativos', '1']]) {
    // o cartão do indicador contém o título e o valor (seguido de texto não numérico ou fim)
    await expect(r.getByRole('heading', { level: 3, name: titulo, exact: true }).locator('xpath=../..')).toHaveText(new RegExp(`${titulo}\\s*${valor}(\\D|$)`))
  }
  await expect(r.getByRole('listitem').filter({ hasText: /^Normal/ })).toHaveText(/^Normal\s*5$/)
  await expect(r.getByRole('listitem').filter({ hasText: /^Atenção/ })).toHaveText(/^Atenção\s*1$/)
  await expect(r.getByRole('listitem').filter({ hasText: /^Crítico/ })).toHaveText(/^Crítico\s*1$/)
  await expect(r.getByRole('listitem').filter({ hasText: /^Online/ })).toHaveText(/^Online\s*5$/)
  await expect(r.getByRole('listitem').filter({ hasText: /^Atrasado/ })).toHaveText(/^Atrasado\s*1$/)
  await expect(r.getByRole('listitem').filter({ hasText: /^Offline/ })).toHaveText(/^Offline\s*1$/)
})

test('cards por ponto: estados normal, atenção, crítico e sem dados', async ({ page }) => {
  await expect(cards(page)).toHaveCount(8)
  await expect(card(page, 'MOCK-01')).toContainText('Estado ambiental: Normal')
  await expect(card(page, 'MOCK-02')).toContainText('Estado ambiental: Atenção')
  await expect(card(page, 'MOCK-03')).toContainText('Estado ambiental: Crítico')
  await expect(card(page, 'MOCK-04')).toContainText('Sem dados: nenhuma leitura recebida deste ponto.')
  await expect(card(page, 'MOCK-04')).not.toContainText('Temperatura')
})

test('cards por ponto: conectividade (online, atrasado, offline) e ponto demonstrativo', async ({ page }) => {
  await expect(card(page, 'MOCK-01').locator('strong')).toHaveText('Online')
  await expect(card(page, 'MOCK-05').locator('strong')).toHaveText('Atrasado')
  await expect(card(page, 'MOCK-06').locator('strong')).toHaveText('Offline')
  await expect(card(page, 'MOCK-08')).toContainText('Demonstrativo')
  await expect(card(page, 'MOCK-08')).toContainText('Teste — visível só para administradores')
  await expect(card(page, 'MOCK-01')).toContainText('Simulação — não é medição real')
})

test('cada card leva ao histórico do ponto', async ({ page }) => {
  await card(page, 'MOCK-03').getByRole('link', { name: 'Ver histórico' }).click()
  await expect(page).toHaveURL(/\/historico\?.*ponto=MOCK-03/)
  await expect(page.getByRole('table')).toContainText('Estado ambiental: Crítico')
})

test('última medição em destaque com temperatura, umidade e horário', async ({ page }) => {
  const destaque = page.getByRole('region', { name: 'Última medição' })
  await expect(destaque.getByRole('heading', { level: 3 })).toContainText('(MOCK-')
  await expect(destaque).toContainText(/\d+,\d °C/)
  await expect(destaque).toContainText(/\d+,\d %/)
  await expect(destaque.locator('time')).toBeVisible()
})

test('gráficos de evolução: temperatura e umidade renderizados; troca de ponto atualiza o link', async ({ page }) => {
  const evo = page.getByRole('region', { name: 'Evolução recente' })
  for (const nome of ['Temperatura (°C)', 'Umidade (%)']) {
    const fig = evo.getByRole('figure', { name: nome })
    await expect(fig).toBeVisible()
    await expect(fig.locator('svg path').first()).toBeVisible()
  }
  await expect(evo.getByText('Amostras válidas:').first()).toBeVisible()
  await evo.getByRole('combobox', { name: 'Ponto monitorado' }).selectOption({ label: 'MOCK-03 — Terminal Parque Dom Pedro II' })
  await expect(evo.getByRole('link', { name: 'Ver histórico completo' })).toHaveAttribute('href', /ponto=MOCK-03/)
})

test('?mock=erro: erro anunciado com alerta e nova tentativa', async ({ page }) => {
  await page.goto('/?mock=erro')
  const alerta = page.getByRole('alert')
  await expect(alerta).toContainText('Não foi possível carregar os pontos')
  await expect(alerta.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await expect(resumo(page)).toHaveCount(0)
})

test('?mock=lento: estado de carregamento visível e conteúdo depois', async ({ page }) => {
  await page.goto('/?mock=lento')
  await expect(page.getByRole('status').filter({ hasText: 'Carregando o Dashboard' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Atualizando…' })).toBeDisabled()
  await expect(resumo(page)).toBeVisible({ timeout: 15_000 })
})
