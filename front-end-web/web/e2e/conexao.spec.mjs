// Aviso de conexão: aparece offline, some ao reconectar, sem mudar os dados exibidos (modo mock).
import { test, expect, snap, settle, horizontalOverflow, axeViolations } from 'harness-e2e'

const MOBILE = { width: 375, height: 812 }
const AVISO = 'Sem conexão: os dados podem estar desatualizados'

test.use({ viewport: { width: 1366, height: 900 } })

test('sem aviso quando online', async ({ page }) => {
  await page.goto('/historico')
  await expect(page.getByRole('heading', { level: 1, name: 'Histórico' })).toBeVisible()
  await expect(page.getByText(AVISO)).toHaveCount(0)
})

test('aviso textual aparece offline e some ao reconectar', async ({ page, context }) => {
  await page.goto('/historico')
  await expect(page.getByRole('heading', { level: 1, name: 'Histórico' })).toBeVisible()
  test.info().annotations.push({ type: "console-esperado", description: "ERR_INTERNET_DISCONNECTED" })
  await context.setOffline(true)
  await expect(page.getByRole('status').filter({ hasText: AVISO })).toBeVisible()
  await context.setOffline(false)
  await expect(page.getByText(AVISO)).toHaveCount(0)
})

test('offline: dados já carregados continuam visíveis junto do aviso', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Pontos monitorados' })).toBeVisible()
  test.info().annotations.push({ type: "console-esperado", description: "ERR_INTERNET_DISCONNECTED" })
  await context.setOffline(true)
  await expect(page.getByText(AVISO)).toBeVisible()
  await expect(page.getByRole('region', { name: 'Pontos monitorados' })).toBeVisible()
})

for (const [vpNome, vp] of [['desktop', { width: 1366, height: 900 }], ['mobile', MOBILE]]) {
  for (const [temaNome, scheme] of [['claro', 'light'], ['escuro', 'dark']]) {
    test(`axe e screenshot: aviso offline, ${vpNome} ${temaNome}`, async ({ page, context }, testInfo) => {
      test.skip(testInfo.project.name === 'firefox', 'axe-core no Firefox derruba a página (Page crashed); coberto no Chromium')
      await page.setViewportSize(vp)
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await page.goto('/historico')
      await expect(page.getByRole('heading', { level: 1, name: 'Histórico' })).toBeVisible()
      test.info().annotations.push({ type: "console-esperado", description: "ERR_INTERNET_DISCONNECTED" })
      await context.setOffline(true)
      await expect(page.getByText(AVISO)).toBeVisible()
      await settle(page)
      expect(await axeViolations(page)).toEqual([])
      expect(await horizontalOverflow(page)).toEqual([])
      await snap(page, testInfo, `conexao-offline-${vpNome}-${temaNome}`)
    })
  }
}

test('375 px offline: sem rolagem horizontal', async ({ page, context }) => {
  await page.setViewportSize(MOBILE)
  await page.goto('/historico')
  await expect(page.getByRole('heading', { level: 1, name: 'Histórico' })).toBeVisible()
  test.info().annotations.push({ type: "console-esperado", description: "ERR_INTERNET_DISCONNECTED" })
  await context.setOffline(true)
  await expect(page.getByText(AVISO)).toBeVisible()
  expect(await horizontalOverflow(page)).toEqual([])
})
