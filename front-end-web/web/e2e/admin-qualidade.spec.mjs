// Qualidade da área administrativa (modo mock): login anônimo e lista autenticada em 375/768/1366,
// auditoria de design e axe-core nos temas claro e escuro. A sessão vive só em memória: o tamanho da
// janela é alterado depois do login, sem recarregar.
import { test, expect, snap, settle, horizontalOverflow, obscuredElements, axeViolations, designAudit, VIEWPORTS } from 'harness-e2e'

const ADMIN = { email: 'admin.demo@climaponto.example', senha: 'demo-admin-2026' }

async function abrirLogin(page) {
  await page.goto('/admin/login')
  await expect(page.getByRole('heading', { level: 1, name: 'Área administrativa' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Acesso demonstrativo' })).toBeVisible()
  await settle(page)
}

async function abrirLista(page) {
  await page.goto('/admin/login')
  await page.getByLabel('E-mail').fill(ADMIN.email)
  await page.getByLabel('Senha').fill(ADMIN.senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Gerenciar pontos' })).toBeVisible()
  await expect(page.getByText('8 de 8 pontos', { exact: true })).toBeVisible()
}

const TELAS = [
  ['login', abrirLogin],
  ['admin-pontos', abrirLista],
]

for (const [nome, abrir] of TELAS) {
  for (const [vpNome, vp] of Object.entries(VIEWPORTS)) {
    test(`${nome} em ${vpNome} (${vp.width}px): sem rolagem lateral, sobreposição ou erro de design`, async ({ page }, testInfo) => {
      await abrir(page)
      await page.setViewportSize(vp)
      await settle(page)
      expect(await horizontalOverflow(page)).toEqual([])
      expect(await obscuredElements(page)).toEqual([])
      const audit = await designAudit(page)
      await testInfo.attach(`design-${nome}-${vpNome}`, { body: JSON.stringify(audit, null, 2), contentType: 'application/json' })
      expect(audit.findings.filter((f) => f.severity === 'erro')).toEqual([])
      if (vpNome === 'mobile') await snap(page, testInfo, `${nome}-mobile`)
      if (vpNome === 'desktop') await snap(page, testInfo, `${nome}-desktop`)
    })
  }

  for (const colorScheme of ['light', 'dark']) {
    test(`axe-core sem violações WCAG A/AA: ${nome} (tema ${colorScheme})`, async ({ page }, testInfo) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await abrir(page)
      await settle(page)
      const v = await axeViolations(page)
      await testInfo.attach(`axe-${nome}-${colorScheme}`, { body: JSON.stringify(v, null, 2), contentType: 'application/json' })
      expect(v).toEqual([])
    })
  }
}
