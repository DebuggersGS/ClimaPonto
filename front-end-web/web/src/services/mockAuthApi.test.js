import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { signInAdmin } from './adminAuth.js'
import { AppError, NOT_ADMIN_MESSAGE } from './errors.js'
import { MOCK_AUTH_ACCOUNTS, createMockAuthApi } from './mockAuthApi.js'

const ADMIN = ['admin.demo@climaponto.example', 'demo-admin-2026']
const LEITOR = ['leitor.demo@climaponto.example', 'demo-leitor-2026']
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('createMockAuthApi', () => {
  it('declara-se demonstrativa, disponível e lista as contas fictícias', () => {
    const api = createMockAuthApi()
    assert.equal(api.isDemo, true)
    assert.equal(api.available, true)
    assert.deepEqual(api.demoAccounts.map((account) => account.email), MOCK_AUTH_ACCOUNTS.map((account) => account.email))
  })

  it('aceita o administrador e emite SIGNED_IN com a sessão', async () => {
    const api = createMockAuthApi()
    const eventos = []
    api.onAuthChange((event, session) => eventos.push([event, session]))
    const user = await signInAdmin(api, ...ADMIN)
    assert.equal(user.app_metadata.role, 'admin')
    assert.deepEqual(await api.getSession(), { user })
    const entrada = eventos.find(([event]) => event === 'SIGNED_IN')
    assert.equal(entrada[1].user.email, ADMIN[0])
  })

  it('recusa o leitor em signInAdmin e encerra a sessão', async () => {
    const api = createMockAuthApi()
    await assert.rejects(signInAdmin(api, ...LEITOR), (err) => {
      assert.ok(err instanceof AppError)
      assert.equal(err.kind, 'permission')
      assert.equal(err.message, NOT_ADMIN_MESSAGE)
      return true
    })
    assert.equal(await api.getSession(), null)
  })

  it('senha errada e e-mail desconhecido rejeitam com a mensagem de credenciais', async () => {
    const api = createMockAuthApi()
    for (const args of [[ADMIN[0], 'errada'], ['ninguem@climaponto.example', ADMIN[1]]]) {
      await assert.rejects(api.signIn(...args), (err) => {
        assert.equal(err.kind, 'validation')
        assert.equal(err.message, 'E-mail ou senha incorretos.')
        return true
      })
    }
    assert.equal(await api.getSession(), null)
  })

  it('ignora maiúsculas e espaços no e-mail', async () => {
    const api = createMockAuthApi()
    const user = await api.signIn('  ADMIN.Demo@ClimaPonto.example ', ADMIN[1])
    assert.equal(user.email, ADMIN[0])
  })

  it('signOut limpa a sessão e emite SIGNED_OUT', async () => {
    const api = createMockAuthApi()
    const eventos = []
    api.onAuthChange((event) => eventos.push(event))
    await api.signIn(...ADMIN)
    await api.signOut()
    assert.equal(await api.getSession(), null)
    assert.ok(eventos.includes('SIGNED_OUT'))
  })

  it('INITIAL_SESSION é assíncrono e cancelar a inscrição o impede', async () => {
    const api = createMockAuthApi()
    const eventos = []
    api.onAuthChange((event, session) => eventos.push([event, session]))
    assert.deepEqual(eventos, [])
    await tick()
    assert.deepEqual(eventos, [['INITIAL_SESSION', null]])

    const cancelado = []
    api.onAuthChange((event) => cancelado.push(event))()
    await tick()
    assert.deepEqual(cancelado, [])
  })

  it('instâncias são independentes e a sessão não usa armazenamento', async () => {
    const a = createMockAuthApi()
    const b = createMockAuthApi()
    await a.signIn(...ADMIN)
    assert.equal(await b.getSession(), null)
    const codigo = readFileSync(new URL('./mockAuthApi.js', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    assert.doesNotMatch(codigo, /localStorage|sessionStorage|supabaseClient/)
  })
})
