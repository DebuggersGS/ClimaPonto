import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildDashboardInsights } from './dashboardInsights.js'
import { summarizeDashboard } from './readings.js'

const NOW = Date.parse('2026-11-12T15:30:00Z')
const ago = (ms) => new Date(NOW - ms).toISOString()

const stop = (n, extra = {}) => ({ id: `s${n}`, code: `SP-00${n}`, name: `Ponto ${n}`, ...extra })
const reading = (stopId, over = {}) => ({
  id: `r-${stopId}`, stopId, temperatureC: 25, humidityPct: 50, environmentalStatus: 'normal',
  source: 'sensor', measuredAt: ago(1000), measuredAtMs: NOW - 1000, ...over,
})
const byId = (insights, id) => insights.find((i) => i.id === id)

describe('buildDashboardInsights', () => {
  it('sem leituras (ou entrada nula) devolve item explícito de dados insuficientes', () => {
    const empty = summarizeDashboard([stop(1)], [], NOW)
    for (const input of [empty, empty.items, [], null, undefined, {}]) {
      const result = buildDashboardInsights(input, NOW)
      assert.equal(result.length, 1)
      assert.equal(result[0].id, 'insufficient-data')
    }
  })

  it('todo insight tem id, título, texto e explicação', () => {
    const summary = summarizeDashboard([stop(1), stop(2)], [reading('s1'), reading('s2', { source: 'simulation' })], NOW)
    const result = buildDashboardInsights(summary, NOW)
    assert.equal(result.length, 5)
    for (const insight of result) {
      for (const key of ['id', 'title', 'text', 'explanation']) assert.ok(insight[key], `${insight.id}.${key}`)
    }
  })

  it('distribui somente os estados gravados; nulo vira não classificado', () => {
    const readings = [
      reading('s1', { environmentalStatus: 'critical', temperatureC: 40 }),
      reading('s2', { environmentalStatus: 'unclassified' }),
      reading('s3', { environmentalStatus: 'normal' }),
      reading('s4', { environmentalStatus: 'normal' }),
    ]
    const summary = summarizeDashboard([stop(1), stop(2), stop(3), stop(4), stop(5)], readings, NOW)
    const text = byId(buildDashboardInsights(summary, NOW), 'environmental-distribution').text
    assert.equal(text, 'Normal: 2; Crítico: 1; Não classificado: 1.')
  })

  it('aceita o resumo ou apenas os itens, com a mesma saída', () => {
    const summary = summarizeDashboard([stop(1), stop(2)], [reading('s1'), reading('s2', { temperatureC: 30 })], NOW)
    assert.deepEqual(buildDashboardInsights(summary, NOW), buildDashboardInsights(summary.items, NOW))
  })

  it('compara maior e menor entre pontos sem classificar', () => {
    const readings = [reading('s1', { temperatureC: 30.5 }), reading('s2', { temperatureC: 22 }), reading('s3', { temperatureC: 27 })]
    const summary = summarizeDashboard([stop(1), stop(2), stop(3)], readings, NOW)
    const insight = byId(buildDashboardInsights(summary, NOW), 'temperature-extremes')
    assert.match(insight.text, /Maior: 30,5 °C em Ponto 1 \(SP-001\)/)
    assert.match(insight.text, /Menor: 22,0 °C em Ponto 2 \(SP-002\)/)
    assert.match(insight.text, /não é classificação ambiental/)
  })

  it('desempata máximo e mínimo pelo código, independentemente da ordem de entrada', () => {
    const readings = [
      reading('s3', { humidityPct: 80 }), reading('s2', { humidityPct: 80 }),
      reading('s1', { humidityPct: 40 }), reading('s4', { humidityPct: 40 }),
    ]
    const stops = [stop(3), stop(2), stop(4), stop(1)]
    const insight = byId(buildDashboardInsights(summarizeDashboard(stops, readings, NOW), NOW), 'humidity-extremes')
    assert.match(insight.text, /Maior: 80,0 % em Ponto 2/)
    assert.match(insight.text, /Menor: 40,0 % em Ponto 1/)
  })

  it('omite extremos com menos de 2 pontos com valor e ignora nulos', () => {
    const readings = [reading('s1', { temperatureC: 20, humidityPct: null }), reading('s2', { temperatureC: null, humidityPct: 60 })]
    const result = buildDashboardInsights(summarizeDashboard([stop(1), stop(2)], readings, NOW), NOW)
    assert.equal(byId(result, 'temperature-extremes'), undefined)
    assert.equal(byId(result, 'humidity-extremes'), undefined)
  })

  it('valores todos iguais não inventam maior/menor distintos', () => {
    const summary = summarizeDashboard([stop(1), stop(2)], [reading('s1'), reading('s2')], NOW)
    const insight = byId(buildDashboardInsights(summary, NOW), 'temperature-extremes')
    assert.match(insight.text, /^Os 2 pontos com valor registram 25,0 °C\./)
  })

  it('conta offline e sem dados pela regra de conectividade, usando now', () => {
    const readings = [
      reading('s1'),
      reading('s2', { measuredAt: ago(301000), measuredAtMs: NOW - 301000 }),
      reading('s3', { measuredAt: ago(200000), measuredAtMs: NOW - 200000 }),
    ]
    const summary = summarizeDashboard([stop(1), stop(2), stop(3), stop(4)], readings, NOW)
    assert.equal(byId(buildDashboardInsights(summary, NOW), 'stale-stops').text, '2 pontos offline ou sem dados.')
    // com now mais adiantado, todos os pontos com leitura ficam offline
    const later = NOW + 10 * 60000
    assert.equal(byId(buildDashboardInsights(summary, later), 'stale-stops').text, '4 pontos offline ou sem dados.')
  })

  it('informa quando nenhum ponto está sem leitura recente', () => {
    const summary = summarizeDashboard([stop(1)], [reading('s1')], NOW)
    assert.equal(byId(buildDashboardInsights(summary, NOW), 'stale-stops').text, 'Nenhum ponto está offline ou sem dados.')
  })

  it('sinaliza leituras que não são de sensor, só quando existirem', () => {
    const sensorOnly = summarizeDashboard([stop(1)], [reading('s1')], NOW)
    assert.equal(byId(buildDashboardInsights(sensorOnly, NOW), 'simulation-data'), undefined)
    for (const source of ['simulation', 'test', 'unknown']) {
      const summary = summarizeDashboard([stop(1), stop(2)], [reading('s1'), reading('s2', { source })], NOW)
      assert.match(byId(buildDashboardInsights(summary, NOW), 'simulation-data').text, /^1 ponto com/)
    }
  })

  it('é determinístico e não muta a entrada', () => {
    const summary = summarizeDashboard([stop(2), stop(1)], [reading('s1', { temperatureC: 31 }), reading('s2')], NOW)
    const copy = structuredClone(summary)
    assert.deepEqual(buildDashboardInsights(summary, NOW), buildDashboardInsights(summary, NOW))
    assert.deepEqual(summary, copy)
  })
})
