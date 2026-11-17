// Barra lateral: hover-expand em sobreposição (200 ms), pin persistido, teclado, grupos, Operar só para admin
// e drawer "Menu" abaixo de 1280 px (modo mock).
import { test, expect } from 'harness-e2e'
import { CONSOLE_MAPA, mapaSemRede } from './suporte-mapa.mjs'

test.use({ allowConsole: CONSOLE_MAPA })
test.beforeEach(async ({ page }) => mapaSemRede(page))

const DESKTOP = { width: 1366, height: 900 }
const ADMIN = { email: 'admin.demo@climaponto.example', senha: 'demo-admin-2026' }

const lateral = (page) => page.locator('[data-sidebar]')
const nav = (page) => page.getByRole('navigation', { name: 'Navegação principal' })
const pin = (page) => page.getByRole('button', { name: 'Fixar menu lateral' })
const principal = (page) => page.getByRole('main')
const largura = (locator) => locator.evaluate((el) => el.getBoundingClientRect().width)
const caixaPrincipal = async (page) => {
  const { x, width } = await principal(page).evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { x: r.x, width: r.width }
  })
  return { x, width }
}
const sairDaBarra = async (page) => {
  await page.mouse.move(900, 500)
  await expect(lateral(page)).toHaveAttribute('data-sidebar', 'compact')
}

test.describe('desktop', () => {
  test.use({ viewport: DESKTOP })

  test('hover expande em sobreposição sem mudar a largura nem a posição do conteúdo, e recolhe ao sair', async ({ page }) => {
    await page.goto('/')
    await expect(lateral(page)).toHaveAttribute('data-sidebar', 'compact')
    const compacta = await largura(lateral(page))
    const antes = await caixaPrincipal(page)
    await page.mouse.move(40, 400)
    await expect(lateral(page)).toHaveAttribute('data-sidebar', 'expanded')
    expect(await largura(lateral(page))).toBeGreaterThan(compacta + 100)
    // sobreposição: o <main> não se mexe nem muda de largura
    expect(await caixaPrincipal(page)).toEqual(antes)
    // expandida mostra os grupos como botões com aria-expanded
    for (const grupo of ['Explorar', 'Investigar', 'Compartilhar']) await expect(nav(page).getByRole('button', { name: grupo, exact: true })).toBeVisible()
    await sairDaBarra(page)
    expect(await caixaPrincipal(page)).toEqual(antes)
  })

  test('a expansão tem atraso de intenção: passar de raspão não abre', async ({ page }) => {
    await page.goto('/')
    await page.mouse.move(40, 400)
    await page.mouse.move(900, 500)
    await page.waitForTimeout(450)
    await expect(lateral(page)).toHaveAttribute('data-sidebar', 'compact')
  })

  test('pin fixa a barra expandida, ocupa espaço no fluxo e persiste após recarregar', async ({ page }) => {
    await page.goto('/')
    const antes = await caixaPrincipal(page)
    await pin(page).click()
    await expect(pin(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(lateral(page)).toHaveAttribute('data-sidebar', 'expanded')
    const fixada = await caixaPrincipal(page)
    expect(fixada.width).toBeLessThan(antes.width - 100)
    await page.reload()
    await expect(pin(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(lateral(page)).toHaveAttribute('data-sidebar', 'expanded')
    expect(await caixaPrincipal(page)).toEqual(fixada)
    await pin(page).click()
    await expect(pin(page)).toHaveAttribute('aria-pressed', 'false')
    await page.reload()
    await expect(pin(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('grupos: o grupo da rota atual abre e o cabeçalho alterna aria-expanded', async ({ page }) => {
    await page.goto('/analises')
    await pin(page).click()
    const investigar = nav(page).getByRole('button', { name: 'Investigar', exact: true })
    await expect(investigar).toHaveAttribute('aria-expanded', 'true')
    await expect(nav(page).getByRole('link', { name: 'Análises', exact: true })).toHaveAttribute('aria-current', 'page')
    await nav(page).getByRole('button', { name: 'Compartilhar', exact: true }).click()
    await expect(nav(page).getByRole('link', { name: 'Relatórios', exact: true })).toBeVisible()
    await expect(investigar).toHaveAttribute('aria-expanded', 'false')
  })

  test('teclado: Tab percorre os itens sem expandir, com foco visível; Enter navega; o pin opera por Enter', async ({ page }) => {
    await page.goto('/')
    await nav(page).getByRole('link', { name: 'Visão geral', exact: true }).focus()
    await page.keyboard.press('Tab')
    await expect(nav(page).getByRole('link', { name: 'Explorar', exact: true })).toBeFocused()
    expect(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)).not.toBe('none')
    // quem usa teclado não perde o foco por causa de expansão
    await expect(lateral(page)).toHaveAttribute('data-sidebar', 'compact')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/analises$/)
    await pin(page).focus()
    await page.keyboard.press('Enter')
    await expect(pin(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(pin(page)).toBeFocused()
  })

  test('Esc recolhe a expansão por hover', async ({ page }) => {
    await page.goto('/')
    await page.mouse.move(40, 400)
    await expect(lateral(page)).toHaveAttribute('data-sidebar', 'expanded')
    // o Esc é tratado pela barra: o foco precisa estar dentro dela
    await nav(page).getByRole('link', { name: 'Visão geral', exact: true }).focus()
    await page.keyboard.press('Escape')
    await expect(lateral(page)).toHaveAttribute('data-sidebar', 'compact')
  })

  test('visitante não vê Operar nem Administração; o admin vê o grupo Operar', async ({ page }) => {
    await page.goto('/')
    await expect(nav(page).getByRole('link', { name: 'Administração' })).toHaveCount(0)
    await page.mouse.move(40, 400)
    await expect(lateral(page)).toHaveAttribute('data-sidebar', 'expanded')
    await expect(nav(page).getByRole('button', { name: 'Operar', exact: true })).toHaveCount(0)
    await page.goto('/admin/login')
    await page.getByLabel('E-mail').fill(ADMIN.email)
    await page.getByLabel('Senha').fill(ADMIN.senha)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Gerenciar pontos' })).toBeVisible()
    await page.mouse.move(40, 400)
    await expect(lateral(page)).toHaveAttribute('data-sidebar', 'expanded')
    await expect(nav(page).getByRole('button', { name: 'Operar', exact: true })).toHaveAttribute('aria-expanded', 'true')
    await expect(nav(page).getByRole('link', { name: 'Administração', exact: true })).toHaveAttribute('aria-current', 'page')
  })
})

test.describe('abaixo de 1280 px: drawer', () => {
  test('375 px: sem barra lateral nem pin; o botão Menu abre um dialog com a navegação em grupos', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(lateral(page)).toHaveCount(0)
    await expect(pin(page)).toHaveCount(0)
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link')).toHaveCount(6)
    await expect(drawer.getByText('Operar', { exact: true })).toHaveCount(0)
    await drawer.getByRole('button', { name: 'Fechar' }).click()
    await expect(drawer).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeFocused()
  })

  test('1279 px usa o drawer e 1280 px usa a barra lateral', async ({ page }) => {
    await page.setViewportSize({ width: 1279, height: 800 })
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeVisible()
    await expect(lateral(page)).toHaveCount(0)
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(lateral(page)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveCount(0)
  })
})
