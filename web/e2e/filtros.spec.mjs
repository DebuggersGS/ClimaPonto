// Busca, filtros e insights (modo mock): Dashboard, Pontos, estado vazio, "Limpar filtros", teclado,
// axe, movimento reduzido e 375 px (visitante e admin mock).
// Dataset determinístico: MOCK-01 Consolação (normal), MOCK-02 Pinheiros (atenção), MOCK-03 Sé (crítico),
// MOCK-04 Interlagos (sem dados), MOCK-05 Sapopemba (atrasado), MOCK-06 Jabaquara (offline),
// MOCK-07 Itaim Bibi (histórico longo), MOCK-08 Lapa (teste/demonstrativo). Os valores numéricos de
// temperatura e umidade dependem do instante e por isso não são afirmados aqui.
import { test, expect, settle, horizontalOverflow, axeViolations } from 'harness-e2e'

const ADMIN = { email: 'admin.demo@climaponto.example', senha: 'demo-admin-2026' }

const busca = (page) => page.getByRole('searchbox', { name: 'Buscar pontos' })
const contagem = (page) => page.getByRole('status').filter({ hasText: /^Mostrando / })
const grupoEstado = (page) => page.getByRole('group', { name: 'Filtrar por estado ambiental' })
const grupoConect = (page) => page.getByRole('group', { name: 'Filtrar por conectividade' })
const limpar = (page) => page.getByRole('button', { name: 'Limpar filtros' })
const vazio = (page) => page.getByRole('heading', { name: 'Nenhum ponto encontrado' })

const monitorados = (page) => page.getByRole('region', { name: 'Pontos monitorados' })
const cardsDash = (page) => monitorados(page).getByRole('listitem')
const itensPontos = (page) => page.getByRole('main').getByRole('list').first().getByRole('listitem')

async function abrirDashboard(page) {
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Resumo', exact: true })).toBeVisible()
  await expect(cardsDash(page)).toHaveCount(8)
}

async function abrirPontos(page) {
  await page.goto('/pontos')
  await expect(itensPontos(page)).toHaveCount(8)
}

/** Texto visível (innerText) das regiões que NÃO podem mudar com os filtros da lista. */
const textosFixos = (page) =>
  Promise.all(['Resumo', 'Última medição', 'Evolução recente', 'Insights'].map((nome) => page.getByRole('region', { name: nome, exact: true }).innerText()))

// ---------------------------------------------------------------- Dashboard

test.describe('Dashboard: busca e filtros', () => {
  test.beforeEach(async ({ page }) => abrirDashboard(page))

  test('estado inicial: busca rotulada com dica, contagem e grupos de filtro', async ({ page }) => {
    await expect(busca(page)).toBeVisible()
    await expect(page.getByText('Por nome, código ou bairro')).toBeVisible()
    await expect(contagem(page)).toHaveText('Mostrando 8 de 8 pontos')
    await expect(contagem(page)).toHaveAttribute('aria-live', 'polite')
    await expect(contagem(page)).toHaveAttribute('aria-atomic', 'true')
    await expect(limpar(page)).toHaveCount(0)
    for (const grupo of [grupoEstado(page), grupoConect(page)]) {
      await expect(grupo.getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute('aria-pressed', 'true')
    }
    // só valores presentes no dataset, com contagem
    for (const nome of ['Normal (5)', 'Atenção (1)', 'Crítico (1)']) await expect(grupoEstado(page).getByRole('button', { name: nome, exact: true })).toBeVisible()
    for (const nome of ['Online (5)', 'Atrasado (1)', 'Offline (1)', 'Sem dados (1)']) await expect(grupoConect(page).getByRole('button', { name: nome, exact: true })).toBeVisible()
    // o Dashboard não oferece filtro por bairro
    await expect(page.getByRole('combobox', { name: 'Bairro' })).toHaveCount(0)
  })

  test('busca por nome, código e bairro, sem diferenciar acentos nem caixa', async ({ page }) => {
    await busca(page).fill('paulista')
    await expect(cardsDash(page)).toHaveCount(1)
    await expect(cardsDash(page).first()).toContainText('MOCK-01')
    await expect(contagem(page)).toHaveText('Mostrando 1 de 8 pontos')

    await busca(page).fill('mock-03')
    await expect(cardsDash(page)).toHaveCount(1)
    await expect(cardsDash(page).first()).toContainText('Terminal Parque Dom Pedro II')

    await busca(page).fill('CONSOLACAO')
    await expect(cardsDash(page)).toHaveCount(1)
    await expect(cardsDash(page).first()).toContainText('MOCK-01')

    await busca(page).fill('terminal')
    await expect(cardsDash(page)).toHaveCount(2)
    await expect(contagem(page)).toHaveText('Mostrando 2 de 8 pontos')
  })

  test('filtro por estado ambiental gravado', async ({ page }) => {
    const critico = grupoEstado(page).getByRole('button', { name: 'Crítico (1)' })
    await critico.click()
    await expect(critico).toHaveAttribute('aria-pressed', 'true')
    await expect(grupoEstado(page).getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute('aria-pressed', 'false')
    await expect(cardsDash(page)).toHaveCount(1)
    await expect(cardsDash(page).first()).toContainText('MOCK-03')
    await expect(contagem(page)).toHaveText('Mostrando 1 de 8 pontos')

    await grupoEstado(page).getByRole('button', { name: 'Normal (5)' }).click()
    await expect(cardsDash(page)).toHaveCount(5)
    await expect(monitorados(page)).not.toContainText('MOCK-04')
  })

  test('filtro por conectividade, combinado por E lógico com estado e busca', async ({ page }) => {
    await grupoConect(page).getByRole('button', { name: 'Offline (1)' }).click()
    await expect(cardsDash(page)).toHaveCount(1)
    await expect(cardsDash(page).first()).toContainText('MOCK-06')

    await grupoConect(page).getByRole('button', { name: 'Sem dados (1)' }).click()
    await expect(cardsDash(page)).toHaveCount(1)
    await expect(cardsDash(page).first()).toContainText('MOCK-04')

    await grupoConect(page).getByRole('button', { name: 'Online (5)' }).click()
    await grupoEstado(page).getByRole('button', { name: 'Atenção (1)' }).click()
    await expect(cardsDash(page)).toHaveCount(1)
    await expect(cardsDash(page).first()).toContainText('MOCK-02')
    await busca(page).fill('lapa')
    await expect(vazio(page)).toBeVisible()
  })

  test('Resumo, Última medição, Evolução recente e Insights não mudam com os filtros', async ({ page }) => {
    const antes = await textosFixos(page)
    await busca(page).fill('sapopemba')
    await grupoEstado(page).getByRole('button', { name: 'Normal (5)' }).click()
    await grupoConect(page).getByRole('button', { name: 'Atrasado (1)' }).click()
    await expect(cardsDash(page)).toHaveCount(1)
    expect(await textosFixos(page)).toEqual(antes)
    await busca(page).fill('zzz-inexistente')
    await expect(vazio(page)).toBeVisible()
    expect(await textosFixos(page)).toEqual(antes)
    await limpar(page).first().click()
    await expect(cardsDash(page)).toHaveCount(8)
    expect(await textosFixos(page)).toEqual(antes)
  })

  test('estado vazio e Limpar filtros restauram busca, filtros e lista', async ({ page }) => {
    await busca(page).fill('zzz-inexistente')
    await expect(vazio(page)).toBeVisible()
    await expect(page.getByText('Nenhum ponto corresponde à busca e aos filtros escolhidos.')).toBeVisible()
    await expect(contagem(page)).toHaveText('Mostrando 0 de 8 pontos')
    await expect(cardsDash(page)).toHaveCount(0)
    // um botão junto da contagem e outro no estado vazio
    await expect(limpar(page)).toHaveCount(2)

    await limpar(page).last().click()
    await expect(vazio(page)).toHaveCount(0)
    await expect(busca(page)).toHaveValue('')
    await expect(cardsDash(page)).toHaveCount(8)
    await expect(contagem(page)).toHaveText('Mostrando 8 de 8 pontos')
    await expect(limpar(page)).toHaveCount(0)

    await busca(page).fill('lapa')
    await grupoEstado(page).getByRole('button', { name: 'Crítico (1)' }).click()
    await expect(vazio(page)).toBeVisible()
    await limpar(page).first().click()
    await expect(busca(page)).toHaveValue('')
    await expect(grupoEstado(page).getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(cardsDash(page)).toHaveCount(8)
  })
})

test.describe('Dashboard: insights', () => {
  test.beforeEach(async ({ page }) => abrirDashboard(page))

  const insights = (page) => page.getByRole('region', { name: 'Insights', exact: true })

  test('seção entre Evolução recente e Pontos monitorados, com fonte dos dados', async ({ page }) => {
    const titulos = await page.getByRole('heading', { level: 2 }).allTextContents()
    const i = titulos.indexOf('Insights')
    expect(i).toBeGreaterThan(-1)
    expect(titulos[i - 1]).toBe('Evolução recente')
    expect(titulos[i + 1]).toBe('Pontos monitorados')
    await expect(insights(page).getByText(/^Fonte:/)).toBeVisible()
  })

  test('cinco insights deterministas, cada um com título, texto e "Como foi calculado"', async ({ page }) => {
    const itens = insights(page).getByRole('listitem')
    await expect(itens).toHaveCount(5)
    await expect(insights(page).getByRole('heading', { level: 3 })).toHaveText([
      'Estados ambientais gravados',
      'Temperatura: maior e menor',
      'Umidade: maior e menor',
      'Pontos sem leitura recente',
      'Há leituras que não são medição real',
    ])
    await expect(itens.filter({ hasText: /^Como foi calculado/ })).toHaveCount(0)
    for (let n = 0; n < 5; n++) await expect(itens.nth(n)).toContainText('Como foi calculado:')

    await expect(itens.nth(0)).toContainText('Normal: 5; Atenção: 1; Crítico: 1.')
    await expect(itens.nth(0)).toContainText('não é recalculado a partir de temperatura ou umidade')
    // MOCK-03 é o ponto com a temperatura mais alta (clamp 36–41 °C; os demais ficam abaixo)
    await expect(itens.nth(1)).toContainText(/Maior: \d+,\d °C em Terminal Parque Dom Pedro II \(MOCK-03\)\./)
    await expect(itens.nth(1)).toContainText('não é classificação ambiental')
    await expect(itens.nth(2)).toContainText(/Maior: .*Menor: /)
    await expect(itens.nth(3)).toContainText('2 pontos offline ou sem dados.')
    await expect(itens.nth(4)).toContainText('7 pontos com última leitura de simulação, teste ou origem desconhecida')
    await expect(insights(page)).not.toContainText('Dados insuficientes')
  })
})

// ---------------------------------------------------------------- Pontos

test.describe('Pontos: busca e bairro', () => {
  test.beforeEach(async ({ page }) => abrirPontos(page))

  test('sem filtros de estado ambiental ou conectividade; só busca e bairro', async ({ page }) => {
    await expect(busca(page)).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Bairro' })).toBeVisible()
    await expect(grupoEstado(page)).toHaveCount(0)
    await expect(grupoConect(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^(Normal|Online|Offline)/ })).toHaveCount(0)
    await expect(contagem(page)).toHaveText('Mostrando 8 de 8 pontos')
  })

  test('select Bairro lista "Todos os bairros" e cada bairro com contagem', async ({ page }) => {
    const bairro = page.getByRole('combobox', { name: 'Bairro' })
    const opcoes = await bairro.locator('option').allTextContents()
    expect(opcoes[0]).toBe('Todos os bairros')
    expect(opcoes).toHaveLength(9)
    for (const b of ['Consolação', 'Pinheiros', 'Sé', 'Interlagos', 'Sapopemba', 'Jabaquara', 'Itaim Bibi', 'Lapa']) expect(opcoes).toContain(`${b} (1)`)

    await bairro.selectOption({ label: 'Pinheiros (1)' })
    await expect(itensPontos(page)).toHaveCount(1)
    await expect(itensPontos(page).first()).toContainText('MOCK-02')
    await expect(contagem(page)).toHaveText('Mostrando 1 de 8 pontos')
    await expect(limpar(page)).toHaveCount(1)
  })

  test('busca por nome, código e bairro; combinação com bairro', async ({ page }) => {
    await busca(page).fill('batata')
    await expect(itensPontos(page)).toHaveCount(1)
    await busca(page).fill('mock-08')
    await expect(itensPontos(page).first()).toContainText('Demonstrativo')
    await busca(page).fill('jabaquara')
    await expect(itensPontos(page)).toHaveCount(1)
    await expect(itensPontos(page).first()).toContainText('MOCK-06')

    await busca(page).fill('')
    await page.getByRole('combobox', { name: 'Bairro' }).selectOption({ label: 'Pinheiros (1)' })
    await busca(page).fill('paulista')
    await expect(vazio(page)).toBeVisible()
  })

  test('estado vazio e Limpar filtros restauram a lista', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Bairro' }).selectOption({ label: 'Lapa (1)' })
    await busca(page).fill('zzz-inexistente')
    await expect(vazio(page)).toBeVisible()
    await expect(contagem(page)).toHaveText('Mostrando 0 de 8 pontos')
    await expect(page.getByRole('link', { name: 'Ver histórico' })).toHaveCount(0)
    await expect(limpar(page)).toHaveCount(2)
    await limpar(page).last().click()
    await expect(vazio(page)).toHaveCount(0)
    await expect(busca(page)).toHaveValue('')
    await expect(page.getByRole('combobox', { name: 'Bairro' })).toHaveValue('')
    await expect(itensPontos(page)).toHaveCount(8)
    await expect(contagem(page)).toHaveText('Mostrando 8 de 8 pontos')
  })
})

// ---------------------------------------------------------------- teclado

test('teclado (Dashboard): busca, grupos de filtro e Limpar filtros operáveis sem mouse, com foco visível', async ({ page }) => {
  await abrirDashboard(page)
  const foco = () =>
    page.evaluate(() => {
      const el = document.activeElement
      const cs = getComputedStyle(el)
      return { nome: el.textContent?.trim() || el.getAttribute('type') || el.tagName, outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 }
    })
  await busca(page).focus()
  await page.keyboard.type('mock')
  await expect(contagem(page)).toHaveText('Mostrando 8 de 8 pontos')
  // Tab percorre os botões do grupo de estado ambiental na ordem visual, cada um com foco visível
  for (const nome of ['Todos', 'Normal (5)', 'Atenção (1)', 'Crítico (1)']) {
    await page.keyboard.press('Tab')
    const f = await foco()
    expect(f.nome).toBe(nome)
    expect(f.outline, `foco visível em ${nome}`).toBe(true)
  }
  await page.keyboard.press('Enter')
  await expect(grupoEstado(page).getByRole('button', { name: 'Crítico (1)' })).toHaveAttribute('aria-pressed', 'true')
  await expect(cardsDash(page)).toHaveCount(1)
  // o botão "Limpar filtros" junto da contagem é alcançável por Tab e acionável pelo teclado
  await limpar(page).first().focus()
  expect((await foco()).outline).toBe(true)
  await page.keyboard.press('Enter')
  await expect(cardsDash(page)).toHaveCount(8)
  await expect(grupoEstado(page).getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute('aria-pressed', 'true')
  // conectividade pela barra de espaço
  await grupoConect(page).getByRole('button', { name: 'Offline (1)' }).focus()
  await page.keyboard.press('Space')
  await expect(cardsDash(page)).toHaveCount(1)
})

test('teclado (Pontos): busca e bairro operáveis sem mouse', async ({ page }) => {
  await abrirPontos(page)
  await busca(page).focus()
  await page.keyboard.type('sapopemba')
  await expect(itensPontos(page)).toHaveCount(1)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('combobox', { name: 'Bairro' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(limpar(page).first()).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(itensPontos(page)).toHaveCount(8)
  await expect(busca(page)).toHaveValue('')
})

// ---------------------------------------------------------------- axe

// Firefox: o axe derruba a página com gráficos Recharts (limitação já documentada em qualidade.spec.mjs);
// as regras avaliam o DOM e independem do motor, então o Dashboard é coberto no Chromium.
const ehFirefox = (testInfo) => testInfo.project.name === 'firefox'

for (const colorScheme of ['light', 'dark']) {
  test(`axe-core: Dashboard com filtros aplicados (tema ${colorScheme})`, async ({ page }, testInfo) => {
    test.skip(ehFirefox(testInfo), 'axe-core no Firefox derruba a página com gráficos (limitação do navegador; coberto no Chromium)')
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await abrirDashboard(page)
    await grupoEstado(page).getByRole('button', { name: 'Normal (5)' }).click()
    await grupoConect(page).getByRole('button', { name: 'Online (5)' }).click()
    await busca(page).fill('mock')
    await expect(cardsDash(page)).toHaveCount(4)
    await settle(page)
    const v = await axeViolations(page)
    await testInfo.attach(`axe-dashboard-filtros-${colorScheme}`, { body: JSON.stringify(v, null, 2), contentType: 'application/json' })
    expect(v).toEqual([])
  })

  test(`axe-core: Dashboard sem resultados (tema ${colorScheme})`, async ({ page }, testInfo) => {
    test.skip(ehFirefox(testInfo), 'axe-core no Firefox derruba a página com gráficos (limitação do navegador; coberto no Chromium)')
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await abrirDashboard(page)
    await busca(page).fill('zzz-inexistente')
    await expect(vazio(page)).toBeVisible()
    await settle(page)
    const v = await axeViolations(page)
    await testInfo.attach(`axe-dashboard-vazio-${colorScheme}`, { body: JSON.stringify(v, null, 2), contentType: 'application/json' })
    expect(v).toEqual([])
  })

  test(`axe-core: Pontos com filtros aplicados (tema ${colorScheme})`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await abrirPontos(page)
    await page.getByRole('combobox', { name: 'Bairro' }).selectOption({ label: 'Pinheiros (1)' })
    await expect(itensPontos(page)).toHaveCount(1)
    await settle(page)
    const v = await axeViolations(page)
    await testInfo.attach(`axe-pontos-filtros-${colorScheme}`, { body: JSON.stringify(v, null, 2), contentType: 'application/json' })
    expect(v).toEqual([])
  })

  test(`axe-core: Pontos sem resultados (tema ${colorScheme})`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await abrirPontos(page)
    await busca(page).fill('zzz-inexistente')
    await expect(vazio(page)).toBeVisible()
    await settle(page)
    const v = await axeViolations(page)
    await testInfo.attach(`axe-pontos-vazio-${colorScheme}`, { body: JSON.stringify(v, null, 2), contentType: 'application/json' })
    expect(v).toEqual([])
  })
}

// ---------------------------------------------------------------- movimento reduzido

test.describe('movimento reduzido: aplicar e limpar filtros', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  // Medido logo após cada ação (sem settle): nenhum elemento do conteúdo com translação
  // e nenhuma animação finita em execução.
  const semMovimento = (page, rotulo) =>
    page.evaluate(() => {
      const deslocados = [...document.querySelectorAll('main *')].flatMap((el) => {
        const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/)
        if (!m) return []
        const [, , , , tx, ty] = m[1].split(',').map(Number)
        return Math.abs(tx) > 0.5 || Math.abs(ty) > 0.5 ? [`${el.tagName.toLowerCase()} tx=${tx} ty=${ty}`] : []
      })
      const animacoes = document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.playState === 'running')
        .map((a) => a.animationName || a.id || a.constructor.name)
      return { deslocados, animacoes }
    }).then((r) => {
      expect(r.deslocados, `${rotulo}: elementos com translação`).toEqual([])
      expect(r.animacoes, `${rotulo}: animações finitas em execução`).toEqual([])
    })

  test('Dashboard: aplicar filtros, estado vazio e limpar', async ({ page }) => {
    await abrirDashboard(page)
    await grupoEstado(page).getByRole('button', { name: 'Normal (5)' }).click()
    await expect(cardsDash(page)).toHaveCount(5)
    await semMovimento(page, 'Dashboard: filtro de estado')
    await grupoConect(page).getByRole('button', { name: 'Online (5)' }).click()
    await semMovimento(page, 'Dashboard: filtro de conectividade')
    await busca(page).fill('zzz-inexistente')
    await expect(vazio(page)).toBeVisible()
    await semMovimento(page, 'Dashboard: estado vazio')
    await limpar(page).last().click()
    await expect(cardsDash(page)).toHaveCount(8)
    await semMovimento(page, 'Dashboard: limpar filtros')
  })

  test('Pontos: aplicar filtros, estado vazio e limpar', async ({ page }) => {
    await abrirPontos(page)
    await page.getByRole('combobox', { name: 'Bairro' }).selectOption({ label: 'Lapa (1)' })
    await expect(itensPontos(page)).toHaveCount(1)
    await semMovimento(page, 'Pontos: bairro')
    await busca(page).fill('zzz-inexistente')
    await expect(vazio(page)).toBeVisible()
    await semMovimento(page, 'Pontos: estado vazio')
    await limpar(page).last().click()
    await expect(itensPontos(page)).toHaveCount(8)
    await semMovimento(page, 'Pontos: limpar filtros')
  })
})

// ---------------------------------------------------------------- 375 px

test.describe('mobile 375 px', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  /** Cada item da navegação: inteiramente visível na janela e com alvo de pelo menos 44 px. */
  async function verificarNavegacao(page, esperados, rotulo) {
    const nav = page.getByRole('navigation', { name: 'Navegação principal' })
    const links = nav.getByRole('link')
    await expect(links).toHaveText(esperados)
    for (let i = 0; i < esperados.length; i++) {
      const caixa = await links.nth(i).boundingBox()
      expect(caixa, `${rotulo}: ${esperados[i]} sem caixa`).not.toBeNull()
      expect(caixa.x, `${rotulo}: ${esperados[i]} cortado à esquerda`).toBeGreaterThanOrEqual(0)
      expect(caixa.x + caixa.width, `${rotulo}: ${esperados[i]} cortado à direita`).toBeLessThanOrEqual(375.5)
      expect(caixa.height, `${rotulo}: ${esperados[i]} com alvo pequeno`).toBeGreaterThanOrEqual(43.5)
      await expect(links.nth(i)).toBeInViewport({ ratio: 1 })
    }
    // sem rolagem interna: a lista cabe na própria largura
    const rolagem = await nav.locator('ul').evaluate((ul) => ul.scrollWidth - ul.clientWidth)
    expect(rolagem, `${rotulo}: navegação com rolagem interna`).toBeLessThanOrEqual(0)
    expect(await horizontalOverflow(page), `${rotulo}: rolagem lateral`).toEqual([])
    const doc = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(doc, `${rotulo}: documento maior que a janela`).toBeLessThanOrEqual(0)
  }

  const PUBLICOS = ['Dashboard', 'Pontos', 'Histórico']

  test('visitante: navegação, filtros e estado vazio sem rolagem lateral (Dashboard e Pontos)', async ({ page }) => {
    await abrirDashboard(page)
    await settle(page)
    await verificarNavegacao(page, PUBLICOS, 'Dashboard')
    await grupoEstado(page).getByRole('button', { name: 'Normal (5)' }).click()
    await grupoConect(page).getByRole('button', { name: 'Online (5)' }).click()
    await expect(cardsDash(page)).toHaveCount(4)
    await settle(page)
    await verificarNavegacao(page, PUBLICOS, 'Dashboard com filtros')
    await busca(page).fill('zzz-inexistente')
    await expect(vazio(page)).toBeVisible()
    await settle(page)
    await verificarNavegacao(page, PUBLICOS, 'Dashboard sem resultados')

    await abrirPontos(page)
    await settle(page)
    await verificarNavegacao(page, PUBLICOS, 'Pontos')
    await page.getByRole('combobox', { name: 'Bairro' }).selectOption({ label: 'Itaim Bibi (1)' })
    await expect(itensPontos(page)).toHaveCount(1)
    await settle(page)
    await verificarNavegacao(page, PUBLICOS, 'Pontos com filtros')
    await busca(page).fill('zzz-inexistente')
    await expect(vazio(page)).toBeVisible()
    await settle(page)
    await verificarNavegacao(page, PUBLICOS, 'Pontos sem resultados')
  })

  test('visitante: Histórico com navegação completa e sem rolagem lateral', async ({ page }) => {
    await page.goto('/historico?ponto=MOCK-01&periodo=24h')
    await expect(page.getByRole('table')).toBeVisible()
    await settle(page)
    await verificarNavegacao(page, PUBLICOS, 'Histórico')
  })

  test('insights em 375 px: texto longo não ultrapassa o cartão nem a janela', async ({ page }) => {
    await abrirDashboard(page)
    await settle(page)
    const itens = page.getByRole('region', { name: 'Insights', exact: true }).getByRole('listitem')
    await expect(itens).toHaveCount(5)
    for (let i = 0; i < 5; i++) {
      const caixa = await itens.nth(i).boundingBox()
      expect(caixa.x).toBeGreaterThanOrEqual(0)
      expect(caixa.x + caixa.width).toBeLessThanOrEqual(375.5)
    }
    expect(await horizontalOverflow(page)).toEqual([])
  })

  test('admin mock: navegação com "Gerenciar" inteiramente visível em Dashboard, Pontos, Histórico e Gerenciar', async ({ page }) => {
    const TODOS = [...PUBLICOS, 'Gerenciar']
    await page.goto('/admin/login')
    await page.getByLabel('E-mail').fill(ADMIN.email)
    await page.getByLabel('Senha').fill(ADMIN.senha)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Gerenciar pontos' })).toBeVisible()
    await settle(page)
    await verificarNavegacao(page, TODOS, 'Gerenciar')

    // a sessão é só memória: a navegação depois do login é sempre por cliques
    const nav = page.getByRole('navigation', { name: 'Navegação principal' })
    await nav.getByRole('link', { name: 'Dashboard', exact: true }).click()
    await expect(cardsDash(page)).toHaveCount(8)
    await expect(nav.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute('aria-current', 'page')
    await settle(page)
    await verificarNavegacao(page, TODOS, 'Dashboard (admin)')
    await busca(page).fill('zzz-inexistente')
    await expect(vazio(page)).toBeVisible()
    await settle(page)
    await verificarNavegacao(page, TODOS, 'Dashboard sem resultados (admin)')

    await nav.getByRole('link', { name: 'Pontos', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Pontos' })).toBeVisible()
    await expect(itensPontos(page).first()).toBeVisible()
    await page.getByRole('combobox', { name: 'Bairro' }).selectOption({ label: 'Lapa (1)' })
    await settle(page)
    await verificarNavegacao(page, TODOS, 'Pontos com filtros (admin)')

    await nav.getByRole('link', { name: 'Histórico', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Histórico' })).toBeVisible()
    await settle(page)
    await verificarNavegacao(page, TODOS, 'Histórico (admin)')
  })
})
