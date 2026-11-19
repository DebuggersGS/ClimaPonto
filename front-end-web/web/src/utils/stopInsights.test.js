import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { formatTemperature } from './formatters.js'
import {
  buildStopNarrative,
  checkStopsComparability,
  sliceReadingsByWindow,
  summarizeCurrent,
  summarizeStopQuality,
} from './stopInsights.js'
import { buildReadingsCsv } from './readingsCsv.js'

const NOW = Date.parse('2026-11-12T12:00:00Z')
const MIN = 60000
let seq = 0

const reading = (minutesAgo, over = {}) => {
  const measuredAtMs = NOW - minutesAgo * MIN
  seq += 1
  return {
    id: `r${seq}`,
    stopId: 'a',
    temperatureC: 30,
    humidityPct: 60,
    environmentalStatus: 'normal',
    source: 'sensor',
    measuredAt: new Date(measuredAtMs).toISOString(),
    measuredAtMs,
    ...over,
  }
}

describe('sliceReadingsByWindow', () => {
  it('recorta pela janela, ordena do mais recente e descarta futuro e fora da janela', () => {
    const inside = [reading(10), reading(120)]
    const slice = sliceReadingsByWindow([...inside, reading(60 * 25), reading(-30)], '24h', NOW)
    assert.deepEqual(slice.readings.map((r) => r.id), inside.map((r) => r.id))
    assert.equal(slice.periodId, '24h')
    assert.equal(slice.endMs, NOW)
    assert.equal(slice.truncated, false)
  })

  it('período desconhecido vira o padrão e janelas maiores incluem mais leituras', () => {
    const rows = [reading(60 * 25), reading(60 * 24 * 8)]
    assert.equal(sliceReadingsByWindow(rows, 'xyz', NOW).periodId, '24h')
    assert.equal(sliceReadingsByWindow(rows, '7d', NOW).readings.length, 1)
    assert.equal(sliceReadingsByWindow(rows, '30d', NOW).readings.length, 2)
  })

  it('aplica limite sinalizando truncamento; Infinity não limita', () => {
    const rows = [reading(1), reading(2), reading(3)]
    const limited = sliceReadingsByWindow(rows, '24h', NOW, { limit: 2 })
    assert.equal(limited.readings.length, 2)
    assert.equal(limited.truncated, true)
    assert.equal(limited.inWindowCount, 3)
    assert.equal(sliceReadingsByWindow(rows, '24h', NOW, { limit: Infinity }).truncated, false)
  })

  it('o CSV recebe exatamente as linhas do recorte (mesmo conjunto do gráfico e da tabela)', () => {
    const slice = sliceReadingsByWindow([reading(5), reading(30), reading(60 * 30)], '24h', NOW)
    const csv = buildReadingsCsv(slice.readings, { code: 'PT-01', name: 'Ponto' }, { periodId: slice.periodId })
    assert.equal(csv.trimEnd().split('\r\n').length - 1, slice.readings.length)
  })
})

describe('summarizeCurrent', () => {
  it('vazio: nada disponível, sem zero', () => {
    const s = summarizeCurrent([])
    assert.equal(s.hasAny, false)
    assert.equal(s.temperature.status, 'absent')
    assert.equal(s.humidity.status, 'absent')
    assert.ok(!('value' in s.temperature))
  })

  it('parcial: umidade ausente na última leitura usa a mais recente que a tem, com seu próprio horário e origem', () => {
    const older = reading(30, { humidityPct: 55, source: 'simulation' })
    const newest = reading(5, { temperatureC: 33, humidityPct: null })
    const s = summarizeCurrent([older, newest])
    assert.equal(s.temperature.value, 33)
    assert.equal(s.temperature.source, 'sensor')
    assert.equal(s.temperature.isRealMeasurement, true)
    assert.equal(s.humidity.value, 55)
    assert.equal(s.humidity.measuredAt, older.measuredAt)
    assert.equal(s.humidity.sourceLabel, 'Simulação')
    assert.equal(s.humidity.isRealMeasurement, false)
  })

  it('zero real é valor, não ausência', () => {
    const s = summarizeCurrent([reading(1, { temperatureC: 0, humidityPct: null })])
    assert.equal(s.temperature.status, 'available')
    assert.equal(s.temperature.value, 0)
    assert.equal(s.humidity.status, 'absent')
  })
})

describe('summarizeStopQuality e narrativa', () => {
  it('vazio: zero amostras, sem idade e narrativa de ausência', () => {
    const slice = sliceReadingsByWindow([], '24h', NOW)
    const quality = summarizeStopQuality(slice, NOW)
    assert.equal(quality.sampleCount, 0)
    assert.equal(quality.lastReadingAgeMs, null)
    assert.equal(quality.connectivity, 'no_data')
    assert.equal(quality.completenessPct, 0)
    assert.equal(quality.sourceDistribution.every((o) => o.count === 0 && o.pct === null), true)
    assert.deepEqual(buildStopNarrative(slice, quality), ['Não há leituras neste ponto nas últimas 24 horas.'])
  })

  it('sem lacunas: distribuição por origem, idade da última leitura e frase de ausência de lacunas', () => {
    const rows = [reading(2), reading(3), reading(4), reading(5, { source: 'simulation' })]
    const slice = sliceReadingsByWindow(rows, '24h', NOW)
    const quality = summarizeStopQuality(slice, NOW)
    assert.equal(quality.sampleCount, 4)
    assert.equal(quality.gapCount, 0)
    assert.equal(quality.lastReadingAgeMs, 2 * MIN)
    const bySource = Object.fromEntries(quality.sourceDistribution.map((o) => [o.source, o]))
    assert.equal(bySource.sensor.count, 3)
    assert.equal(bySource.sensor.pct, 75)
    assert.equal(bySource.simulation.count, 1)
    assert.equal(bySource.test.count, 0)
    assert.equal(quality.hasNonRealData, true)
    const text = buildStopNarrative(slice, quality).join(' ')
    assert.match(text, /4 leituras/)
    assert.match(text, /Nenhuma lacuna/)
    assert.match(text, /não são medição real/)
    assert.match(text, /Sensor \(3\), Simulação \(1\)/)
  })

  it('com lacuna: conta só intervalos acima do limite e a narrativa cita a maior', () => {
    // limite = 5 x 10 min = 50 min; lacunas de 60 min e 120 min; 40 min não conta
    const rows = [reading(10), reading(50), reading(110), reading(230), reading(240)]
    const slice = sliceReadingsByWindow(rows, '24h', NOW)
    const quality = summarizeStopQuality(slice, NOW)
    assert.equal(quality.gapCount, 2)
    assert.equal(quality.largestGapMs, 120 * MIN)
    assert.equal(quality.gapThresholdMs, 50 * MIN)
    const text = buildStopNarrative(slice, quality).join(' ')
    assert.match(text, /2 lacunas acima de 50 min/)
    assert.match(text, /a maior tem 2 h/)
  })

  it('parcial: variável sem valores é dita como ausente e não entra em médias', () => {
    const rows = [reading(1, { humidityPct: null }), reading(2, { humidityPct: null }), reading(3, { humidityPct: null })]
    const slice = sliceReadingsByWindow(rows, '24h', NOW)
    const text = buildStopNarrative(slice, summarizeStopQuality(slice, NOW)).join(' ')
    assert.match(text, /Umidade: sem valores no período\./)
    assert.match(text, new RegExp(`Temperatura: de ${formatTemperature(30)}`))
  })

  it('tendência só com amostras suficientes; com poucas, avisa', () => {
    const few = sliceReadingsByWindow([reading(1, { temperatureC: 31 }), reading(2, { temperatureC: 30 })], '24h', NOW)
    assert.match(buildStopNarrative(few, summarizeStopQuality(few, NOW)).join(' '), /insuficientes para indicar tendência/)
    const rows = [reading(1, { temperatureC: 32.5 }), reading(2, { temperatureC: 31 }), reading(3, { temperatureC: 30 })]
    const enough = sliceReadingsByWindow(rows, '24h', NOW)
    assert.match(buildStopNarrative(enough, summarizeStopQuality(enough, NOW)).join(' '), /\+2,5 °C \(alta\)/)
  })

  it('é determinística e avisa de truncamento', () => {
    const rows = [reading(1), reading(2), reading(3)]
    const slice = sliceReadingsByWindow(rows, '24h', NOW, { limit: 2 })
    const quality = summarizeStopQuality(slice, NOW)
    const first = buildStopNarrative(slice, quality)
    assert.deepEqual(buildStopNarrative(slice, quality), first)
    assert.match(first.join(' '), /2 leituras mais recentes de 3/)
  })
})

describe('checkStopsComparability', () => {
  const side = (stopId, readings, over = {}) => ({ stopId, readings, variable: 'temperatureC', periodId: '24h', ...over })
  const mk = (stopId, minutesAgo, over = {}) => reading(minutesAgo, { stopId, ...over })

  it('compara a mesma variável e período, com origem comum e trecho sobreposto', () => {
    // trecho comum: de 19 a 11 min atrás; só a leitura de A com 15 min cai nele
    const a = side('a', [mk('a', 10, { temperatureC: 40 }), mk('a', 15, { temperatureC: 31 }), mk('a', 20, { temperatureC: 40 })])
    const b = side('b', [mk('b', 11, { temperatureC: 28 }), mk('b', 19, { temperatureC: 30 })])
    const result = checkStopsComparability(a, b, NOW)
    assert.equal(result.status, 'comparable')
    assert.equal(result.unit, '°C')
    assert.equal(result.source, 'sensor')
    assert.equal(result.a.n, 1)
    assert.equal(result.a.average, 31)
    assert.equal(result.b.average, 29)
    assert.equal(result.averageDifference, 2)
  })

  it('incompatível: variável, período e variável inválida têm motivo explícito', () => {
    const a = side('a', [mk('a', 10)])
    const b = side('b', [mk('b', 10)])
    assert.equal(checkStopsComparability(a, { ...b, variable: 'humidityPct' }, NOW).reason, 'variable-mismatch')
    assert.equal(checkStopsComparability(a, { ...b, periodId: '7d' }, NOW).reason, 'period-mismatch')
    assert.equal(checkStopsComparability({ ...a, variable: 'x' }, { ...b, variable: 'x' }, NOW).reason, 'invalid-variable')
    const blockedResult = checkStopsComparability(a, { ...b, periodId: '7d' }, NOW)
    assert.equal(blockedResult.status, 'not-comparable')
    assert.ok(blockedResult.message.length > 0)
  })

  it('incompatível: mesmo ponto, origens sem coincidência e trechos sem sobreposição', () => {
    const a = side('a', [mk('a', 10)])
    assert.equal(checkStopsComparability(a, side('a', [mk('a', 10)]), NOW).reason, 'same-stop')
    assert.equal(
      checkStopsComparability(a, side('b', [mk('b', 10, { source: 'simulation' })]), NOW).reason,
      'no-common-source',
    )
    assert.equal(checkStopsComparability(side('a', [mk('a', 600)]), side('b', [mk('b', 10)]), NOW).reason, 'no-overlap')
  })

  it('sem dados: ausência da variável nunca vira zero nem comparação', () => {
    const withTemp = side('a', [mk('a', 10)])
    const noTemp = side('b', [mk('b', 10, { temperatureC: null })])
    assert.equal(checkStopsComparability(withTemp, noTemp, NOW).reason, 'no-data-b')
    assert.equal(checkStopsComparability(noTemp, { ...withTemp, stopId: 'c' }, NOW).reason, 'no-data-a')
    assert.equal(checkStopsComparability(side('a', []), side('b', []), NOW).reason, 'no-data-a')
  })

  it('leituras fora do período não contam como dado', () => {
    const old = side('b', [mk('b', 60 * 30)])
    assert.equal(checkStopsComparability(side('a', [mk('a', 10)]), old, NOW).reason, 'no-data-b')
    assert.equal(checkStopsComparability(side('a', [mk('a', 10)]), { ...old, periodId: '24h' }, NOW).reason, 'no-data-b')
  })
})
