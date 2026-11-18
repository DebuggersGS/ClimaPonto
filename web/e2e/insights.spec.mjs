// Insights (Bento compacto, metodologia recolhida) e comparador: layout, teclado, tema e screenshots (modo mock).
import { test, expect, snap, settle, horizontalOverflow, axeViolations } from 'harness-e2e'

const DESKTOP = { width: 1366, height: 900 }
const MOBILE = { width: 375, height: 812 }
// Insights e comparador são abas ("Insights" e "Comparar pontos") da seção "Detalhes" do Dashboard.
const insights = (page) => page.getByRole('tabpanel', { name: 'Insights', exact: true })
const comparar = (page) => page.getByRole('tabpanel', { name: 'Comparar pontos', exact: true })
const abrir = async (page) => {
  await page.goto('/')
  // pelo teclado: a verificação de foco visível depende da modalidade de entrada (clique desliga :focus-visible)
  await page.getByRole('tab', { name: 'Insights', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(insights(page).getByRole('heading', { level: 3, name: 'Estados ambientais gravados' })).toBeVisible()
}
const abrirComparador = async (page) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Comparar pontos', exact: true }).click()
  await expect(comparar(page)).toBeVisible()
}

test.describe('Bento de Insights', () => {
  test('1366 px: cartões compactos lado a lado e sem rolagem horizontal', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await abrir(page)
    await settle(page)
    const cartoes = insights(page).getByRole('list').first().getByRole('listitem')
    await expect(cartoes).toHaveCount(5)
    const caixas = []
    for (let n = 0; n < 5; n++) caixas.push(await cartoes.nth(n).boundingBox())
    expect(caixas.filter((c) => Math.abs(c.y - caixas[1].y) <= 4).length, 'cartões na mesma linha').toBeGreaterThanOrEqual(2)
    for (const c of caixas) expect(c.height, 'cartão compacto').toBeLessThan(220)
    expect(await horizontalOverflow(page)).toEqual([])
  })

  test('375 px: sem rolagem horizontal e metodologia recolhida', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await abrir(page)
    await settle(page)
    expect(await horizontalOverflow(page)).toEqual([])
    await insights(page).getByRole('button', { name: 'Como foi calculado' }).click()
    await expect(insights(page)).toContainText('Como foi calculado')
    expect(await horizontalOverflow(page)).toEqual([])
  })

  test('metodologia: recolhida por padrão e operada só por teclado', async ({ page }) => {
    await abrir(page)
    const botao = insights(page).getByRole('button', { name: 'Como foi calculado' })
    await expect(botao).toHaveAttribute('aria-expanded', 'false')
    await expect(botao).toHaveAttribute('aria-controls', /.+/)
    await botao.focus()
    await expect(botao).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(botao).toHaveAttribute('aria-expanded', 'true')
    await expect(insights(page)).toContainText('não é classificação ambiental')
    await page.keyboard.press('Space')
    await expect(botao).toHaveAttribute('aria-expanded', 'false')
    await expect(insights(page)).not.toContainText('não é classificação ambiental')
  })

  test('h1 único e hierarquia sem saltos', async ({ page }) => {
    await abrir(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 2, name: 'Detalhes' })).toHaveCount(1)
    await expect(insights(page).getByRole('heading', { level: 3 })).toHaveCount(5)
  })
})

test.describe('Comparador de dois pontos', () => {
  const botao = (page) => page.getByRole('button', { name: 'Comparar dois pontos' })
  const A = (page) => page.getByRole('combobox', { name: 'Ponto A' })
  const B = (page) => page.getByRole('combobox', { name: 'Ponto B' })

  test('recolhido por padrão; ao abrir mostra selects rotulados e orientação', async ({ page }) => {
    await abrirComparador(page)
    await expect(botao(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('combobox', { name: 'Ponto A' })).toHaveCount(0)
    await botao(page).click()
    await expect(botao(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(A(page)).toBeVisible()
    await expect(B(page)).toBeVisible()
    const periodo = page.getByRole('combobox', { name: 'Período' })
    await expect(periodo.locator('option')).toHaveText(['Últimas 24 horas', 'Últimos 7 dias', 'Últimos 30 dias'])
    await expect(page.getByText('Comparação descritiva entre pontos; não é classificação ambiental.')).toBeVisible()
    await expect(page.getByText('Selecione dois pontos diferentes para comparar.')).toBeVisible()
  })

  test('o ponto escolhido some do outro select', async ({ page }) => {
    await abrirComparador(page)
    await botao(page).click()
    await A(page).selectOption('MOCK-01')
    await expect(B(page).locator('option[value="MOCK-01"]')).toHaveCount(0)
    await B(page).selectOption('MOCK-02')
    await expect(A(page).locator('option[value="MOCK-02"]')).toHaveCount(0)
  })

  test('compara dois pontos de simulação: n, origem, intervalo, unidades e diferença', async ({ page }) => {
    await abrirComparador(page)
    await botao(page).click()
    await A(page).selectOption('MOCK-01')
    await B(page).selectOption('MOCK-02')
    const regiao = comparar(page)
    await expect(regiao.getByText(/^Origem:/)).toContainText('Simulação')
    await expect(regiao.getByText(/Intervalo comparado: .+ a .+/)).toBeVisible()
    await expect(regiao.getByRole('heading', { level: 4, name: 'Temperatura' })).toBeVisible()
    await expect(regiao.getByRole('heading', { level: 4, name: 'Umidade' })).toBeVisible()
    await expect(regiao).toContainText(/\d+ leituras? · mín\. .+°C · média .+°C · máx\. .+°C/)
    await expect(regiao).toContainText(/\d+ leituras? · mín\. .+% · média .+% · máx\. .+%/)
    await expect(regiao).toContainText(/Diferença de médias \(A − B\): [+−-]?[\d,]+\u00A0?°C/)
    await expect(regiao).toContainText('Não tratar como medição real')
  })

  test('origens diferentes: explica o motivo de não ser comparável', async ({ page }) => {
    await abrirComparador(page)
    await botao(page).click()
    await A(page).selectOption('MOCK-01')
    await B(page).selectOption('MOCK-08')
    await expect(comparar(page)).toContainText('Não comparável:')
    await expect(comparar(page).getByRole('heading', { level: 4 })).toHaveCount(0)
  })

  test('operação só por teclado', async ({ page }) => {
    await abrirComparador(page)
    await botao(page).focus()
    await page.keyboard.press('Enter')
    await expect(A(page)).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(A(page)).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Tab')
    await expect(B(page)).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(comparar(page).getByRole('heading', { level: 4, name: 'Temperatura' }).or(comparar(page).getByText(/Não comparável:/))).toBeVisible()
  })

  // Nota: ?mock=erro derruba também a lista de pontos, então o erro do comparador com "Tentar novamente"
  // não é alcançável no mock; fica como cobertura pendente.
})

for (const [vpNome, vp] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  for (const [temaNome, scheme] of [['claro', 'light'], ['escuro', 'dark']]) {
    test.describe(`${vpNome} ${temaNome}`, () => {
      test.use({ viewport: vp })
      test.beforeEach(async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        await abrir(page)
      })

      test('axe sem violações e foco visível com Insights recolhido', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'firefox', 'axe-core no Firefox derruba a página com gráficos (limitação do navegador; coberto no Chromium)')
        await settle(page)
        expect(await axeViolations(page)).toEqual([])
        await insights(page).getByRole('button', { name: 'Como foi calculado' }).focus()
        const contorno = await page.evaluate(() => {
          const cs = getComputedStyle(document.activeElement)
          return parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none'
        })
        expect(contorno, 'contorno de foco').toBe(true)
        await snap(page, testInfo, `insights-recolhido-${vpNome}-${temaNome}`)
      })

      test('axe sem violações com comparador aberto e comparação feita', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'firefox', 'axe-core no Firefox derruba a página com gráficos (limitação do navegador; coberto no Chromium)')
        await page.getByRole('tab', { name: 'Comparar pontos', exact: true }).click()
        await page.getByRole('button', { name: 'Comparar dois pontos' }).click()
        await page.getByRole('combobox', { name: 'Ponto A' }).selectOption('MOCK-01')
        await page.getByRole('combobox', { name: 'Ponto B' }).selectOption('MOCK-02')
        await expect(comparar(page).getByRole('heading', { level: 4, name: 'Temperatura' })).toBeVisible()
        await settle(page)
        expect(await axeViolations(page)).toEqual([])
        expect(await horizontalOverflow(page)).toEqual([])
        await snap(page, testInfo, `comparador-aberto-${vpNome}-${temaNome}`)
      })
    })
  }
}

test('movimento reduzido: o painel da metodologia abre sem animação em curso', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await abrir(page)
  await insights(page).getByRole('button', { name: 'Como foi calculado' }).click()
  const animando = await page.evaluate(
    () => document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.playState === 'running').length,
  )
  expect(animando).toBe(0)
})
