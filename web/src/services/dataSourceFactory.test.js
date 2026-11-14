import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  MOCK_DEFAULT_LATENCY_MS,
  MOCK_SLOW_LATENCY_MS,
  UNCONFIGURED_MESSAGE,
  createDataSource,
  parseMockOptions,
} from './dataSourceFactory.js'
import { AppError, NOT_ADMIN_MESSAGE } from './errors.js'
import { signInAdmin } from './adminAuth.js'

/** Cliente Supabase falso que registra as tabelas consultadas e devolve um erro de rede. */
function createFakeClient() {
  const calls = []
  const chain = (table) => {
    const query = {
      select: () => query,
      eq: () => query,
      gte: () => query,
      order: () => query,
      limit: () => query,
      then: (resolve) => resolve({ data: null, error: new TypeError('Failed to fetch') }),
    }
    calls.push(table)
    return query
  }
  return { calls, from: chain }
}

/** Cliente falso só de auth: registra chamadas e devolve invalid_credentials. */
function createFakeAuthClient() {
  const calls = []
  const invalid = { code: 'invalid_credentials', status: 400, message: 'Invalid login credentials' }
  return {
    calls,
    from: () => {
      calls.push('from')
      throw new Error('inesperado')
    },
    auth: {
      signInWithPassword: async (args) => {
        calls.push(['signInWithPassword', args.email])
        return { data: { user: null }, error: invalid }
      },
      signOut: async () => {
        calls.push('signOut')
        return { error: null }
      },
      getSession: async () => {
        calls.push('getSession')
        return { data: { session: null }, error: null }
      },
      onAuthStateChange: () => {
        calls.push('onAuthStateChange')
        return { data: { subscription: { unsubscribe() {} } } }
      },
    },
  }
}

describe('parseMockOptions', () => {
  it('sem parâmetro usa a latência padrão e não força falha', () => {
    assert.deepEqual(parseMockOptions(''), { failure: false, latencyMs: MOCK_DEFAULT_LATENCY_MS })
    assert.deepEqual(parseMockOptions(undefined), { failure: false, latencyMs: MOCK_DEFAULT_LATENCY_MS })
    assert.deepEqual(parseMockOptions('?ponto=MOCK-01'), { failure: false, latencyMs: MOCK_DEFAULT_LATENCY_MS })
  })

  it('?mock=erro força a falha e ?mock=lento aumenta a latência', () => {
    assert.deepEqual(parseMockOptions('?mock=erro'), { failure: true, latencyMs: MOCK_DEFAULT_LATENCY_MS })
    assert.deepEqual(parseMockOptions('?mock=lento'), { failure: false, latencyMs: MOCK_SLOW_LATENCY_MS })
  })

  it('aceita combinação, maiúsculas e espaços; ignora valores desconhecidos', () => {
    assert.deepEqual(parseMockOptions('?mock=LENTO, erro'), { failure: true, latencyMs: MOCK_SLOW_LATENCY_MS })
    assert.deepEqual(parseMockOptions('?mock=qualquer'), { failure: false, latencyMs: MOCK_DEFAULT_LATENCY_MS })
  })
})

describe('createDataSource: modo mock', () => {
  it('"mock" usa o adaptador mock mesmo com Supabase configurado, sem consultar o cliente', async () => {
    const client = createFakeClient()
    const source = createDataSource({ requestedMode: 'mock', supabaseConfigured: true, client, getSearch: () => '' })
    assert.equal(source.dataMode, 'mock')
    const stops = await source.stopsApi.listStops()
    const latest = await source.readingsApi.fetchLatestReadings()
    assert.equal(stops.length, 8)
    assert.equal(latest.source, 'mock')
    assert.deepEqual(client.calls, [])
  })

  it('"auto" sem configuração cai para o mock', () => {
    const source = createDataSource({ requestedMode: undefined, supabaseConfigured: false, client: null })
    assert.equal(source.dataMode, 'mock')
    assert.equal(source.resolution.requested, 'auto')
  })

  it('lê ?mock=erro da URL somente no modo mock', async () => {
    const search = () => '?mock=erro'
    const mock = createDataSource({ requestedMode: 'mock', supabaseConfigured: false, client: null, getSearch: search })
    await assert.rejects(mock.readingsApi.fetchLatestReadings(), { kind: 'network' })

    let lida = false
    const supabase = createDataSource({
      requestedMode: 'supabase',
      supabaseConfigured: true,
      client: createFakeClient(),
      getSearch: () => {
        lida = true
        return '?mock=erro'
      },
    })
    assert.equal(lida, false)
    assert.equal(supabase.dataMode, 'supabase')
  })

  it('escritas de pontos funcionam em memória no mock', async () => {
    const source = createDataSource({ requestedMode: 'mock', supabaseConfigured: false, client: null })
    const criado = await source.stopsApi.createStop({
      code: 'NOVO-01', name: 'Ponto novo', neighborhood: 'Centro', description: null,
      latitude: null, longitude: null, isDemo: true, active: true,
    })
    assert.equal(criado.id, 'mock-novo-1')
    assert.equal((await source.stopsApi.listStops()).length, 9)
    await assert.rejects(
      source.stopsApi.createStop({ code: '', name: '', neighborhood: '', latitude: null, longitude: null }),
      { kind: 'validation' },
    )
  })
})

describe('createDataSource: modo supabase', () => {
  it('usa só o cliente Supabase e nunca devolve dados mock', async () => {
    const client = createFakeClient()
    const source = createDataSource({ requestedMode: 'supabase', supabaseConfigured: true, client })
    assert.equal(source.dataMode, 'supabase')
    await assert.rejects(source.stopsApi.listStops())
    await assert.rejects(source.readingsApi.fetchLatestReadings())
    assert.deepEqual(client.calls, ['stops', 'stop_latest_readings'])
  })

  it('erro do Supabase é propagado, inclusive em "auto" (sem queda para mock)', async () => {
    const client = createFakeClient()
    const source = createDataSource({ requestedMode: 'auto', supabaseConfigured: true, client })
    assert.equal(source.dataMode, 'supabase')
    await assert.rejects(source.stopsApi.listStops(), (err) => {
      assert.ok(err instanceof AppError)
      assert.equal(err.kind, 'network')
      return true
    })
    await assert.rejects(source.readingsApi.fetchReadingHistory({ stopId: 's1', periodId: '24h' }), { kind: 'network' })
  })
})

describe('createDataSource: modo não configurado', () => {
  it('"supabase" sem configuração rejeita toda operação com erro claro, sem mock', async () => {
    const source = createDataSource({ requestedMode: 'supabase', supabaseConfigured: false, client: null })
    assert.equal(source.dataMode, 'unconfigured')
    assert.match(UNCONFIGURED_MESSAGE, /Supabase não configurado: defina web\/\.env\.local ou use VITE_DATA_MODE=mock/)
    const operacoes = [
      () => source.stopsApi.listStops(),
      () => source.stopsApi.createStop({}),
      () => source.stopsApi.countStopReadings('x'),
      () => source.readingsApi.fetchLatestReadings(),
      () => source.readingsApi.fetchReadingHistory({ stopId: 'x' }),
    ]
    for (const operacao of operacoes) {
      await assert.rejects(operacao(), (err) => {
        assert.ok(err instanceof AppError)
        assert.equal(err.message, UNCONFIGURED_MESSAGE)
        return true
      })
    }
  })
})

describe('createDataSource: autenticação', () => {
  it('"mock" devolve a auth demonstrativa e não toca client.auth, mesmo configurado', async () => {
    const client = createFakeAuthClient()
    const { authApi } = createDataSource({ requestedMode: 'mock', supabaseConfigured: true, client })
    assert.equal(authApi.isDemo, true)
    assert.equal(authApi.available, true)
    assert.equal(authApi.demoAccounts.length, 2)
    const user = await signInAdmin(authApi, 'admin.demo@climaponto.example', 'demo-admin-2026')
    assert.equal(user.app_metadata.role, 'admin')
    await authApi.signOut()
    await authApi.getSession()
    authApi.onAuthChange(() => {})()
    assert.deepEqual(client.calls, [])
  })

  it('?mock=erro não afeta a auth demonstrativa', async () => {
    const { authApi } = createDataSource({
      requestedMode: 'mock', supabaseConfigured: false, client: null, getSearch: () => '?mock=erro,lento',
    })
    await signInAdmin(authApi, 'admin.demo@climaponto.example', 'demo-admin-2026')
  })

  it('"supabase" e "auto" configurado usam só client.auth: credenciais demo são recusadas', async () => {
    for (const requestedMode of ['supabase', 'auto']) {
      const client = createFakeAuthClient()
      const { authApi } = createDataSource({ requestedMode, supabaseConfigured: true, client })
      assert.equal(authApi.isDemo, false)
      assert.equal(authApi.demoAccounts, null)
      assert.equal(authApi.available, true)
      await assert.rejects(
        signInAdmin(authApi, ' admin.demo@climaponto.example ', 'demo-admin-2026'),
        { kind: 'validation', message: 'E-mail ou senha incorretos.' },
      )
      assert.deepEqual(client.calls, [['signInWithPassword', 'admin.demo@climaponto.example']])
    }
  })

  it('"unconfigured": indisponível, signIn rejeita e não há conta demo', async () => {
    const { authApi } = createDataSource({ requestedMode: 'supabase', supabaseConfigured: false, client: null })
    assert.equal(authApi.available, false)
    assert.equal(authApi.isDemo, false)
    assert.equal(authApi.demoAccounts, null)
    await assert.rejects(authApi.signIn('admin.demo@climaponto.example', 'demo-admin-2026'), (err) => {
      assert.ok(err instanceof AppError)
      assert.equal(err.message, UNCONFIGURED_MESSAGE)
      return true
    })
    await assert.rejects(authApi.signOut(), AppError)
    assert.equal(await authApi.getSession(), null)
    assert.equal(typeof authApi.onAuthChange(() => {}), 'function')
  })

  it('NOT_ADMIN_MESSAGE é a mensagem de conta sem acesso administrativo', () => {
    assert.equal(NOT_ADMIN_MESSAGE, 'Esta conta não tem acesso administrativo.')
  })
})
