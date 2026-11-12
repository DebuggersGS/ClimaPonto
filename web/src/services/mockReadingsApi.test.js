import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { MOCK_SCENARIOS } from '../data/mock/mockDataset.js'
import { getConnectivity } from '../utils/connectivity.js'
import { buildChartSeries } from '../utils/chartSeries.js'
import { HISTORY_LIMIT, HISTORY_PERIODS, getPeriodStart } from '../utils/historyPeriods.js'
import { AppError } from './errors.js'
import { createMockReadingsApi } from './mockReadingsApi.js'
import { isAbortedError } from './readingsApi.js'

const AGORA = new Date('2026-11-12T15:07:30.500Z')
const stopId = (scenarioId) => MOCK_SCENARIOS.find((scenario) => scenario.id === scenarioId).stopId
const criar = (options) => createMockReadingsApi({ now: () => AGORA, ...options })

describe('createMockReadingsApi: isolamento do Supabase', () => {
  it('o código não importa supabaseClient.js nem lê import.meta.env', () => {
    const codigo = readFileSync(new URL('./mockReadingsApi.js', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    assert.doesNotMatch(codigo, /supabaseClient/)
    assert.doesNotMatch(codigo, /import\.meta\.env/)
  })
})

describe('createMockReadingsApi: pontos', () => {
  it('lista os 8 pontos ordenados pelo código, no formato camelCase da interface', async () => {
    const stops = await criar().listStops()
    assert.equal(stops.length, 8)
    assert.deepEqual(stops.map((stop) => stop.code), [...stops.map((stop) => stop.code)].sort())
    assert.equal(typeof stops[0].isDemo, 'boolean')
    assert.equal(stops[0].createdAt, '2026-11-01T00:00:00Z')
    assert.equal(stops.find((stop) => stop.isDemo).code, 'MOCK-08')
  })

  it('conta as leituras de um ponto sem alterá-las', async () => {
    const api = criar()
    assert.ok((await api.countStopReadings(stopId('long_history'))) > 400)
    assert.equal(await api.countStopReadings(stopId('no_data')), 0)
    assert.equal(await api.countStopReadings('inexistente'), 0)
  })
})

describe('createMockReadingsApi: últimas leituras', () => {
  it('devolve o formato normalizado, só com origens simulation/test e sem descarte', async () => {
    const resultado = await criar().fetchLatestReadings()
    assert.equal(resultado.source, 'mock')
    assert.equal(resultado.discardedCount, 0)
    assert.equal(resultado.readings.length, 7)
    for (const reading of resultado.readings) {
      assert.ok(['simulation', 'test'].includes(reading.source))
      assert.equal(typeof reading.measuredAtMs, 'number')
      assert.equal(typeof reading.temperatureC, 'number')
    }
  })

  it('o ponto sem dados não tem última leitura', async () => {
    const { readings } = await criar().fetchLatestReadings()
    assert.ok(!readings.some((reading) => reading.stopId === stopId('no_data')))
  })
})

describe('createMockReadingsApi: histórico', () => {
  for (const periodo of HISTORY_PERIODS) {
    it(`período ${periodo.id}: filtra por ponto e início, ordena da mais recente à mais antiga`, async () => {
      const resultado = await criar().fetchReadingHistory({ stopId: stopId('normal'), periodId: periodo.id })
      const inicio = Date.parse(getPeriodStart(periodo.id, AGORA))
      assert.equal(resultado.periodId, periodo.id)
      assert.equal(resultado.from, getPeriodStart(periodo.id, AGORA))
      assert.equal(resultado.source, 'mock')
      assert.ok(resultado.readings.length > 0)
      for (const reading of resultado.readings) {
        assert.equal(reading.stopId, stopId('normal'))
        assert.ok(reading.measuredAtMs >= inicio)
      }
      for (let i = 1; i < resultado.readings.length; i += 1) {
        assert.ok(resultado.readings[i - 1].measuredAtMs > resultado.readings[i].measuredAtMs)
      }
    })
  }

  it('períodos maiores trazem mais leituras', async () => {
    const api = criar()
    const contagens = []
    for (const periodo of HISTORY_PERIODS) {
      contagens.push((await api.fetchReadingHistory({ stopId: stopId('long_history'), periodId: periodo.id })).readings.length)
    }
    assert.ok(contagens[0] < contagens[1] && contagens[1] < contagens[2], contagens.join(' < '))
  })

  it('período desconhecido ou ausente usa o padrão de 24 h', async () => {
    const resultado = await criar().fetchReadingHistory({ stopId: stopId('normal'), periodId: 'xyz' })
    assert.equal(resultado.periodId, '24h')
  })

  it('o ponto "sem dados" devolve lista vazia, sem truncamento', async () => {
    const resultado = await criar().fetchReadingHistory({ stopId: stopId('no_data'), periodId: '30d' })
    assert.deepEqual(resultado.readings, [])
    assert.equal(resultado.truncated, false)
  })

  it('o histórico longo cabe em HISTORY_LIMIT e não é truncado em nenhum período', async () => {
    for (const periodo of HISTORY_PERIODS) {
      const resultado = await criar().fetchReadingHistory({ stopId: stopId('long_history'), periodId: periodo.id })
      assert.ok(resultado.readings.length <= HISTORY_LIMIT)
      assert.equal(resultado.truncated, false, `período ${periodo.id}`)
    }
  })

  it('com limite menor mantém as leituras mais recentes e indica truncamento', async () => {
    const completo = await criar().fetchReadingHistory({ stopId: stopId('long_history'), periodId: '30d' })
    const limitado = await criar({ historyLimit: 100 }).fetchReadingHistory({ stopId: stopId('long_history'), periodId: '30d' })
    assert.equal(limitado.readings.length, 100)
    assert.equal(limitado.truncated, true)
    assert.deepEqual(limitado.readings, completo.readings.slice(0, 100))
  })

  it('com limite exatamente igual ao número de linhas não indica truncamento', async () => {
    const completo = await criar().fetchReadingHistory({ stopId: stopId('normal'), periodId: '24h' })
    const exato = await criar({ historyLimit: completo.readings.length }).fetchReadingHistory({
      stopId: stopId('normal'),
      periodId: '24h',
    })
    assert.equal(exato.truncated, false)
    assert.equal(exato.readings.length, completo.readings.length)
  })

  it('sem stopId rejeita com o mesmo erro de validação da fonte real', async () => {
    await assert.rejects(criar().fetchReadingHistory({ periodId: '24h' }), (err) => {
      assert.ok(err instanceof AppError)
      assert.equal(err.kind, 'validation')
      assert.equal(err.message, 'Selecione um ponto para consultar o histórico.')
      return true
    })
    await assert.rejects(criar().fetchReadingHistory(), { kind: 'validation' })
  })

  it('ponto inexistente rejeita com erro de validação', async () => {
    await assert.rejects(criar().fetchReadingHistory({ stopId: 'nao-existe', periodId: '24h' }), (err) => {
      assert.equal(err.kind, 'validation')
      return true
    })
  })

  it('usa o "agora" informado na consulta no lugar do relógio da fábrica', async () => {
    const depois = new Date(AGORA.getTime() + 2 * 60 * 60 * 1000)
    const resultado = await criar().fetchReadingHistory({ stopId: stopId('normal'), periodId: '24h', now: depois })
    assert.equal(resultado.from, getPeriodStart('24h', depois))
    assert.ok(resultado.readings[0].measuredAtMs > AGORA.getTime())
  })
})

describe('createMockReadingsApi: estabilidade no tempo', () => {
  const situacoes = {
    normal: 'online',
    attention: 'online',
    critical: 'online',
    long_history: 'online',
    demo: 'online',
    delayed: 'delayed',
    offline: 'offline',
  }

  for (const deslocamentoMin of [0, 15]) {
    it(`com "agora" + ${deslocamentoMin} min cada cenário mantém sua conectividade`, async () => {
      const instante = new Date(AGORA.getTime() + deslocamentoMin * 60 * 1000)
      const { readings } = await criar({ now: () => instante }).fetchLatestReadings()
      for (const [cenario, esperado] of Object.entries(situacoes)) {
        const reading = readings.find((item) => item.stopId === stopId(cenario))
        assert.equal(getConnectivity(reading.measuredAt, instante).status, esperado, cenario)
      }
    })
  }

  it('o ponto atrasado e o offline continuam assim a qualquer minuto da hora', async () => {
    for (let segundos = 0; segundos < 3600; segundos += 37) {
      const instante = new Date(AGORA.getTime() + segundos * 1000)
      const { readings } = await criar({ now: () => instante }).fetchLatestReadings()
      const status = (cenario) =>
        getConnectivity(readings.find((item) => item.stopId === stopId(cenario)).measuredAt, instante).status
      assert.equal(status('normal'), 'online')
      assert.equal(status('delayed'), 'delayed')
      assert.equal(status('offline'), 'offline')
    }
  })
})

describe('createMockReadingsApi: estabilidade em T e T + 15 min com histórico', () => {
  it('a última leitura de cada cenário mantém a conectividade ao consultar o histórico em T e T + 15 min', async () => {
    const esperado = { normal: 'online', delayed: 'delayed', offline: 'offline' }
    for (const deslocamentoMin of [0, 15]) {
      const instante = new Date(AGORA.getTime() + deslocamentoMin * 60 * 1000)
      for (const [cenario, status] of Object.entries(esperado)) {
        const { readings } = await criar({ now: () => instante }).fetchReadingHistory({
          stopId: stopId(cenario),
          periodId: '24h',
        })
        assert.equal(getConnectivity(readings[0].measuredAt, instante).status, status, `${cenario} +${deslocamentoMin}`)
      }
    }
  })
})

describe('createMockReadingsApi: histórico longo e gráficos', () => {
  for (const periodo of HISTORY_PERIODS) {
    it(`período ${periodo.id}: não truncado e pelo menos 90% dos intervalos do gráfico têm amostra`, async () => {
      const resultado = await criar().fetchReadingHistory({ stopId: stopId('long_history'), periodId: periodo.id })
      assert.equal(resultado.truncated, false)

      const series = buildChartSeries(resultado.readings, periodo.id, AGORA)
      const comAmostra = series.filter((ponto) => ponto.temperatureCount > 0 && ponto.humidityCount > 0).length
      assert.ok(comAmostra / series.length >= 0.9, `${comAmostra} de ${series.length} intervalos`)
    })
  }
})

describe('createMockReadingsApi: cancelamento', () => {
  it('AbortSignal já abortado rejeita com erro reconhecido por isAbortedError', async () => {
    const controller = new AbortController()
    controller.abort()
    const api = criar()
    await assert.rejects(api.fetchLatestReadings({ signal: controller.signal }), isAbortedError)
    await assert.rejects(api.listStops({ signal: controller.signal }), isAbortedError)
    await assert.rejects(
      api.fetchReadingHistory({ stopId: stopId('normal'), periodId: '24h', signal: controller.signal }),
      isAbortedError,
    )
  })

  it('AbortSignal abortado durante a latência simulada rejeita como cancelamento', async () => {
    const controller = new AbortController()
    const api = criar({ latencyMs: 5000 })
    const promessa = api.fetchReadingHistory({ stopId: stopId('normal'), periodId: '7d', signal: controller.signal })
    setTimeout(() => controller.abort(), 5)
    await assert.rejects(promessa, isAbortedError)
  })

  it('a latência simulada atrasa a resposta, que ainda chega sem cancelamento', async () => {
    const inicio = performance.now()
    const resultado = await criar({ latencyMs: 40 }).fetchLatestReadings()
    assert.ok(performance.now() - inicio >= 35)
    assert.equal(resultado.readings.length, 7)
  })
})

describe('createMockReadingsApi: escritas e falha simulada', () => {
  it('escritas de pontos rejeitam com AppError de indisponibilidade e não alteram os dados', async () => {
    const api = criar()
    const antes = await api.listStops({ includeInactive: true })
    const entrada = { code: 'X', name: 'X', neighborhood: 'X' }
    const operacoes = [
      () => api.createStop(entrada),
      () => api.updateStop(antes[0].id, entrada),
      () => api.setStopActive(antes[0].id, false),
      () => api.deleteStop(antes[0].id),
    ]
    for (const operacao of operacoes) {
      await assert.rejects(operacao(), (err) => {
        assert.ok(err instanceof AppError)
        assert.equal(err.kind, 'unavailable')
        assert.match(err.message, /modo demonstração/)
        return true
      })
    }
    assert.deepEqual(await api.listStops({ includeInactive: true }), antes)
  })

  it('a falha simulada rejeita as consultas com erro de rede traduzido', async () => {
    const api = criar({ failure: true })
    for (const consulta of [
      () => api.listStops(),
      () => api.fetchLatestReadings(),
      () => api.fetchReadingHistory({ stopId: stopId('normal'), periodId: '24h' }),
    ]) {
      await assert.rejects(consulta(), (err) => {
        assert.ok(err instanceof AppError)
        assert.equal(err.kind, 'network')
        assert.match(err.message, /Não foi possível conectar/)
        assert.ok(err.cause instanceof TypeError)
        return true
      })
    }
  })

  it('o cancelamento tem precedência sobre a falha simulada', async () => {
    const controller = new AbortController()
    controller.abort()
    await assert.rejects(criar({ failure: true }).fetchLatestReadings({ signal: controller.signal }), isAbortedError)
  })
})
