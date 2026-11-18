// Ficha do ponto: recolhida por padrão, painel lateral (1366 px), bottom sheet (375 px), link direto e a11y (modo mock).
import { test, expect, snap, settle, horizontalOverflow, axeViolations } from 'harness-e2e'
import { CONSOLE_MAPA, abrirExplorarSemMapa, botaoDoPonto, listaDoMapa, mapaSemRede } from './suporte-mapa.mjs'

test.use({ allowConsole: CONSOLE_MAPA })

const DESKTOP = { width: 1366, height: 900 }
const MOBILE = { width: 375, height: 812 }

// Sem rede o mapa cai na lista de reserva; o botão de cada ponto faz o papel do marcador.
const marcador = (page, codigo) => botaoDoPonto(page, codigo)
const painel = (page, nome) => page.getByRole('complementary', { name: nome })
const folha = (page, nome) => page.getByRole('dialog', { name: nome })

/** Link direto com ?ponto= em 375 px: a folha modal abre de imediato e deixa o resto da página inerte. */
async function abrirComFicha(page, url) {
  await mapaSemRede(page)
  await page.goto(url)
}

async function abrir(page, url = '/pontos') {
  await abrirExplorarSemMapa(page, url)
  await expect(listaDoMapa(page).getByRole('button')).toHaveCount(8)
}

test.describe('desktop (1366 px): painel lateral', () => {
  test.use({ viewport: DESKTOP })

  test('nenhuma ficha ao entrar; clicar no marcador abre o painel ao lado do mapa e grava ?ponto=', async ({ page }) => {
    await abrir(page)
    await expect(page.getByRole('complementary')).toHaveCount(0)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await marcador(page, 'MOCK-02').click()
    await expect(page).toHaveURL(/ponto=MOCK-02/)
    const p = painel(page, 'Largo da Batata')
    await expect(p).toBeVisible()
    await expect(p).toContainText('MOCK-02')
    await expect(p).toContainText('Pinheiros')
    await expect(p).toContainText('-23,5669, -46,6918')
    await expect(p).toContainText('°C')
    await expect(p).toContainText('Estado ambiental')
    await expect(p).toContainText('Conectividade')
    await expect(p).toContainText('Provisória')
    await expect(p).toContainText('Simulação — não é medição real')
    await expect(p.getByRole('link', { name: 'Ver histórico' })).toHaveAttribute('href', /ponto=MOCK-02/)
    const a = await p.boundingBox()
    const b = await listaDoMapa(page).boundingBox()
    expect(a.x).toBeGreaterThanOrEqual(b.x + b.width - 1)
    await p.getByRole('button', { name: 'Fechar' }).click()
    await expect(page.getByRole('complementary')).toHaveCount(0)
    await expect(page).not.toHaveURL(/ponto=/)
    await expect(marcador(page, 'MOCK-02')).toBeFocused()
  })

  test('na lista, Enter em "Ver ficha" abre a ficha', async ({ page }) => {
    await page.goto('/pontos?vista=lista')
    const botao = page.getByRole('button', { name: 'Ver ficha de Terminal Parque Dom Pedro II' })
    await botao.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/ponto=MOCK-03/)
    await expect(painel(page, 'Terminal Parque Dom Pedro II')).toBeVisible()
  })

  test('link direto abre a ficha; MOCK-04 mostra "Sem dados" e nenhum valor; MOCK-08 é demonstrativo', async ({ page }) => {
    await abrirExplorarSemMapa(page, '/pontos?ponto=MOCK-04')
    const p = painel(page, /./)
    await expect(p).toBeVisible()
    await expect(p).toContainText('Sem dados')
    await expect(p).not.toContainText('°C')
    await abrirExplorarSemMapa(page, '/pontos?ponto=MOCK-08')
    await expect(painel(page, /./)).toContainText('Demonstrativo')
    await expect(painel(page, /./)).toContainText('Teste — visível só para administradores')
  })

  test('código inexistente é ignorado, sem erro', async ({ page }) => {
    await abrir(page, '/pontos?ponto=NAO-EXISTE')
    await expect(page.getByRole('complementary')).toHaveCount(0)
    // o único alerta é o aviso do mapa abortado, não um erro da ficha
    await expect(page.getByRole('alert')).toHaveCount(1)
  })

  for (const colorScheme of ['light', 'dark']) {
    test(`axe-core e captura com a ficha aberta (tema ${colorScheme})`, async ({ page }, testInfo) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await abrir(page, '/pontos?ponto=MOCK-03')
      await expect(painel(page, /./)).toBeVisible()
      await settle(page)
      const v = await axeViolations(page)
      await testInfo.attach(`axe-ficha-desktop-${colorScheme}`, { body: JSON.stringify(v, null, 2), contentType: 'application/json' })
      expect(v).toEqual([])
      expect(await horizontalOverflow(page)).toEqual([])
      await snap(page, testInfo, `pontos-ficha-desktop-${colorScheme}`)
    })
  }
})

test.describe('mobile (375 px): bottom sheet', () => {
  test.use({ viewport: MOBILE })

  test('abre como diálogo modal; Fechar e Esc fecham e devolvem o foco ao marcador', async ({ page }) => {
    await abrir(page)
    await marcador(page, 'MOCK-02').click()
    const d = folha(page, 'Largo da Batata')
    await expect(d).toBeVisible()
    await expect(page).toHaveURL(/ponto=MOCK-02/)
    expect(await horizontalOverflow(page)).toEqual([])
    await d.getByRole('button', { name: 'Fechar' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(marcador(page, 'MOCK-02')).toBeFocused()
    await marcador(page, 'MOCK-02').click()
    await expect(folha(page, 'Largo da Batata')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page).not.toHaveURL(/ponto=/)
    await expect(marcador(page, 'MOCK-02')).toBeFocused()
  })

  test('movimento reduzido: a folha entra sem animação', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await abrirComFicha(page, '/pontos?ponto=MOCK-02')
    const nome = await folha(page, 'Largo da Batata').evaluate((el) => getComputedStyle(el).animationName)
    expect(nome).toBe('none')
  })

  for (const colorScheme of ['light', 'dark']) {
    test(`axe-core e captura com o bottom sheet aberto (tema ${colorScheme})`, async ({ page }, testInfo) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await abrirComFicha(page, '/pontos?ponto=MOCK-03')
      await expect(folha(page, /./)).toBeVisible()
      await settle(page)
      const v = await axeViolations(page)
      await testInfo.attach(`axe-ficha-mobile-${colorScheme}`, { body: JSON.stringify(v, null, 2), contentType: 'application/json' })
      expect(v).toEqual([])
      expect(await horizontalOverflow(page)).toEqual([])
      await snap(page, testInfo, `pontos-ficha-mobile-${colorScheme}`)
    })
  }
})
