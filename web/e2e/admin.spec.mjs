// Área administrativa no modo mock: login demonstrativo, CRUD, desativação/exclusão e estados.
// A sessão e as escritas vivem só em memória: após o login, a navegação é sempre por cliques
// (page.goto/reload voltaria ao estado anônimo e aos dados originais).
import { test, expect } from 'harness-e2e'

const ADMIN = { email: 'admin.demo@climaponto.example', senha: 'demo-admin-2026' }
const LEITOR = { email: 'leitor.demo@climaponto.example', senha: 'demo-leitor-2026' }

async function preencherLogin(page, { email, senha }) {
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

/** Entra como administrador pela interface; `query` repassa ?mock=erro|lento ao carregar a página. */
async function loginAdmin(page, query = '') {
  await page.goto(`/admin/login${query}`)
  await preencherLogin(page, ADMIN)
  await expect(page.getByRole('heading', { level: 1, name: 'Gerenciar pontos' })).toBeVisible()
}

const contagem = (page, texto) => page.getByText(texto, { exact: true })
const cartao = (page, codigo) => page.getByRole('article').filter({ hasText: codigo })
const dialogo = (page) => page.getByRole('dialog')

async function cadastrar(page, { codigo, nome, bairro }) {
  await page.getByRole('button', { name: 'Novo ponto' }).click()
  await page.getByLabel('Código').fill(codigo)
  await page.getByLabel('Nome').fill(nome)
  await page.getByLabel('Bairro ou região').fill(bairro)
  await page.getByRole('button', { name: 'Cadastrar' }).click()
}

test.describe('acesso e login demonstrativo', () => {
  test('/admin/pontos sem sessão redireciona para o login', async ({ page }) => {
    await page.goto('/admin/pontos')
    await expect(page).toHaveURL(/\/admin\/login$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Área administrativa' })).toBeVisible()
  })

  test('o login informa que é demonstrativo e mostra as credenciais fictícias', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByRole('heading', { name: 'Acesso demonstrativo' })).toBeVisible()
    await expect(page.getByText(ADMIN.email)).toBeVisible()
    await expect(page.getByText(ADMIN.senha)).toBeVisible()
    await expect(page.getByText(LEITOR.email)).toBeVisible()
    await expect(page.getByText(LEITOR.senha)).toBeVisible()
  })

  test('senha errada mostra o erro e não autentica', async ({ page }) => {
    await page.goto('/admin/login')
    await preencherLogin(page, { email: ADMIN.email, senha: 'senha-errada' })
    await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sair' })).toHaveCount(0)
  })

  test('conta sem papel admin é recusada e continua anônima', async ({ page }) => {
    await page.goto('/admin/login')
    await preencherLogin(page, LEITOR)
    await expect(page.getByRole('alert').filter({ hasText: 'Esta conta não tem acesso administrativo.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sair' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Gerenciar' })).toHaveCount(0)
    await expect(page.getByLabel('E-mail')).toBeVisible()
  })

  test('admin entra na gestão de pontos, com aviso de demonstração e navegação ativa', async ({ page }) => {
    await loginAdmin(page)
    await expect(page).toHaveURL(/\/admin\/pontos$/)
    await expect(page.getByText('Modo demonstração: cadastro, edição, desativação e exclusão valem só na memória desta aba.', { exact: false })).toBeVisible()
    await expect(contagem(page, '8 de 8 pontos')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Gerenciar' })).toHaveAttribute('aria-current', 'page')
  })

  test('Sair encerra a sessão e a área administrativa volta a pedir login', async ({ page }) => {
    await loginAdmin(page)
    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page.getByRole('button', { name: 'Sair' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Gerenciar' })).toHaveCount(0)
    await page.getByRole('link', { name: 'Área administrativa' }).click()
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  })
})

test.describe('lista: pesquisa e filtro', () => {
  test('pesquisa por código e por bairro', async ({ page }) => {
    await loginAdmin(page)
    await page.getByLabel('Pesquisar').fill('mock-03')
    await expect(contagem(page, '1 de 8 pontos')).toBeVisible()
    await expect(cartao(page, 'MOCK-03')).toBeVisible()

    const bairro = (await cartao(page, 'MOCK-05').locator('p.text-slate-700').textContent()).trim()
    await page.getByLabel('Pesquisar').fill(bairro)
    await expect(cartao(page, 'MOCK-05')).toBeVisible()
  })

  test('filtro Situação separa ativos e inativos', async ({ page }) => {
    await loginAdmin(page)
    await page.getByLabel('Situação').selectOption({ label: 'Ativos' })
    await expect(contagem(page, '8 de 8 pontos')).toBeVisible()
    await page.getByLabel('Situação').selectOption({ label: 'Inativos' })
    await expect(contagem(page, '0 de 8 pontos')).toBeVisible()
    await expect(page.getByText('Nenhum ponto encontrado')).toBeVisible()
  })

  test('pesquisa sem resultado mostra o estado vazio', async ({ page }) => {
    await loginAdmin(page)
    await page.getByLabel('Pesquisar').fill('zzz-inexistente')
    await expect(page.getByText('Nenhum ponto encontrado')).toBeVisible()
    await expect(page.getByText('Ajuste a pesquisa ou o filtro.')).toBeVisible()
  })
})

test.describe('cadastro, edição e exclusão', () => {
  test('formulário vazio mostra os erros antes de gravar', async ({ page }) => {
    await loginAdmin(page)
    await page.getByRole('button', { name: 'Novo ponto' }).click()
    await page.getByRole('button', { name: 'Cadastrar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Revise os campos destacados.' })).toBeVisible()
    await expect(page.getByText('Informe o código.')).toBeVisible()
    await expect(page.getByText('O nome deve ter entre')).toBeVisible()
    await expect(page.getByText('O bairro deve ter entre')).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(contagem(page, '8 de 8 pontos')).toBeVisible()
  })

  test('código duplicado é recusado', async ({ page }) => {
    await loginAdmin(page)
    await cadastrar(page, { codigo: 'MOCK-01', nome: 'Ponto repetido', bairro: 'Centro' })
    await expect(page.getByText('Já existe um ponto com este código.').first()).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(contagem(page, '8 de 8 pontos')).toBeVisible()
  })

  test('cadastra, edita e exclui um ponto sem leituras', async ({ page }) => {
    await loginAdmin(page)
    await cadastrar(page, { codigo: 'TESTE-01', nome: 'Ponto de teste E2E', bairro: 'Centro' })
    await expect(page.getByRole('status').filter({ hasText: 'Ponto TESTE-01 cadastrado.' })).toBeVisible()
    await expect(contagem(page, '9 de 9 pontos')).toBeVisible()
    await expect(cartao(page, 'TESTE-01')).toBeVisible()

    await page.getByRole('button', { name: 'Editar Ponto de teste E2E' }).click()
    await page.getByLabel('Nome').fill('Ponto de teste E2E revisado')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Ponto TESTE-01 atualizado.' })).toBeVisible()
    await expect(cartao(page, 'TESTE-01').getByRole('heading', { name: 'Ponto de teste E2E revisado' })).toBeVisible()

    await page.getByRole('button', { name: 'Excluir Ponto de teste E2E revisado' }).click()
    await expect(dialogo(page).getByRole('heading', { name: 'Excluir ponto?' })).toBeVisible()
    await dialogo(page).getByRole('button', { name: 'Excluir' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Ponto TESTE-01 excluído.' })).toBeVisible()
    await expect(contagem(page, '8 de 8 pontos')).toBeVisible()
  })

  test('ponto sem leituras do conjunto original (MOCK-04) também pode ser excluído', async ({ page }) => {
    await loginAdmin(page)
    await cartao(page, 'MOCK-04').getByRole('button', { name: /^Excluir / }).click()
    await expect(dialogo(page).getByRole('heading', { name: 'Excluir ponto?' })).toBeVisible()
    await dialogo(page).getByRole('button', { name: 'Excluir' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Ponto MOCK-04 excluído.' })).toBeVisible()
    await expect(contagem(page, '7 de 7 pontos')).toBeVisible()
  })
})

test.describe('desativação, reativação e histórico', () => {
  test('desativar com confirmação, achar em Inativos e reativar', async ({ page }) => {
    await loginAdmin(page)
    await cartao(page, 'MOCK-01').getByRole('button', { name: /^Desativar / }).click()
    await expect(dialogo(page).getByRole('heading', { name: 'Desativar ponto?' })).toBeVisible()
    await dialogo(page).getByRole('button', { name: 'Desativar' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Ponto MOCK-01 desativado.' })).toBeVisible()

    await page.getByLabel('Situação').selectOption({ label: 'Inativos' })
    await expect(contagem(page, '1 de 8 pontos')).toBeVisible()
    await expect(cartao(page, 'MOCK-01').getByText('Inativo', { exact: true })).toBeVisible()

    await cartao(page, 'MOCK-01').getByRole('button', { name: /^Reativar / }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Ponto MOCK-01 reativado.' })).toBeVisible()
  })

  test('cancelar a desativação não altera o ponto', async ({ page }) => {
    await loginAdmin(page)
    await cartao(page, 'MOCK-02').getByRole('button', { name: /^Desativar / }).click()
    await dialogo(page).getByRole('button', { name: 'Cancelar' }).click()
    await expect(dialogo(page)).toBeHidden()
    await expect(cartao(page, 'MOCK-02').getByText('Ativo', { exact: true })).toBeVisible()
  })

  test('ponto com leituras não pode ser excluído: o diálogo oferece só desativar', async ({ page }) => {
    await loginAdmin(page)
    await cartao(page, 'MOCK-01').getByRole('button', { name: /^Excluir / }).click()
    const d = dialogo(page)
    await expect(d.getByRole('heading', { name: 'Este ponto possui histórico' })).toBeVisible()
    await expect(d.getByRole('button', { name: 'Desativar' })).toBeVisible()
    await expect(d.getByRole('button', { name: 'Excluir' })).toHaveCount(0)
    await d.getByRole('button', { name: 'Desativar' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Ponto MOCK-01 desativado.' })).toBeVisible()
    await expect(contagem(page, '8 de 8 pontos')).toBeVisible()
  })
})

test.describe('estados da lista administrativa', () => {
  test('?mock=lento mostra o carregamento e depois a lista', async ({ page }) => {
    await loginAdmin(page, '?mock=lento')
    await expect(page.getByRole('status').filter({ hasText: 'Carregando pontos…' })).toBeVisible()
    await expect(contagem(page, '8 de 8 pontos')).toBeVisible()
  })

  test('?mock=erro mostra o erro com botão para tentar novamente', async ({ page }) => {
    await page.goto('/admin/login?mock=erro')
    await preencherLogin(page, ADMIN)
    await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível carregar os pontos' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  })
})
