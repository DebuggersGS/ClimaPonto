// Qualidade transversal: responsividade (375/768/1366), teclado, acessibilidade (axe-core, temas
// claro/escuro), movimento reduzido, auditoria objetiva de design e screenshots para revisão visual.
import { test, expect, snap, settle, keyboardWalk, horizontalOverflow, obscuredElements, axeViolations, designAudit, VIEWPORTS } from 'harness-e2e'

const PAGES = [
  ['dashboard', '/', 'Pontos monitorados'],
  ['historico', '/historico?ponto=MOCK-01&periodo=24h', 'Leituras'],
  ['pontos', '/pontos?vista=lista', null],
  // sem gráficos: região indefinida = basta o h1 (a 404 não tem região nomeada)
  ['nao-encontrada', '/rota-que-nao-existe', undefined],
]

async function ready(page, region) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  if (region === undefined) await expect(page.getByRole('link', { name: 'Voltar para o Dashboard' })).toBeVisible()
  else if (region) await expect(page.getByRole('region', { name: region, exact: true })).toBeVisible()
  else await expect(page.getByRole('link', { name: 'Ver histórico' }).first()).toBeVisible()
  // medições (axe/contraste, layout, screenshots) só depois das animações de entrada
  await settle(page)
}

for (const [nome, rota, region] of PAGES) {
  for (const [vpNome, vp] of Object.entries(VIEWPORTS)) {
    test(`${nome} em ${vpNome} (${vp.width}px): sem rolagem lateral, sobreposição ou erro de design`, async ({ page }, testInfo) => {
      await page.setViewportSize(vp)
      await page.goto(rota)
      await ready(page, region)
      expect(await horizontalOverflow(page)).toEqual([])
      expect(await obscuredElements(page)).toEqual([])
      const audit = await designAudit(page)
      await testInfo.attach(`design-${nome}-${vpNome}`, { body: JSON.stringify(audit, null, 2), contentType: 'application/json' })
      expect(audit.findings.filter((f) => f.severity === 'erro')).toEqual([])
      if (vpNome !== 'tablet') await snap(page, testInfo, `${nome}-${vpNome}`)
    })
  }
}

for (const colorScheme of ['light', 'dark']) {
  for (const [nome, rota, region] of PAGES) {
    test(`axe-core sem violações WCAG A/AA: ${nome} (tema ${colorScheme})`, async ({ page }, testInfo) => {
      // Firefox: o processo de conteúdo trava durante a análise do axe nas páginas com gráficos SVG (Recharts)
      // quando executado pelo Playwright Test (reproduzido com e sem isolamento, trace e vídeo; não reproduz
      // fora do runner). As regras do axe avaliam o DOM e não dependem do motor: cobertura feita no Chromium.
      test.skip(testInfo.project.name === 'firefox' && !['pontos', 'nao-encontrada'].includes(nome), 'axe-core no Firefox derruba a página com gráficos (limitação do navegador; coberto no Chromium)')
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await page.goto(rota)
      await ready(page, region)
      const v = await axeViolations(page)
      await testInfo.attach(`axe-${nome}-${colorScheme}`, { body: JSON.stringify(v, null, 2), contentType: 'application/json' })
      expect(v).toEqual([])
    })
  }
}

test('teclado: atalho para o conteúdo primeiro, navegação alcançável e foco visível', async ({ page }) => {
  await page.goto('/')
  await ready(page, 'Pontos monitorados')
  const ordem = await keyboardWalk(page, 12)
  expect(ordem[0].name).toBe('Pular para o conteúdo')
  for (const n of ['Dashboard', 'Pontos', 'Histórico']) expect(ordem.some((x) => x.name === n)).toBe(true)
  expect(ordem.every((x) => x.visible && x.outline)).toBe(true)
  // Enter no atalho leva ao conteúdo principal: o próximo Tab já está dentro de <main>
  await page.goto('/')
  await ready(page, 'Pontos monitorados')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#conteudo$/)
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => !!document.activeElement?.closest('main'))).toBe(true)
})

test('teclado: filtro de período do histórico operável sem mouse', async ({ page }) => {
  await page.goto('/historico?ponto=MOCK-01&periodo=24h')
  const b7 = page.getByRole('button', { name: '7 dias' })
  await b7.focus()
  await page.keyboard.press('Enter')
  await expect(b7).toHaveAttribute('aria-pressed', 'true')
})

test('movimento reduzido: elementos entram sem deslocamento', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Resumo', exact: true })).toBeVisible()
  // logo após a renderização: nenhum elemento do conteúdo deslocado verticalmente pela animação de entrada
  const deslocados = await page.evaluate(() =>
    [...document.querySelectorAll('main *')].filter((el) => {
      const t = getComputedStyle(el).transform
      if (!t || t === 'none') return false
      const m = t.match(/matrix\(([^)]+)\)/)
      return m && Math.abs(Number(m[1].split(',')[5])) > 0.5
    }).length,
  )
  expect(deslocados).toBe(0)
})
