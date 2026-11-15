// Dashboard: bloco "Alertas" derivado das últimas leituras (modo mock).
// Dataset: MOCK-03 crítico, MOCK-02 atenção, MOCK-06 offline.
import { test, expect, snap, settle, horizontalOverflow, axeViolations } from 'harness-e2e'

const DESKTOP = { width: 1366, height: 900 }
const MOBILE = { width: 375, height: 812 }
const painel = (page) => page.getByRole('region', { name: 'Alertas' })
const botao = (page) => painel(page).getByRole('button', { name: /alertas$/ })

test.use({ viewport: DESKTOP })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(painel(page)).toBeVisible()
})

test('contagem em região aria-live e lista recolhida por padrão', async ({ page }) => {
  await expect(painel(page).locator('[aria-live="polite"]')).toHaveText('3 alertas ativos.')
  await expect(botao(page)).toHaveAttribute('aria-expanded', 'false')
  await expect(painel(page).getByRole('listitem')).toHaveCount(0)
})

test('lista aberta: ordem, rótulo, regra e origem em texto', async ({ page }) => {
  await botao(page).click()
  const itens = painel(page).getByRole('listitem')
  await expect(itens).toHaveCount(3)
  await expect(itens.nth(0)).toContainText('MOCK-03')
  await expect(itens.nth(0)).toContainText('Crítico')
  await expect(itens.nth(1)).toContainText('MOCK-06')
  await expect(itens.nth(1)).toContainText('Offline')
  await expect(itens.nth(1)).toContainText('regra provisória')
  await expect(itens.nth(2)).toContainText('MOCK-02')
  await expect(itens.nth(2)).toContainText('Atenção')
  await expect(itens.nth(0)).toContainText(/Simulação|simulação|simulad/i)
})

test('ponto sem dados (MOCK-04) e ponto normal não geram alerta', async ({ page }) => {
  await botao(page).click()
  await expect(painel(page)).not.toContainText('MOCK-04')
  await expect(painel(page)).not.toContainText('MOCK-01')
})

test('seções existentes do Dashboard continuam presentes', async ({ page }) => {
  for (const nome of ['Resumo', 'Última medição', 'Evolução recente', 'Insights', 'Pontos monitorados']) {
    await expect(page.getByRole('region', { name: nome })).toBeVisible()
  }
})

test('teclado: botão de alertas alterna com Enter e mostra foco visível', async ({ page }) => {
  await botao(page).focus()
  expect(await botao(page).evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none')
  await page.keyboard.press('Enter')
  await expect(botao(page)).toHaveAttribute('aria-expanded', 'true')
})

test('375 px: alertas abertos sem rolagem horizontal', async ({ page }) => {
  await page.setViewportSize(MOBILE)
  await botao(page).click()
  await expect(painel(page).getByRole('listitem')).toHaveCount(3)
  expect(await horizontalOverflow(page)).toEqual([])
})

for (const [vpNome, vp] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  for (const [temaNome, scheme] of [['claro', 'light'], ['escuro', 'dark']]) {
    test(`axe e screenshot: alertas abertos, ${vpNome} ${temaNome}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'firefox', 'axe-core no Firefox derruba a página com gráficos (Page crashed); coberto no Chromium')
      await page.setViewportSize(vp)
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await botao(page).click()
      await expect(painel(page).getByRole('listitem')).toHaveCount(3)
      await settle(page)
      expect(await axeViolations(page)).toEqual([])
      await snap(page, testInfo, `alertas-${vpNome}-${temaNome}`)
    })
  }
}
