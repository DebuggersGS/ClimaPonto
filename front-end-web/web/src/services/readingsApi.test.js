import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { HISTORY_LIMIT } from '../utils/historyPeriods.js'
import { AppError } from './errors.js'
import {
  fetchLatestReadings,
  fetchReadingHistory,
  isAbortedError,
  LATEST_READING_COLUMNS,
  READING_COLUMNS,
} from './readingsApi.js'

const NOW = new Date('2026-11-12T12:00:00.000Z')
const STOP_ID = 'stop-1'

/**
 * Cliente Supabase falso: registra cada chamada encadeada e é "thenable",
 * resolvendo { data, error }. Os métodos de escrita registram chamada para que
 * os testes afirmem que nunca foram usados.
 */
function createFakeClient({ data = [], error = null, throws = null } = {}) {
  const calls = []
  const record = (name) =>
    function recorded(...args) {
      calls.push({ name, args })
      return builder
    }
  const builder = {
    then(resolve, reject) {
      if (throws) return Promise.reject(throws).then(resolve, reject)
      return Promise.resolve({ data, error }).then(resolve, reject)
    },
  }
  for (const name of ['select', 'eq', 'gte', 'order', 'limit', 'abortSignal', 'insert', 'update', 'upsert', 'delete']) {
    builder[name] = record(name)
  }
  const client = {
    calls,
    from(table) {
      calls.push({ name: 'from', args: [table] })
      return builder
    },
    rpc(...args) {
      calls.push({ name: 'rpc', args })
      return builder
    },
  }
  return client
}

const callsNamed = (client, name) => client.calls.filter((call) => call.name === name)

function assertNoWrites(client) {
  for (const name of ['insert', 'update', 'upsert', 'delete', 'rpc']) {
    assert.equal(callsNamed(client, name).length, 0, `${name} não deve ser chamado`)
  }
}

function row(index, overrides = {}) {
  const minute = String(index % 60).padStart(2, '0')
  const hour = String(Math.floor(index / 60) % 24).padStart(2, '0')
  return {
    id: `r-${String(index).padStart(4, '0')}`,
    stop_id: STOP_ID,
    temperature_c: 30,
    humidity_pct: 50,
    environmental_status: 'normal',
    source: 'sensor',
    measured_at: `2026-11-12T${hour}:${minute}:00.000Z`,
    received_at: `2026-11-12T${hour}:${minute}:05.000Z`,
    ...overrides,
  }
}

describe('fetchLatestReadings', () => {
  it('consulta a view stop_latest_readings com as colunas exatas, sem "*"', async () => {
    const client = createFakeClient({ data: [] })
    const result = await fetchLatestReadings(client)

    assert.deepEqual(callsNamed(client, 'from')[0].args, ['stop_latest_readings'])
    assert.deepEqual(callsNamed(client, 'select')[0].args, [LATEST_READING_COLUMNS])
    assert.ok(!LATEST_READING_COLUMNS.includes('*'))
    assert.equal(result.source, 'supabase')
    assertNoWrites(client)
  })

  it('normaliza reading_id, descarta linha inválida e a conta', async () => {
    const client = createFakeClient({
      data: [
        {
          stop_id: STOP_ID,
          reading_id: 'abc',
          temperature_c: '31.5',
          humidity_pct: '60.25',
          environmental_status: 'attention',
          source: 'simulation',
          measured_at: '2026-11-12T11:00:00.000Z',
          received_at: '2026-11-12T11:00:02.000Z',
        },
        { stop_id: STOP_ID, reading_id: 'sem-data', measured_at: null },
      ],
    })
    const { readings, discardedCount } = await fetchLatestReadings(client)

    assert.equal(readings.length, 1)
    assert.equal(discardedCount, 1)
    assert.equal(readings[0].id, 'abc')
    assert.equal(readings[0].temperatureC, 31.5)
    assert.equal(readings[0].humidityPct, 60.25)
    assert.equal(readings[0].environmentalStatus, 'attention')
  })

  it('com cliente null devolve lista vazia e origem local, sem gerar leituras', async () => {
    assert.deepEqual(await fetchLatestReadings(null), { readings: [], discardedCount: 0, source: 'local' })
  })

  it('repassa o abortSignal quando há signal e não o chama sem signal', async () => {
    const controller = new AbortController()
    const withSignal = createFakeClient()
    await fetchLatestReadings(withSignal, { signal: controller.signal })
    assert.equal(callsNamed(withSignal, 'abortSignal')[0].args[0], controller.signal)

    const withoutSignal = createFakeClient()
    await fetchLatestReadings(withoutSignal)
    assert.equal(callsNamed(withoutSignal, 'abortSignal').length, 0)
  })

  it('traduz permissão negada (42501) com a causa original preservada', async () => {
    const original = { code: '42501', message: 'permission denied for view stop_latest_readings' }
    const client = createFakeClient({ error: original })

    await assert.rejects(fetchLatestReadings(client), (err) => {
      assert.ok(err instanceof AppError)
      assert.equal(err.kind, 'permission')
      assert.equal(err.cause, original)
      return true
    })
  })

  it('usa a mensagem específica de leituras para códigos desconhecidos', async () => {
    const client = createFakeClient({ error: { code: 'XX999', message: 'detalhe interno: relation foo at line 3' } })

    await assert.rejects(fetchLatestReadings(client), (err) => {
      assert.equal(err.kind, 'unknown')
      assert.equal(err.message, 'Não foi possível consultar as leituras.')
      return true
    })
  })

  it('cancela com kind aborted quando o signal já está abortado', async () => {
    const controller = new AbortController()
    controller.abort()
    const client = createFakeClient({ data: [] })

    await assert.rejects(fetchLatestReadings(client, { signal: controller.signal }), (err) => {
      assert.equal(err.kind, 'aborted')
      assert.equal(err.message, 'Consulta cancelada.')
      assert.equal(isAbortedError(err), true)
      return true
    })
  })
})

describe('fetchReadingHistory', () => {
  it('consulta readings com colunas exatas, filtros, ordem decrescente e limite + 1', async () => {
    const client = createFakeClient({ data: [] })
    const result = await fetchReadingHistory(client, { stopId: STOP_ID, periodId: '24h', now: NOW })

    assert.deepEqual(callsNamed(client, 'from')[0].args, ['readings'])
    assert.deepEqual(callsNamed(client, 'select')[0].args, [READING_COLUMNS])
    assert.ok(!READING_COLUMNS.includes('*'))
    assert.deepEqual(callsNamed(client, 'eq')[0].args, ['stop_id', STOP_ID])
    assert.deepEqual(callsNamed(client, 'gte')[0].args, ['measured_at', '2026-11-11T12:00:00.000Z'])
    assert.deepEqual(callsNamed(client, 'order')[0].args, ['measured_at', { ascending: false }])
    assert.deepEqual(callsNamed(client, 'limit')[0].args, [HISTORY_LIMIT + 1])
    assert.equal(result.from, '2026-11-11T12:00:00.000Z')
    assert.equal(result.periodId, '24h')
    assert.equal(result.source, 'supabase')
    assertNoWrites(client)
  })

  it('calcula o início a partir do período escolhido e cai no padrão se for inválido', async () => {
    const sevenDays = await fetchReadingHistory(createFakeClient(), { stopId: STOP_ID, periodId: '7d', now: NOW })
    assert.equal(sevenDays.from, '2026-11-05T12:00:00.000Z')

    const invalid = await fetchReadingHistory(createFakeClient(), { stopId: STOP_ID, periodId: 'xyz', now: NOW })
    assert.equal(invalid.periodId, '24h')
    assert.equal(invalid.from, '2026-11-11T12:00:00.000Z')
  })

  it('repassa o abortSignal quando há signal', async () => {
    const controller = new AbortController()
    const client = createFakeClient()
    await fetchReadingHistory(client, { stopId: STOP_ID, now: NOW, signal: controller.signal })
    assert.equal(callsNamed(client, 'abortSignal')[0].args[0], controller.signal)
  })

  it('sem stopId lança erro de validação e não chama o cliente', async () => {
    for (const options of [undefined, {}, { stopId: '' }, { stopId: null }]) {
      const client = createFakeClient()
      await assert.rejects(fetchReadingHistory(client, options), (err) => {
        assert.ok(err instanceof AppError)
        assert.equal(err.kind, 'validation')
        assert.equal(err.message, 'Selecione um ponto para consultar o histórico.')
        return true
      })
      assert.equal(client.calls.length, 0)
    }
  })

  it('com cliente null devolve listas vazias e origem local', async () => {
    const result = await fetchReadingHistory(null, { stopId: STOP_ID, periodId: '30d', now: NOW })
    assert.deepEqual(result, {
      readings: [],
      truncated: false,
      discardedCount: 0,
      from: '2026-10-13T12:00:00.000Z',
      periodId: '30d',
      source: 'local',
    })
  })

  it('normaliza strings numéricas, descarta linha inválida e ordena da mais recente à mais antiga', async () => {
    const client = createFakeClient({
      data: [
        row(1, { temperature_c: '28.4', humidity_pct: '70' }),
        row(3, { temperature_c: null }),
        { ...row(2), measured_at: 'não é data' },
        row(2),
      ],
    })
    const { readings, discardedCount, truncated } = await fetchReadingHistory(client, { stopId: STOP_ID, now: NOW })

    assert.equal(discardedCount, 1)
    assert.equal(truncated, false)
    assert.deepEqual(
      readings.map((reading) => reading.id),
      ['r-0003', 'r-0002', 'r-0001'],
    )
    assert.equal(readings[2].temperatureC, 28.4)
    assert.equal(readings[2].humidityPct, 70)
    assert.equal(readings[0].temperatureC, null)
  })

  it('com HISTORY_LIMIT + 1 linhas marca truncated e devolve HISTORY_LIMIT leituras', async () => {
    const data = Array.from({ length: HISTORY_LIMIT + 1 }, (_, index) => row(index))
    const result = await fetchReadingHistory(createFakeClient({ data }), { stopId: STOP_ID, now: NOW })

    assert.equal(result.truncated, true)
    assert.equal(result.readings.length, HISTORY_LIMIT)
    assert.equal(result.readings[0].id, `r-${String(HISTORY_LIMIT).padStart(4, '0')}`)
  })

  it('com exatamente HISTORY_LIMIT linhas não marca truncated', async () => {
    const data = Array.from({ length: HISTORY_LIMIT }, (_, index) => row(index))
    const result = await fetchReadingHistory(createFakeClient({ data }), { stopId: STOP_ID, now: NOW })

    assert.equal(result.truncated, false)
    assert.equal(result.readings.length, HISTORY_LIMIT)
  })
})

describe('tradução de erros', () => {
  it('permissão negada (42501) vira kind permission e preserva a causa', async () => {
    const original = { code: '42501', message: 'permission denied for table readings' }
    const client = createFakeClient({ error: original })

    await assert.rejects(fetchReadingHistory(client, { stopId: STOP_ID, now: NOW }), (err) => {
      assert.equal(err.kind, 'permission')
      assert.equal(err.message, 'Você não tem permissão para esta operação.')
      assert.equal(err.cause, original)
      return true
    })
  })

  it('cliente que lança TypeError("Failed to fetch") vira kind network', async () => {
    const original = new TypeError('Failed to fetch')
    const client = createFakeClient({ throws: original })

    await assert.rejects(fetchReadingHistory(client, { stopId: STOP_ID, now: NOW }), (err) => {
      assert.equal(err.kind, 'network')
      assert.equal(err.message, 'Não foi possível conectar ao servidor. Verifique sua conexão.')
      assert.equal(err.cause, original)
      return true
    })
  })

  it('formato real do postgrest-js em falha de fetch ({ error } com message) vira kind network', async () => {
    const original = { message: 'TypeError: Failed to fetch', details: '', hint: '', code: '' }
    const client = createFakeClient({ error: original })

    for (const run of [
      () => fetchReadingHistory(client, { stopId: STOP_ID, now: NOW }),
      () => fetchLatestReadings(client),
    ]) {
      await assert.rejects(run(), (err) => {
        assert.equal(err.kind, 'network')
        assert.equal(err.cause, original)
        return true
      })
    }
  })

  it('código desconhecido vira kind unknown com a mensagem específica do histórico', async () => {
    const original = { code: 'XX999', message: 'erro interno do banco em /var/lib/postgres', details: 'stack...' }
    const client = createFakeClient({ error: original })

    await assert.rejects(fetchReadingHistory(client, { stopId: STOP_ID, now: NOW }), (err) => {
      assert.equal(err.kind, 'unknown')
      assert.equal(err.message, 'Não foi possível consultar o histórico de leituras.')
      assert.equal(err.cause, original)
      return true
    })
  })

  it('a mensagem ao usuário não expõe stack nem detalhes internos', async () => {
    const original = new Error('select * from readings falhou em db.internal:5432')
    const client = createFakeClient({ throws: original })

    await assert.rejects(fetchReadingHistory(client, { stopId: STOP_ID, now: NOW }), (err) => {
      assert.ok(!/db\.internal|select \*|\bat\s.+:\d+/i.test(err.message))
      assert.ok(!err.message.includes('\n'))
      assert.equal(err.message, 'Não foi possível consultar o histórico de leituras.')
      return true
    })
  })

  it('signal já abortado vira kind aborted e isAbortedError é verdadeiro', async () => {
    const controller = new AbortController()
    controller.abort()
    const client = createFakeClient({ data: [row(1)] })

    await assert.rejects(
      fetchReadingHistory(client, { stopId: STOP_ID, now: NOW, signal: controller.signal }),
      (err) => {
        assert.equal(err.kind, 'aborted')
        assert.equal(err.message, 'Consulta cancelada.')
        assert.equal(isAbortedError(err), true)
        return true
      },
    )
  })

  it('o cancelamento tem precedência sobre o erro AbortError devolvido pelo postgrest-js', async () => {
    const controller = new AbortController()
    controller.abort()
    const original = { message: 'AbortError: signal is aborted without reason', code: '' }
    const client = createFakeClient({ error: original })

    await assert.rejects(
      fetchReadingHistory(client, { stopId: STOP_ID, now: NOW, signal: controller.signal }),
      (err) => {
        assert.equal(err.kind, 'aborted')
        assert.equal(err.cause, original)
        return true
      },
    )
  })

  it('o cancelamento também vale quando o cliente lança a exceção', async () => {
    const controller = new AbortController()
    controller.abort()
    const client = createFakeClient({ throws: new TypeError('Failed to fetch') })

    await assert.rejects(fetchLatestReadings(client, { signal: controller.signal }), (err) => isAbortedError(err))
  })

  it('isAbortedError é falso para outros erros e valores vazios', () => {
    assert.equal(isAbortedError(new AppError('x', { kind: 'network' })), false)
    assert.equal(isAbortedError(null), false)
    assert.equal(isAbortedError(undefined), false)
  })
})
