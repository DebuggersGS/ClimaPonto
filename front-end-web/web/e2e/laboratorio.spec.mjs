// Laboratório de sensores (demonstração): só no modo mock, recolhido por padrão, conectividade calculada.
import { test, expect, snap, settle, horizontalOverflow, axeViolations } from 'harness-e2e'

const laboratorio = (page) => page.locator('details').filter({ hasText: 'Laboratório de sensores (demonstração)' })
const cenarios = (page) => laboratorio(page).getByRole('listitem')

async function abrir(page) {
  await page.goto('/laboratorio')
  await expect(page.getByRole('heading', { level: 1, name: 'Laboratório' })).toBeVisible()
  await expect(laboratorio(page)).toBeVisible()
}

test('recolhido por padrão; ao abrir lista os 8 cenários com a conectividade calculada', async ({ page }) => {
  await abrir(page)
  await expect(laboratorio(page)).toBeVisible()
  await expect(laboratorio(page)).not.toHaveAttribute('open', /.*/)
  await expect(cenarios(page).first()).toBeHidden()
  await laboratorio(page).getByText('Laboratório de sensores (demonstração)').click()
  await expect(cenarios(page)).toHaveCount(8)
  await expect(laboratorio(page)).toContainText('Não são medições reais')
  const conectividade = {
    'MOCK-01': 'Online',
    'MOCK-04': 'Sem dados',
    'MOCK-05': 'Atrasado',
    'MOCK-06': 'Offline',
  }
  for (const [codigo, texto] of Object.entries(conectividade)) {
    const cenario = cenarios(page).filter({ hasText: codigo })
    await expect(cenario).toHaveCount(1)
    await expect(cenario).toContainText(`Conectividade: ${texto}`)
  }
  await expect(cenarios(page).filter({ hasText: 'MOCK-04' })).toContainText('ainda não enviou nenhuma leitura')
})

test('não aparece quando a página está em erro', async ({ page }) => {
  await page.goto('/laboratorio?mock=erro')
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar os pontos')
  await expect(laboratorio(page)).toHaveCount(0)
})

for (const colorScheme of ['light', 'dark']) {
  test(`aberto: axe-core, 375 px sem rolagem lateral e captura (tema ${colorScheme})`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await abrir(page)
    await laboratorio(page).getByText('Laboratório de sensores (demonstração)').click()
    await expect(cenarios(page)).toHaveCount(8)
    await settle(page)
    const v = await axeViolations(page)
    await testInfo.attach(`axe-laboratorio-${colorScheme}`, { body: JSON.stringify(v, null, 2), contentType: 'application/json' })
    expect(v).toEqual([])
    expect(await horizontalOverflow(page)).toEqual([])
    await snap(page, testInfo, `pontos-laboratorio-mobile-${colorScheme}`)
  })
}
