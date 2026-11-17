// Navegação, modo de dados e estrutura comum (ClimaPonto, modo mock: VITE_DATA_MODE=mock).
import { test, expect, snap, settle, horizontalOverflow, axeViolations } from 'harness-e2e'
import { CONSOLE_MAPA, mapaSemRede } from './suporte-mapa.mjs'

// Explorar abre o mapa, que tenta o OpenFreeMap: no gate sem rede a tentativa é abortada (fallback determinístico).
test.use({ allowConsole: CONSOLE_MAPA })
test.beforeEach(async ({ page }) => mapaSemRede(page))

// [rótulo na navegação, rota, título da aba, h1]
const SECOES = [
  ['Visão geral', '/', 'Visão geral · ClimaPonto', 'Visão geral'],
  ['Explorar', '/pontos', 'Explorar · ClimaPonto', 'Explorar pontos'],
  ['Análises', '/analises', 'Análises · ClimaPonto', 'Análises'],
  ['Histórico', '/historico', 'Histórico · ClimaPonto', 'Histórico'],
  ['Laboratório', '/laboratorio', 'Laboratório · ClimaPonto', 'Laboratório'],
  ['Relatórios', '/relatorios', 'Relatórios · ClimaPonto', 'Relatórios'],
]
const PAGES = SECOES.map(([nome, rota, titulo]) => [nome, rota, titulo])

const MOBILE = { width: 375, height: 812 }
const DESKTOP = { width: 1366, height: 900 }
const nav = (page) => page.getByRole('navigation', { name: 'Navegação principal' })
const botaoMenu = (page) => page.getByRole('button', { name: 'Menu', exact: true })
const botaoFixar = (page) => page.getByRole('button', { name: 'Fixar menu lateral' })
const drawer = (page) => page.getByRole('dialog')
const larguraSidebar = (page) => page.locator('[data-sidebar]').evaluate((el) => el.getBoundingClientRect().width)

/**
 * A barra expande ao passar o mouse (200 ms) e, expandida, só mostra o grupo aberto. Para clicar em
 * qualquer seção de forma determinística, tira o mouse da barra e espera o estado compacto antes.
 */
async function irPara(page, nome) {
  await page.mouse.move(900, 500)
  await expect(page.locator('[data-sidebar]')).toHaveAttribute('data-sidebar', 'compact')
  await nav(page).getByRole('link', { name: nome, exact: true }).click()
}

test.describe('desktop: barra lateral', () => {
  test.use({ viewport: DESKTOP })

  test('navegação lateral leva a cada seção, com título, h1 e aria-current', async ({ page }) => {
    await page.goto('/')
    for (const [nome, rota, titulo, h1] of SECOES) {
      await irPara(page, nome)
      await expect(page).toHaveURL(new RegExp(`${rota === '/' ? '/$' : rota + '$'}`))
      await expect(page).toHaveTitle(titulo)
      await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible()
      await expect(nav(page).getByRole('link', { name: nome, exact: true })).toHaveAttribute('aria-current', 'page')
      await expect(nav(page).locator('[aria-current="page"]')).toHaveCount(1)
    }
    await page.getByRole('link', { name: 'ClimaPonto' }).click()
    await expect(page).toHaveTitle('Visão geral · ClimaPonto')
  })

  test('fixar e soltar: aria-pressed, largura, nomes acessíveis e preferência lembrada', async ({ page }) => {
    await page.goto('/')
    const botao = botaoFixar(page)
    await expect(botao).toHaveAttribute('aria-pressed', 'false')
    const estreita = await larguraSidebar(page)
    // compacta: só ícones, mas cada item mantém o nome acessível e o alvo de toque
    for (const [nome] of SECOES) {
      const link = nav(page).getByRole('link', { name: nome, exact: true })
      await expect(link).toBeVisible()
      expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(43.5)
    }
    await expect(nav(page).getByRole('link', { name: 'Visão geral', exact: true })).toHaveAttribute('aria-current', 'page')
    await botao.click()
    await expect(botao).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => larguraSidebar(page)).toBeGreaterThan(estreita + 100)
    const larga = await larguraSidebar(page)
    await page.reload()
    await expect(botaoFixar(page)).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => larguraSidebar(page)).toBeGreaterThanOrEqual(larga - 1)
    await botaoFixar(page).click()
    await expect(botaoFixar(page)).toHaveAttribute('aria-pressed', 'false')
    await page.mouse.move(900, 500)
    await expect.poll(() => larguraSidebar(page)).toBeLessThanOrEqual(estreita + 1)
  })

  test('teclado: Enter e Espaço fixam e soltam, com foco visível no botão', async ({ page }) => {
    await page.goto('/')
    const botao = botaoFixar(page)
    await botao.focus()
    expect(await botao.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none')
    await page.keyboard.press('Enter')
    await expect(botao).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Space')
    await expect(botao).toHaveAttribute('aria-pressed', 'false')
  })

  test('sem menu móvel visível e sem rolagem lateral', async ({ page }) => {
    await page.goto('/')
    await expect(botaoMenu(page)).toBeHidden()
    await settle(page)
    expect(await horizontalOverflow(page)).toEqual([])
  })

  for (const [temaNome, scheme] of [['claro', 'light'], ['escuro', 'dark']]) {
    test(`axe e screenshot da barra lateral (${temaNome})`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'firefox', 'axe-core no Firefox derruba páginas com gráficos (limitação do navegador; coberto no Chromium)')
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await page.goto('/laboratorio')
      await expect(page.getByRole('heading', { level: 1, name: 'Laboratório' })).toBeVisible()
      await settle(page)
      expect(await axeViolations(page)).toEqual([])
      await snap(page, testInfo, `nav-lateral-${temaNome}`)
      await botaoFixar(page).click()
      await settle(page)
      expect(await axeViolations(page)).toEqual([])
      await snap(page, testInfo, `nav-lateral-fixada-${temaNome}`)
    })
  }
})

test.describe('mobile 375 px: menu', () => {
  test.use({ viewport: MOBILE })

  test('barra lateral some e o drawer Menu abre e fecha', async ({ page }) => {
    await page.goto('/')
    await expect(botaoFixar(page)).toBeHidden()
    await expect(nav(page)).toBeHidden()
    await botaoMenu(page).click()
    await expect(drawer(page)).toBeVisible()
    await expect(nav(page).getByRole('link')).toHaveCount(SECOES.length)
    await page.keyboard.press('Escape')
    await expect(nav(page)).toBeHidden()
  })

  test('cada seção é acessível pelo menu, que fecha ao navegar', async ({ page }) => {
    await page.goto('/')
    for (const [nome, rota, titulo] of SECOES) {
      await botaoMenu(page).click()
      await nav(page).getByRole('link', { name: nome, exact: true }).click()
      await expect(page).toHaveTitle(titulo)
      await expect(page).toHaveURL(new RegExp(`${rota === '/' ? '/$' : rota + '$'}`))
      await expect(nav(page)).toBeHidden()
      await botaoMenu(page).click()
      await expect(nav(page).getByRole('link', { name: nome, exact: true })).toHaveAttribute('aria-current', 'page')
      await page.keyboard.press('Escape')
      await expect(nav(page)).toBeHidden()
    }
  })

  test('grupos Explorar, Investigar e Compartilhar aparecem no drawer; Operar não, para visitante', async ({ page }) => {
    await page.goto('/')
    await botaoMenu(page).click()
    for (const grupo of ['Explorar', 'Investigar', 'Compartilhar']) await expect(drawer(page).getByText(grupo, { exact: true }).first()).toBeVisible()
    await expect(drawer(page).getByText('Operar', { exact: true })).toHaveCount(0)
  })

  test('teclado: Enter abre com foco no primeiro item; Esc fecha e devolve o foco ao botão', async ({ page }) => {
    await page.goto('/')
    await botaoMenu(page).focus()
    await page.keyboard.press('Enter')
    await expect(nav(page).getByRole('link', { name: 'Visão geral', exact: true })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(nav(page).getByRole('link', { name: 'Explorar', exact: true })).toBeFocused()
    expect(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)).not.toBe('none')
    await page.keyboard.press('Escape')
    await expect(nav(page)).toBeHidden()
    await expect(botaoMenu(page)).toBeFocused()
  })

  for (const [temaNome, scheme] of [['claro', 'light'], ['escuro', 'dark']]) {
    test(`menu aberto: axe, sem rolagem lateral e screenshot (${temaNome})`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'firefox', 'axe-core no Firefox derruba páginas com gráficos (limitação do navegador; coberto no Chromium)')
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await page.goto('/laboratorio')
      await expect(page.getByRole('heading', { level: 1, name: 'Laboratório' })).toBeVisible()
      await botaoMenu(page).click()
      await expect(nav(page).getByRole('link')).toHaveCount(SECOES.length)
      await settle(page)
      expect(await horizontalOverflow(page)).toEqual([])
      expect(await axeViolations(page)).toEqual([])
      await snap(page, testInfo, `nav-movel-aberta-${temaNome}`)
    })
  }
})

test('rotas antigas e apelidos continuam funcionando', async ({ page }) => {
  await page.goto('/visao-geral')
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/explorar')
  await expect(page).toHaveURL(/\/pontos$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Explorar pontos' })).toBeVisible()
})

test('Análises e Relatórios mostram o mesmo ponto escolhido no Histórico, sem perder os parâmetros', async ({ page }) => {
  await page.goto('/historico?ponto=MOCK-01&periodo=7d')
  await page.getByRole('main').getByRole('link', { name: 'Ver análises' }).click()
  await expect(page).toHaveURL(/\/analises\?ponto=MOCK-01&periodo=7d$/)
  await expect(page.getByRole('region', { name: 'Análises do período' })).toBeVisible()
  await page.getByRole('main').getByRole('link', { name: 'Ver relatórios' }).click()
  await expect(page).toHaveURL(/\/relatorios\?ponto=MOCK-01&periodo=7d$/)
  await expect(page.getByRole('button', { name: 'Exportar relatório (CSV)' })).toBeVisible()
})

test('metodologia fica recolhida por padrão e abre por teclado', async ({ page }) => {
  await page.goto('/relatorios?ponto=MOCK-01&periodo=24h')
  const detalhes = page.locator('details').filter({ hasText: 'Metodologia e premissas' })
  await expect(detalhes).not.toHaveAttribute('open', /.*/)
  const resumo = detalhes.locator('summary')
  await resumo.focus()
  await page.keyboard.press('Enter')
  await expect(detalhes).toHaveAttribute('open', /.*/)
  await expect(detalhes).toContainText('premissa provisória')
})

test('modo mock é sinalizado em todas as páginas e o Supabase não é consultado', async ({ page }) => {
  const externas = []
  page.on('request', (r) => /supabase/i.test(r.url()) && externas.push(r.url()))
  for (const [, rota] of PAGES) {
    await page.goto(rota)
    await expect(page.getByText('Modo de dados: Modo demonstração')).toBeVisible()
    await expect(page.getByRole('note', { name: 'Aviso sobre os dados' })).toContainText('Nenhuma medição real e nenhuma consulta ao Supabase')
  }
  expect(externas).toEqual([])
})

test('rota inexistente mostra a página de não encontrado dentro do layout', async ({ page }) => {
  await page.setViewportSize(DESKTOP)
  await page.goto('/rota-que-nao-existe')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Visão geral', exact: true })).toBeVisible()
})

test('404: título, explicação e link de volta à Visão geral', async ({ page }) => {
  await page.goto('/rota-que-nao-existe')
  await expect(page).toHaveTitle('Página não encontrada · ClimaPonto')
  await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible()
  await expect(page.getByRole('main')).toContainText('Este endereço não existe')
  await expect(page.getByRole('main')).toContainText('O link pode estar incorreto ou a página foi movida.')
  await page.getByRole('main').getByRole('link', { name: 'Voltar para a Visão geral' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeVisible()
})

for (const [vpNome, vp] of [['mobile', { width: 375, height: 812 }], ['desktop', { width: 1366, height: 900 }]]) {
  test(`snap da página 404 (${vpNome})`, async ({ page }, testInfo) => {
    await page.setViewportSize(vp)
    await page.goto('/rota-que-nao-existe')
    await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible()
    await settle(page)
    await snap(page, testInfo, `estado-404-${vpNome}`)
  })
}
