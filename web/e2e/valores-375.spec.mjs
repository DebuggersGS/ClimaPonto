// AC2: valores numéricos (ex.: '21,0 °C', '61,0 %') ficam em uma única linha, dentro do próprio cartão e
// sem rolagem lateral em 375 px. Na base 94f7f5b a unidade quebrava para a linha seguinte ('21,0' / '°C')
// e o valor podia ultrapassar o cartão; aqui a unidade vem colada por U+00A0 e o <dd> não quebra.
import { test, expect, settle, horizontalOverflow } from 'harness-e2e'

test.use({ viewport: { width: 375, height: 812 } })

// Mede, no navegador, cada <dd> localizado pelo seletor: linhas visuais e limites em relação ao cartão.
// `cartaoSel` (opcional): seletor do ancestral que representa o cartão; padrão = pai direto do valor.
async function medir(locator, cartaoSel = null) {
  // Elemento a elemento: no Firefox, medir todos os <dd> do Dashboard numa só avaliação derrubou a página
  // (Range sobre o <dd> inteiro, que inclui o <span class="sr-only"> posicionado de forma absoluta).
  // O Range é criado por nó de texto descendente visível (TreeWalker), pulando o que está em .sr-only:
  // o texto pode estar num filho (ex.: tendência) e nunca se cria Range que abranja o span oculto.
  const total = await locator.count()
  const medidas = []
  for (let i = 0; i < total; i++) {
    medidas.push(
      await locator.nth(i).evaluate((el, sel) => {
        const texto = el.textContent.replace(/\s+/g, ' ').trim()
        const retangulos = []
        let nosVisiveis = 0
        const caminhante = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        for (let no = caminhante.nextNode(); no; no = caminhante.nextNode()) {
          if (!no.textContent.trim() || no.parentElement.closest('.sr-only')) continue
          nosVisiveis++
          const range = document.createRange()
          range.selectNodeContents(no)
          retangulos.push(...range.getClientRects())
        }
        const topos = new Set(retangulos.filter((r) => r.width > 0).map((r) => Math.round(r.top)))
        const cartao = (sel ? el.closest(sel) : el.parentElement).getBoundingClientRect()
        const caixa = el.getBoundingClientRect()
        const estilo = getComputedStyle(el)
        const lh = parseFloat(estilo.lineHeight) || parseFloat(estilo.fontSize) * 1.5
        return {
          texto,
          nosVisiveis,
          linhas: topos.size,
          altura: Math.round(caixa.height * 10) / 10,
          alturaMaxima: Math.round(lh * 1.5 * 10) / 10,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          direitaValor: Math.round(Math.max(caixa.right, ...retangulos.map((r) => r.right)) * 10) / 10,
          direitaCartao: Math.round(cartao.right * 10) / 10,
        }
      }, cartaoSel),
    )
  }
  return medidas
}

function verificar(medidas, origem) {
  expect(medidas.length, `${origem}: nenhum valor encontrado`).toBeGreaterThan(0)
  for (const m of medidas) {
    const id = `${origem} "${m.texto}" ${JSON.stringify(m)}`
    expect(m.nosVisiveis, `${id}: sem texto visível medido`).toBeGreaterThan(0)
    expect(m.linhas, `${id}: valor quebrado em mais de uma linha`).toBe(1)
    expect(m.altura, `${id}: altura maior que 1,5 x line-height`).toBeLessThanOrEqual(m.alturaMaxima)
    expect(m.scrollWidth, `${id}: conteúdo mais largo que o próprio valor`).toBeLessThanOrEqual(m.clientWidth)
    expect(m.direitaValor, `${id}: valor ultrapassa o cartão`).toBeLessThanOrEqual(m.direitaCartao + 0.5)
  }
}

const CASOS_HISTORICO = [
  ['MOCK-01 24h', '/historico?ponto=MOCK-01&periodo=24h'],
  ['MOCK-01 7d', '/historico?ponto=MOCK-01&periodo=7d'],
  ['MOCK-03 24h', '/historico?ponto=MOCK-03&periodo=24h'],
]

for (const [nome, rota] of CASOS_HISTORICO) {
  test(`histórico ${nome}: mínima, máxima, média e tendência em uma linha`, async ({ page }) => {
    await page.goto(rota)
    for (const grupo of ['Resumo de temperatura', 'Resumo de umidade']) {
      const g = page.getByRole('group', { name: grupo })
      await expect(g).toBeVisible()
      await settle(page)
      const estatisticas = g.locator('dl').first().locator('dd')
      await expect(estatisticas).toHaveCount(3)
      verificar(await medir(estatisticas), `${nome} ${grupo}`)
      const tendencia = g.locator('div:has(> dt:text-is("Tendência:")) > dd')
      await expect(tendencia).toHaveCount(1)
      verificar(await medir(tendencia, '[role=group]'), `${nome} ${grupo} tendência`)
    }
    expect(await horizontalOverflow(page), `${nome}: rolagem lateral`).toEqual([])
  })
}

test('dashboard: temperatura e umidade dos cards e da última medição em uma linha', async ({ page }) => {
  await page.goto('/')
  const cards = page.getByRole('region', { name: 'Pontos monitorados' }).getByRole('listitem')
  await expect(cards).toHaveCount(8)
  await settle(page)
  const valores = cards.locator('dd')
  expect(await valores.count()).toBeGreaterThanOrEqual(2)
  verificar(await medir(valores), 'cards do dashboard')
  const destaque = page.getByRole('region', { name: 'Última medição' })
  // os dois valores grandes são <p> (não <dd>) dentro de um grid dentro do cartão
  const grandes = destaque.locator('p.tabular-nums')
  await expect(grandes).toHaveCount(2)
  verificar(await medir(grandes, 'div.grid'), 'última medição')
  expect(await horizontalOverflow(page), 'dashboard: rolagem lateral').toEqual([])
})
