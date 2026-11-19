// Command Palette: atalho, botão, busca, navegação por teclado e foco (modo mock).
import { test, expect, snap, settle, horizontalOverflow, axeViolations } from 'harness-e2e'
import { CONSOLE_MAPA, mapaSemRede } from './suporte-mapa.mjs'

// Explorar abre o mapa, que tenta o OpenFreeMap: no gate sem rede a tentativa é abortada (fallback determinístico).
test.use({ allowConsole: CONSOLE_MAPA })
test.beforeEach(async ({ page }) => mapaSemRede(page))

const DESKTOP = { width: 1366, height: 900 }
const MOBILE = { width: 375, height: 812 }
const botaoAbrir = (page) => page.getByRole('button', { name: /Busca rápida/ })
const dialogo = (page) => page.getByRole('dialog', { name: 'Busca rápida' })
const campo = (page) => page.getByRole('combobox', { name: 'Buscar página, ação ou ponto' })

test.use({ viewport: DESKTOP })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Resumo' })).toBeVisible()
})

test('abre pelo botão rotulado, com campo focado e lista de resultados', async ({ page }) => {
  await botaoAbrir(page).click()
  await expect(dialogo(page)).toBeVisible()
  await expect(campo(page)).toBeFocused()
  await expect(dialogo(page).getByRole('listbox')).toBeVisible()
  await expect(dialogo(page).getByRole('option').first()).toBeVisible()
})

test('abre com Ctrl+K e Meta+K', async ({ page }) => {
  await page.keyboard.press('Control+k')
  await expect(dialogo(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialogo(page)).toBeHidden()
  await page.keyboard.press('Meta+k')
  await expect(dialogo(page)).toBeVisible()
})

test('Ctrl+K é ignorado com foco em campo de texto', async ({ page }) => {
  await page.goto('/historico')
  const seletor = page.locator('select').first()
  await expect(seletor).toBeVisible()
  await seletor.focus()
  await page.keyboard.press('Control+k')
  await expect(dialogo(page)).toBeHidden()
})

test('Esc fecha e devolve o foco ao botão de origem', async ({ page }) => {
  await botaoAbrir(page).focus()
  await page.keyboard.press('Enter')
  await expect(dialogo(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialogo(page)).toBeHidden()
  await expect(botaoAbrir(page)).toBeFocused()
})

test('setas movem aria-activedescendant e Enter navega para a página', async ({ page }) => {
  await botaoAbrir(page).click()
  await campo(page).fill('hist')
  const opcao = dialogo(page).getByRole('option', { name: /Histórico/ })
  await expect(opcao).toHaveAttribute('aria-selected', 'true')
  await expect(campo(page)).toHaveAttribute('aria-activedescendant', (await opcao.getAttribute('id')) ?? '')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/historico$/)
  await expect(dialogo(page)).toBeHidden()
})

test('setas alternam a opção ativa', async ({ page }) => {
  await botaoAbrir(page).click()
  const opcoes = dialogo(page).getByRole('option')
  await expect(opcoes.nth(0)).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowDown')
  await expect(opcoes.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(opcoes.nth(0)).toHaveAttribute('aria-selected', 'false')
})

test('busca por código de ponto leva à ficha em /pontos', async ({ page }) => {
  await botaoAbrir(page).click()
  await campo(page).fill('MOCK-03')
  await expect(dialogo(page).getByRole('option').first()).toContainText('MOCK-03')
  await page.keyboard.press('Enter')
  // contrato de buildCommandResults (commandSearch.test.js): ponto abre o Ponto 360°
  await expect(page).toHaveURL(/\/pontos\/MOCK-03$/)
})

test('sem resultados: mensagem em texto', async ({ page }) => {
  await botaoAbrir(page).click()
  await campo(page).fill('zzz-inexistente')
  await expect(dialogo(page).getByText('Nenhum resultado para a busca.')).toBeVisible()
  await expect(dialogo(page).getByRole('option')).toHaveCount(0)
})

test('375 px: palette sem rolagem horizontal', async ({ page }) => {
  await page.setViewportSize(MOBILE)
  await botaoAbrir(page).click()
  await expect(dialogo(page)).toBeVisible()
  expect(await horizontalOverflow(page)).toEqual([])
})

for (const [vpNome, vp] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  for (const [temaNome, scheme] of [['claro', 'light'], ['escuro', 'dark']]) {
    test(`axe e screenshot: palette aberta, ${vpNome} ${temaNome}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'firefox', 'axe-core no Firefox derruba a página com gráficos (Page crashed); coberto no Chromium')
      await page.setViewportSize(vp)
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await botaoAbrir(page).click()
      await expect(dialogo(page).getByRole('option').first()).toBeVisible()
      await settle(page)
      expect(await axeViolations(page)).toEqual([])
      await snap(page, testInfo, `palette-${vpNome}-${temaNome}`)
    })
  }
}
