// Microinterações: busca (limpar e foco), atalho Ctrl+K, movimento reduzido e axe no Explorar e no Ponto 360° (modo mock).
import { test, expect, settle, axeViolations } from 'harness-e2e'
import { CONSOLE_MAPA, abrirExplorarSemMapa, mapaSemRede } from './suporte-mapa.mjs'

test.use({ allowConsole: CONSOLE_MAPA, viewport: { width: 1366, height: 900 } })

const busca = (page) => page.getByRole('searchbox', { name: 'Buscar pontos' })
const paleta = (page) => page.getByRole('dialog', { name: 'Busca rápida' })

test.describe('busca do Explorar', () => {
  test.beforeEach(async ({ page }) => abrirExplorarSemMapa(page))

  test('"Limpar busca" esvazia o campo, devolve o foco e restaura a lista', async ({ page }) => {
    await busca(page).fill('batata')
    await expect(page.getByRole('list', { name: 'Pontos com localização' }).getByRole('button')).toHaveCount(1)
    await page.getByRole('button', { name: 'Limpar busca' }).click()
    await expect(busca(page)).toHaveValue('')
    await expect(busca(page)).toBeFocused()
    await expect(page.getByRole('list', { name: 'Pontos com localização' }).getByRole('button')).toHaveCount(8)
    await expect(page.getByRole('button', { name: 'Limpar busca' })).toHaveCount(0)
  })

  test('Esc limpa o texto sem tirar o foco do campo', async ({ page }) => {
    await busca(page).fill('lapa')
    await page.keyboard.press('Escape')
    await expect(busca(page)).toHaveValue('')
    await expect(busca(page)).toBeFocused()
  })

  test('foco visível no campo de busca', async ({ page }) => {
    await busca(page).focus()
    const estilo = await busca(page).evaluate((el) => {
      const cs = getComputedStyle(el)
      return { estilo: cs.outlineStyle, largura: parseFloat(cs.outlineWidth) }
    })
    expect(estilo.estilo).not.toBe('none')
    expect(estilo.largura).toBeGreaterThan(0)
  })

  test('Ctrl+K é ignorado dentro do campo de texto e abre a busca rápida fora dele', async ({ page }) => {
    await busca(page).focus()
    await page.keyboard.type('mock')
    await page.keyboard.press('Control+k')
    await expect(paleta(page)).toHaveCount(0)
    await expect(busca(page)).toBeFocused()
    await expect(busca(page)).toHaveValue('mock')
    await page.getByRole('heading', { level: 1, name: 'Explorar pontos' }).click()
    await page.keyboard.press('Control+k')
    await expect(paleta(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(paleta(page)).toHaveCount(0)
  })
})

test('movimento reduzido: a barra lateral expande sem transição (duração zero)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await mapaSemRede(page)
  await page.goto('/')
  await page.mouse.move(40, 400)
  await expect(page.locator('[data-sidebar]')).toHaveAttribute('data-sidebar', 'expanded')
  const duracoes = await page.locator('[data-sidebar]').evaluate((el) => getComputedStyle(el).transitionDuration.split(',').map((d) => parseFloat(d)))
  expect(duracoes.every((d) => d === 0)).toBe(true)
})

test('movimento reduzido: o painel do ponto e os filtros não deixam animação finita em execução', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await abrirExplorarSemMapa(page, '/pontos?ponto=MOCK-02')
  await expect(page.getByRole('complementary', { name: 'Largo da Batata' })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Buscar pontos' }).fill('batata')
  const emAndamento = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.playState === 'running')
      .map((a) => a.animationName || a.id || a.constructor.name),
  )
  expect(emAndamento).toEqual([])
})

for (const colorScheme of ['light', 'dark']) {
  test(`axe sem violações sérias ou críticas no Explorar (tema ${colorScheme})`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await abrirExplorarSemMapa(page)
    await settle(page)
    expect(await axeViolations(page)).toEqual([])
    await page.getByRole('list', { name: 'Pontos com localização' }).getByRole('button', { name: /MOCK-03/ }).click()
    await expect(page.getByRole('complementary')).toBeVisible()
    await settle(page)
    const v = await axeViolations(page)
    await testInfo.attach(`axe-explorar-painel-${colorScheme}`, { body: JSON.stringify(v, null, 2), contentType: 'application/json' })
    expect(v).toEqual([])
  })

  test(`axe sem violações sérias ou críticas no Ponto 360° (tema ${colorScheme})`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await mapaSemRede(page)
    // Ponto sem leituras e abas sem gráfico: o axe-core derruba o Firefox em páginas com gráficos (limitação
    // já documentada na suíte); o Ponto 360° com gráficos é medido a mais só no Chromium.
    for (const aba of ['visao', 'qualidade', 'comparacao']) {
      await page.goto(`/pontos/MOCK-04?aba=${aba}`)
      await expect(page.getByRole('tablist', { name: 'Seções do ponto' })).toBeVisible()
      await settle(page)
      expect(await axeViolations(page), `MOCK-04 ${aba}`).toEqual([])
    }
    if (testInfo.project.name !== 'firefox') {
      for (const aba of ['visao', 'medicoes']) {
        await page.goto(`/pontos/MOCK-01?aba=${aba}`)
        await expect(page.locator('main .recharts-wrapper').first()).toBeVisible()
        await settle(page)
        const v = await axeViolations(page)
        await testInfo.attach(`axe-ponto360-${aba}-${colorScheme}`, { body: JSON.stringify(v, null, 2), contentType: 'application/json' })
        expect(v, `MOCK-01 ${aba}`).toEqual([])
      }
    }
  })
}
