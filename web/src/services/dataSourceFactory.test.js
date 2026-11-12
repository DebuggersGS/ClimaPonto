import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  MOCK_DEFAULT_LATENCY_MS,
  MOCK_SLOW_LATENCY_MS,
  UNCONFIGURED_MESSAGE,
  createDataSource,
  parseMockOptions,
} from './dataSourceFactory.js'
import { AppError } from './errors.js'

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

  it('escritas de pontos ficam indisponíveis no mock', async () => {
    const source = createDataSource({ requestedMode: 'mock', supabaseConfigured: false, client: null })
    await assert.rejects(source.stopsApi.createStop({}), { kind: 'unavailable' })
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
