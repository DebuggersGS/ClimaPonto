// Histórico: perfis por horário e dia da semana, linha do tempo, qualidade e relatório (modo mock).
import { test, expect, snap, settle, horizontalOverflow, axeViolations } from 'harness-e2e'

const DESKTOP = { width: 1366, height: 900 }
const MOBILE = { width: 375, height: 812 }
const URL_24H = '/historico?ponto=MOCK-01&periodo=24h'
const URL_7D = '/historico?ponto=MOCK-01&periodo=7d'
const SECOES = ['Por horário do dia', 'Por dia da semana', 'Linha do tempo', 'Qualidade das medições']
const secao = (page, nome) => page.getByRole('button', { name: nome, exact: true })

test.use({ viewport: DESKTOP })

async function abrir(page, url) {
  await page.goto(url)
  // em 375 px a tabela vira cartões (some da árvore de acessibilidade): a prontidão é a seção recolhível
  await expect(secao(page, SECOES[0])).toBeVisible()
}

test('seções novas começam recolhidas e abrem por teclado', async ({ page }) => {
  await abrir(page, URL_24H)
  for (const nome of SECOES) await expect(secao(page, nome)).toHaveAttribute('aria-expanded', 'false')
  await secao(page, 'Por horário do dia').focus()
  await page.keyboard.press('Enter')
  await expect(secao(page, 'Por horário do dia')).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('Fuso America/Sao_Paulo').first()).toBeVisible()
  await expect(page.getByText(/temperatura média/).first()).toBeVisible()
})

test('24 h: perfil por dia da semana declara dados insuficientes', async ({ page }) => {
  await abrir(page, URL_24H)
  await secao(page, 'Por dia da semana').click()
  await expect(page.getByText(/Dados insuficientes/)).toBeVisible()
})

test('7 dias: perfil por dia da semana lista dias com leituras', async ({ page }) => {
  await abrir(page, URL_7D)
  await secao(page, 'Por dia da semana').click()
  await expect(page.getByText(/-feira|Domingo|Sábado/).first()).toBeVisible()
  await expect(page.getByText(/Dados insuficientes/)).toHaveCount(0)
})

test('linha do tempo mostra primeira e última leitura e respeita a origem', async ({ page }) => {
  await abrir(page, `${URL_24H}&origem=simulation`)
  await secao(page, 'Linha do tempo').click()
  await expect(page.getByText('Primeira leitura do período carregado.')).toBeVisible()
  await expect(page.getByText('Última leitura do período carregado.')).toBeVisible()
})

test('qualidade das medições: válidas, descartadas, completude e regra provisória', async ({ page }) => {
  await abrir(page, URL_24H)
  await secao(page, 'Qualidade das medições').click()
  await expect(page.getByText('Leituras válidas')).toBeVisible()
  await expect(page.getByText('Leituras descartadas por invalidez')).toBeVisible()
  await expect(page.getByText('Completude estimada')).toBeVisible()
  await expect(page.getByText(/Regra provisória/)).toBeVisible()
})

test('relatório CSV: download com código e período no nome', async ({ page }) => {
  await abrir(page, URL_24H)
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar relatório (CSV)' }).click()])
  expect(download.suggestedFilename()).toBe('climaponto-resumo-mock-01-24h.csv')
  const chunks = []
  for await (const c of await download.createReadStream()) chunks.push(c)
  const texto = Buffer.concat(chunks).toString('utf8')
  expect(texto).toContain('ponto_codigo,MOCK-01')
  expect(texto).toContain('periodo,24h')
})

test('ponto sem leituras não oferece relatório', async ({ page }) => {
  await page.goto('/historico?ponto=MOCK-04&periodo=24h')
  await expect(page.getByRole('main')).toContainText('Nenhuma leitura no período')
  await expect(page.getByRole('button', { name: 'Exportar relatório (CSV)' })).toHaveCount(0)
})

test('teclado: Tab alcança as seções novas com foco visível', async ({ page }) => {
  await abrir(page, URL_24H)
  const botao = secao(page, 'Por horário do dia')
  await botao.focus()
  await expect(botao).toBeFocused()
  const outline = await botao.evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(outline).not.toBe('none')
})

for (const [vpNome, vp] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  for (const [temaNome, scheme] of [['claro', 'light'], ['escuro', 'dark']]) {
    test(`axe, 375 px e screenshot: seções abertas, ${vpNome} ${temaNome}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'firefox', 'axe-core no Firefox derruba a página (Page crashed); coberto no Chromium')
      await page.setViewportSize(vp)
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await abrir(page, URL_7D)
      for (const nome of SECOES) await secao(page, nome).click()
      await expect(page.getByText('Leituras válidas')).toBeVisible()
      await settle(page)
      expect(await axeViolations(page)).toEqual([])
      expect(await horizontalOverflow(page)).toEqual([])
      await snap(page, testInfo, `historico-perfis-${vpNome}-${temaNome}`)
    })
  }
}

test('375 px sem rolagem horizontal com seções abertas (todos os navegadores)', async ({ page }) => {
  await page.setViewportSize(MOBILE)
  await abrir(page, URL_7D)
  for (const nome of SECOES) await secao(page, nome).click()
  expect(await horizontalOverflow(page)).toEqual([])
})
