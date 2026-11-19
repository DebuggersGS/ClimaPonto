import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ENVIRONMENTAL_STATUS_LABELS,
  PLAUSIBLE_RANGES,
  getReadingSourceInfo,
  normalizeEnvironmentalStatus,
  normalizeReading,
  normalizeReadings,
  sortReadingsAsc,
  sortReadingsDesc,
  summarizeSeries,
  attachLatestReadings,
  summarizeDashboard,
  toMeasurement,
} from './readings.js'

// Fixtures de teste: dados sintéticos, não são medições reais.
const NOW = Date.parse('2026-11-12T12:00:00Z')
const iso = (minAgo) => new Date(NOW - minAgo * 60000).toISOString()

function row(overrides = {}) {
  return {
    id: 'r1',
    stop_id: 's1',
    temperature_c: 25.5,
    humidity_pct: '60.0',
    environmental_status: 'normal',
    source: 'sensor',
    measured_at: iso(1),
    received_at: iso(0),
    ...overrides,
  }
}

const reading = (id, stopId, status, minAgo, extra = {}) =>
  normalizeReading(row({ id, stop_id: stopId, environmental_status: status, measured_at: iso(minAgo), ...extra }))

describe('normalizeReading', () => {
  it('converte snake_case para camelCase', () => {
    const r = normalizeReading(row())
    assert.equal(r.id, 'r1')
    assert.equal(r.stopId, 's1')
    assert.equal(r.temperatureC, 25.5)
    assert.equal(r.humidityPct, 60)
    assert.equal(r.environmentalStatus, 'normal')
    assert.equal(r.source, 'sensor')
    assert.equal(r.measuredAtMs, Date.parse(r.measuredAt))
    assert.equal(r.receivedAt, iso(0))
  })

  it('aceita reading_id da view e received_at ausente', () => {
    const { id: _id, ...rest } = row({ reading_id: 'v1', received_at: undefined })
    const r = normalizeReading(rest)
    assert.equal(r.id, 'v1')
    assert.equal(r.receivedAt, null)
  })

  it('retorna null sem id, stop_id ou measured_at válido', () => {
    assert.equal(normalizeReading(null), null)
    assert.equal(normalizeReading(row({ id: undefined })), null)
    assert.equal(normalizeReading(row({ stop_id: null })), null)
    assert.equal(normalizeReading(row({ measured_at: undefined })), null)
    assert.equal(normalizeReading(row({ measured_at: 'ontem' })), null)
  })
})

describe('toMeasurement', () => {
  const range = PLAUSIBLE_RANGES.temperatureC
  it('aceita número e string numérica', () => {
    assert.equal(toMeasurement(25.5, range), 25.5)
    assert.equal(toMeasurement('25.5', range), 25.5)
    assert.equal(toMeasurement(0, range), 0)
  })
  it('rejeita vazio, nulo, texto, NaN, Infinity e fora da faixa', () => {
    for (const v of ['', null, undefined, 'abc', NaN, Infinity, 81, -41]) {
      assert.equal(toMeasurement(v, range), null)
    }
    assert.equal(toMeasurement(101, PLAUSIBLE_RANGES.humidityPct), null)
    assert.equal(toMeasurement(80, range), 80)
    assert.equal(toMeasurement(-40, range), -40)
  })
  it('medição inválida na linha vira null, nunca zero', () => {
    const r = normalizeReading(row({ temperature_c: 'abc', humidity_pct: 101 }))
    assert.equal(r.temperatureC, null)
    assert.equal(r.humidityPct, null)
  })
})

describe('normalizeReadings', () => {
  it('descarta inválidas e conta', () => {
    const { readings, discardedCount } = normalizeReadings([row(), row({ id: 'r2', measured_at: null }), null])
    assert.equal(readings.length, 1)
    assert.equal(discardedCount, 2)
  })
  it('remove duplicata pelo id mantendo a primeira, sem mutar a entrada', () => {
    const rows = [row({ temperature_c: 20 }), row({ temperature_c: 30 })]
    const copy = structuredClone(rows)
    const { readings, discardedCount } = normalizeReadings(rows)
    assert.equal(readings.length, 1)
    assert.equal(readings[0].temperatureC, 20)
    assert.equal(discardedCount, 1)
    assert.deepEqual(rows, copy)
  })
  it('aceita null/undefined', () => {
    assert.deepEqual(normalizeReadings(null), { readings: [], discardedCount: 0 })
    assert.deepEqual(normalizeReadings(undefined), { readings: [], discardedCount: 0 })
  })
})

describe('estado ambiental e origem', () => {
  it('mantém o estado gravado e trata null/desconhecido como não classificado', () => {
    assert.equal(normalizeEnvironmentalStatus('normal'), 'normal')
    assert.equal(normalizeEnvironmentalStatus('attention'), 'attention')
    assert.equal(normalizeEnvironmentalStatus('critical'), 'critical')
    assert.equal(normalizeEnvironmentalStatus(null), 'unclassified')
    assert.equal(normalizeEnvironmentalStatus('hot'), 'unclassified')
  })
  it('rótulos de estado ambiental e de origem', () => {
    assert.deepEqual(ENVIRONMENTAL_STATUS_LABELS, {
      normal: 'Normal',
      attention: 'Atenção',
      critical: 'Crítico',
      unclassified: 'Não classificado',
    })
    assert.equal(getReadingSourceInfo('sensor').label, 'Sensor')
    assert.equal(getReadingSourceInfo('simulation').label, 'Simulação')
  })
  it('não deriva estado de temperatura alta', () => {
    assert.equal(normalizeReading(row({ temperature_c: 79, environmental_status: null })).environmentalStatus, 'unclassified')
  })
  it('classifica origens', () => {
    assert.equal(getReadingSourceInfo('sensor').isRealMeasurement, true)
    assert.equal(getReadingSourceInfo('simulation').note, 'Simulação — não é medição real')
    assert.equal(getReadingSourceInfo('test').label, 'Teste')
    const unknown = getReadingSourceInfo('xyz')
    assert.equal(unknown.key, 'unknown')
    assert.equal(unknown.label, 'Origem desconhecida')
    assert.equal(unknown.isRealMeasurement, false)
    assert.equal(normalizeReading(row({ source: 'xyz' })).source, 'unknown')
  })
  it('estado ambiental nunca é offline e conectividade nunca é critical', () => {
    const stops = [{ id: 's1', isDemo: false }, { id: 's2', isDemo: false }]
    const summary = summarizeDashboard(stops, [reading('a', 's1', 'critical', 600)], NOW)
    for (const item of summary.items) {
      assert.notEqual(item.reading?.environmentalStatus, 'offline')
      assert.notEqual(item.connectivity.status, 'critical')
    }
    assert.equal(Object.hasOwn(summary.environmentalCounts, 'offline'), false)
    assert.equal(Object.hasOwn(summary.connectivityCounts, 'critical'), false)
  })
})

describe('ordenação', () => {
  const a = reading('a', 's1', null, 30)
  const b = reading('b', 's1', null, 20)
  const c = reading('c', 's1', null, 10)
  it('ordena desc e asc a partir de entrada embaralhada, sem mutar', () => {
    const input = [b, c, a]
    assert.deepEqual(sortReadingsDesc(input).map((r) => r.id), ['c', 'b', 'a'])
    assert.deepEqual(sortReadingsAsc(input).map((r) => r.id), ['a', 'b', 'c'])
    assert.deepEqual(input.map((r) => r.id), ['b', 'c', 'a'])
  })
  it('desempata por id', () => {
    const t1 = reading('z', 's1', null, 5)
    const t2 = reading('m', 's1', null, 5)
    assert.deepEqual(sortReadingsDesc([t1, t2]).map((r) => r.id), ['m', 'z'])
    assert.deepEqual(sortReadingsAsc([t1, t2]).map((r) => r.id), ['m', 'z'])
  })
})

describe('summarizeSeries', () => {
  const temps = (values) => values.map((v, i) => reading(`r${i}`, 's1', null, 100 - i, { temperature_c: v }))
  it('série vazia e só nulos', () => {
    for (const list of [[], temps([null, null])]) {
      const s = summarizeSeries(list, 'temperatureC')
      assert.deepEqual([s.count, s.min, s.max, s.average], [0, null, null, null])
      assert.equal(s.trend.status, 'insufficient')
    }
  })
  it('ignora nulos intercalados na média', () => {
    const s = summarizeSeries(temps([20, null, 30]), 'temperatureC')
    assert.equal(s.count, 2)
    assert.equal(s.average, 25)
    assert.equal(s.min, 20)
    assert.equal(s.max, 30)
  })
  it('2 amostras: tendência insuficiente', () => {
    assert.equal(summarizeSeries(temps([20, 21]), 'temperatureC').trend.status, 'insufficient')
  })
  it('3 amostras: tendência disponível, em ordem cronológica, sem ruído', () => {
    const s = summarizeSeries(temps([25.3, 24.9, 24.1].reverse()), 'temperatureC')
    assert.deepEqual(s.trend, { status: 'available', first: 24.1, last: 25.3, variation: 1.2 })
  })
})

describe('attachLatestReadings', () => {
  it('mantém ordem dos pontos, ignora leitura órfã e escolhe a mais recente', () => {
    const stops = [{ id: 's1' }, { id: 's2' }]
    const result = attachLatestReadings(stops, [
      reading('a', 's1', null, 30),
      reading('b', 's1', null, 10),
      reading('o', 'orfao', null, 1),
    ])
    assert.equal(result.length, 2)
    assert.equal(result[0].reading.id, 'b')
    assert.equal(result[1].reading, null)
  })
})

describe('summarizeDashboard', () => {
  it('lista vazia', () => {
    const s = summarizeDashboard([], [], NOW)
    assert.equal(s.monitoredCount, 0)
    assert.equal(s.latest, null)
    assert.deepEqual(s.items, [])
  })
  it('leitura órfã não entra nas contagens', () => {
    const s = summarizeDashboard([{ id: 's1' }], [reading('o', 'orfao', 'critical', 1)], NOW)
    assert.equal(s.withReadingsCount, 0)
    assert.equal(s.noDataCount, 1)
    assert.equal(s.environmentalCounts.critical, 0)
    assert.equal(s.latest, null)
  })
  it('todos sem dados: no_data, nunca não classificado', () => {
    const s = summarizeDashboard([{ id: 's1' }, { id: 's2' }], [], NOW)
    assert.equal(s.noDataCount, 2)
    assert.equal(s.connectivityCounts.no_data, 2)
    assert.equal(s.environmentalCounts.unclassified, 0)
    assert.equal(s.environmentalCounts.critical, 0)
  })
  it('contagens somam os totais e contam demo', () => {
    const stops = [{ id: 's1', isDemo: true }, { id: 's2', isDemo: true }, { id: 's3', isDemo: false }, { id: 's4' }]
    const s = summarizeDashboard(stops, [
      reading('a', 's1', 'normal', 1),
      reading('b', 's2', null, 40),
      reading('c', 's3', 'critical', 600),
    ], NOW)
    const sum = (o) => Object.values(o).reduce((x, y) => x + y, 0)
    assert.equal(s.withReadingsCount, 3)
    assert.equal(s.noDataCount, 1)
    assert.equal(s.demoCount, 2)
    assert.equal(sum(s.environmentalCounts), s.withReadingsCount)
    assert.equal(sum(s.connectivityCounts), s.monitoredCount)
    assert.equal(s.environmentalCounts.unclassified, 1)
    assert.deepEqual(
      [s.connectivityCounts.online, s.connectivityCounts.delayed, s.connectivityCounts.offline, s.connectivityCounts.no_data],
      [1, 1, 1, 1],
    )
  })
  it('leitura antiga normal => normal e offline; crítica recente => critical e online', () => {
    const s = summarizeDashboard(
      [{ id: 's1' }, { id: 's2' }],
      [reading('a', 's1', 'normal', 600), reading('b', 's2', 'critical', 1)],
      NOW,
    )
    assert.equal(s.items[0].reading.environmentalStatus, 'normal')
    assert.equal(s.items[0].connectivity.status, 'offline')
    assert.equal(s.items[1].reading.environmentalStatus, 'critical')
    assert.equal(s.items[1].connectivity.status, 'online')
  })
  it('latest: maior measuredAt; empate vale o primeiro ponto', () => {
    const stops = [{ id: 's1' }, { id: 's2' }, { id: 's3' }]
    const s = summarizeDashboard(stops, [
      reading('a', 's3', 'normal', 5),
      reading('b', 's2', 'normal', 5),
      reading('c', 's1', 'normal', 9),
    ], NOW)
    assert.equal(s.latest.stop.id, 's2')
  })
})
