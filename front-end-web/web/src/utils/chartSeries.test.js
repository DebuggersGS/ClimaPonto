import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CHART_BUCKET_MS, buildChartSeries, getValueDomain } from './chartSeries.js'
import { HISTORY_PERIODS } from './historyPeriods.js'

const NOW = new Date('2026-11-12T15:30:00Z')
const NOW_MS = NOW.getTime()
const MIN = 60 * 1000
const HOUR = 60 * MIN

const reading = (offsetMs, temperatureC, humidityPct) => ({
  measuredAtMs: NOW_MS + offsetMs,
  temperatureC,
  humidityPct,
})

describe('buildChartSeries — cobertura dos períodos', () => {
  it('gera o número esperado de intervalos para cada período', () => {
    assert.equal(buildChartSeries([], '24h', NOW).length, 48)
    assert.equal(buildChartSeries([], '7d', NOW).length, 56)
    assert.equal(buildChartSeries([], '30d', NOW).length, 60)
  })

  it('cobre o período inteiro com intervalos contíguos e uniformes', () => {
    for (const period of HISTORY_PERIODS) {
      const series = buildChartSeries([], period.id, NOW)
      assert.equal(Date.parse(series[0].start), NOW_MS - period.durationMs)
      assert.equal(Date.parse(series.at(-1).end), NOW_MS)
      series.forEach((point, i) => {
        assert.equal(Date.parse(point.end) - Date.parse(point.start), CHART_BUCKET_MS[period.id])
        if (i > 0) assert.equal(point.start, series[i - 1].end)
      })
    }
  })

  it('t é o centro do intervalo', () => {
    const [first] = buildChartSeries([], '24h', NOW)
    assert.equal(first.t, Date.parse(first.start) + 15 * MIN)
  })

  it('aceita now como número e período desconhecido cai no padrão', () => {
    assert.equal(buildChartSeries([], '24h', NOW_MS).length, 48)
    assert.equal(buildChartSeries([], 'xyz', NOW).length, 48)
  })
})

describe('buildChartSeries — agregação', () => {
  it('calcula a média e a contagem por grandeza', () => {
    const series = buildChartSeries([reading(-5 * MIN, 30, 50), reading(-10 * MIN, 32, 60)], '24h', NOW)
    const last = series.at(-1)
    assert.equal(last.temperature, 31)
    assert.equal(last.humidity, 55)
    assert.equal(last.temperatureCount, 2)
    assert.equal(last.humidityCount, 2)
  })

  it('média ignora nulos por grandeza, sem tratá-los como zero', () => {
    const series = buildChartSeries(
      [reading(-5 * MIN, 30, null), reading(-6 * MIN, null, 40), reading(-7 * MIN, 34, null)],
      '24h',
      NOW,
    )
    const last = series.at(-1)
    assert.equal(last.temperature, 32)
    assert.equal(last.temperatureCount, 2)
    assert.equal(last.humidity, 40)
    assert.equal(last.humidityCount, 1)
  })

  it('intervalo sem amostra válida é null com contagem zero (lacuna)', () => {
    const series = buildChartSeries([reading(-5 * MIN, 30, null)], '24h', NOW)
    const last = series.at(-1)
    assert.equal(last.humidity, null)
    assert.equal(last.humidityCount, 0)
    assert.equal(series[0].temperature, null)
    assert.equal(series[0].temperatureCount, 0)
  })

  it('não interpola entre intervalos com dados', () => {
    const series = buildChartSeries([reading(-10 * HOUR, 20, 70), reading(-1 * MIN, 30, 50)], '24h', NOW)
    const filled = series.filter((p) => p.temperature !== null)
    assert.equal(filled.length, 2)
    assert.equal(series.filter((p) => p.temperature === null).length, 46)
  })

  it('leitura na borda exata entre intervalos pertence ao posterior', () => {
    const boundary = reading(-30 * MIN, 25, 60)
    const series = buildChartSeries([boundary], '24h', NOW)
    assert.equal(series.at(-1).temperature, 25)
    assert.equal(series.at(-2).temperature, null)
  })

  it('leitura exatamente em now entra no último intervalo', () => {
    const series = buildChartSeries([reading(0, 33, 44)], '24h', NOW)
    assert.equal(series.at(-1).temperature, 33)
  })

  it('leitura exatamente no início do período entra no primeiro intervalo', () => {
    const series = buildChartSeries([reading(-24 * HOUR, 18, 80)], '24h', NOW)
    assert.equal(series[0].temperature, 18)
  })

  it('ignora leituras fora do período', () => {
    const series = buildChartSeries(
      [reading(-24 * HOUR - 1, 10, 10), reading(1, 40, 90), reading(-48 * HOUR, 11, 11)],
      '24h',
      NOW,
    )
    assert.ok(series.every((p) => p.temperature === null && p.humidity === null))
    assert.ok(series.every((p) => p.temperatureCount === 0 && p.humidityCount === 0))
  })

  it('série vazia (e entrada ausente) → todos os intervalos nulos', () => {
    for (const input of [[], null, undefined]) {
      const series = buildChartSeries(input, '7d', NOW)
      assert.equal(series.length, 56)
      assert.ok(series.every((p) => p.temperature === null && p.humidity === null))
    }
  })

  it('períodos longos agregam por seus próprios intervalos', () => {
    const series = buildChartSeries([reading(-1 * HOUR, 30, 50), reading(-2 * HOUR, 32, 60)], '7d', NOW)
    assert.equal(series.at(-1).temperature, 31)
    assert.equal(series.at(-1).temperatureCount, 2)
    const month = buildChartSeries([reading(-10 * HOUR, 28, 55)], '30d', NOW)
    assert.equal(month.at(-1).temperature, 28)
  })

  it('não muta a entrada', () => {
    const input = [reading(-5 * MIN, 30, 50)]
    const copy = structuredClone(input)
    buildChartSeries(input, '24h', NOW)
    assert.deepEqual(input, copy)
  })
})

describe('getValueDomain', () => {
  const seriesOf = (temps) => temps.map((temperature) => ({ temperature, humidity: null }))

  it('usa mín./máx. reais com folga proporcional', () => {
    const domain = getValueDomain(seriesOf([20, null, 30]), 'temperature')
    assert.equal(domain.dataMin, 20)
    assert.equal(domain.dataMax, 30)
    assert.equal(domain.min, 19)
    assert.equal(domain.max, 31)
    assert.equal(domain.hasData, true)
  })

  it('valor constante não gera amplitude zero', () => {
    const domain = getValueDomain(seriesOf([25, 25, null]), 'temperature')
    assert.ok(domain.max > domain.min)
    assert.ok(domain.min < 25 && domain.max > 25)
    assert.ok(Number.isFinite(domain.min) && Number.isFinite(domain.max))
  })

  it('série vazia ou sem valores devolve domínio finito sem dados', () => {
    for (const series of [[], seriesOf([null, null]), null]) {
      const domain = getValueDomain(series, 'temperature')
      assert.equal(domain.hasData, false)
      assert.equal(domain.dataMin, null)
      assert.equal(domain.dataMax, null)
      assert.ok(domain.max > domain.min)
    }
  })

  it('funciona para umidade e rejeita grandeza desconhecida', () => {
    const series = [{ humidity: 40 }, { humidity: 60 }]
    assert.deepEqual(getValueDomain(series, 'humidity'), {
      min: 38,
      max: 62,
      dataMin: 40,
      dataMax: 60,
      hasData: true,
    })
    assert.throws(() => getValueDomain(series, 'pressure'), RangeError)
  })
})
