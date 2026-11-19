import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { deriveStopAlerts } from './stopAlerts.js'
import { summarizeDashboard } from './readings.js'

const NOW = Date.parse('2026-11-12T15:30:00Z')
const MIN = 10 * 60000 // um intervalo de leitura (10 min)

const stops = ['a', 'b', 'c', 'd', 'e', 'f'].map((id, i) => ({ id, code: `P-${i + 1}`, name: `Ponto ${id}`, neighborhood: 'X' }))
const reading = (stopId, status, ageMs, source = 'simulation', extra = {}) => ({
  id: `r-${stopId}`,
  stopId,
  environmentalStatus: status,
  measuredAt: new Date(NOW - ageMs).toISOString(),
  measuredAtMs: NOW - ageMs,
  source,
  temperatureC: 40,
  humidityPct: 10,
  ...extra,
})
const alertsFor = (readings, options = {}) => deriveStopAlerts(summarizeDashboard(stops, readings, NOW).items, { now: NOW, ...options })

describe('deriveStopAlerts', () => {
  it('sem itens ou sem leituras não gera alerta', () => {
    assert.deepEqual(deriveStopAlerts([], { now: NOW }), [])
    assert.deepEqual(deriveStopAlerts(null, { now: NOW }), [])
    assert.deepEqual(alertsFor([]), [])
  })

  it('normal, não classificado e ponto sem dados não geram alerta', () => {
    assert.deepEqual(alertsFor([reading('a', 'normal', MIN), reading('b', 'unclassified', MIN)]), [])
  })

  it('crítico e atenção gravados e online geram alerta ambiental com regra, origem e horário', () => {
    const [critical, attention] = alertsFor([reading('a', 'attention', MIN), reading('b', 'critical', 2 * MIN, 'test')])
    assert.equal(critical.stopCode, 'P-2')
    assert.equal(critical.type, 'environmental')
    assert.equal(critical.severity, 'critical')
    assert.equal(critical.stale, false)
    assert.equal(critical.origin.key, 'test')
    assert.equal(critical.origin.isRealMeasurement, false)
    assert.equal(critical.readingAt, new Date(NOW - 2 * MIN).toISOString())
    assert.match(critical.ruleText, /gravado/)
    assert.equal(attention.severity, 'attention')
    assert.equal(attention.origin.key, 'simulation')
    assert.equal(attention.stopName, 'Ponto a')
  })

  it('leitura atrasada (não offline) ainda gera o alerta ambiental', () => {
    const [alert] = alertsFor([reading('a', 'critical', 4 * MIN)])
    assert.equal(alert.type, 'environmental')
  })

  it('leitura antiga com estado crítico vira alerta de conectividade desatualizado, nunca de calor', () => {
    const alerts = alertsFor([reading('a', 'critical', 10 * MIN)])
    assert.equal(alerts.length, 1)
    assert.equal(alerts[0].type, 'connectivity')
    assert.equal(alerts[0].severity, 'offline')
    assert.equal(alerts[0].stale, true)
    assert.match(alerts[0].ruleText, /provisória/)
    assert.match(alerts[0].ruleText, /desatualizado/)
  })

  it('limite exato do offline (5 intervalos) ainda é ambiental; um ms depois é conectividade', () => {
    assert.equal(alertsFor([reading('a', 'critical', 5 * MIN)])[0].type, 'environmental')
    assert.equal(alertsFor([reading('a', 'critical', 5 * MIN + 1)])[0].type, 'connectivity')
  })

  it('respeita sendIntervalMs informado', () => {
    assert.equal(alertsFor([reading('a', 'normal', 3 * MIN)], { sendIntervalMs: 5 * 60000 }).length, 1)
    assert.equal(alertsFor([reading('a', 'normal', 3 * MIN)], { sendIntervalMs: 10 * 60000 }).length, 0)
  })

  it('offline normal gera só alerta de conectividade', () => {
    const alerts = alertsFor([reading('a', 'normal', 60 * MIN)])
    assert.deepEqual(alerts.map((a) => a.type), ['connectivity'])
  })

  it('não usa temperatura nem umidade: valores extremos com estado normal não alertam', () => {
    assert.deepEqual(alertsFor([reading('a', 'normal', MIN, 'simulation', { temperatureC: 60, humidityPct: 1 })]), [])
  })

  it('ordena por severidade (crítico, offline, atenção) e depois por horário mais recente', () => {
    const alerts = alertsFor([
      reading('a', 'attention', 1 * MIN),
      reading('b', 'critical', 3 * MIN),
      reading('c', 'normal', 60 * MIN),
      reading('d', 'critical', 1 * MIN),
      reading('e', 'attention', 2 * MIN),
    ])
    assert.deepEqual(alerts.map((a) => a.stopCode), ['P-4', 'P-2', 'P-3', 'P-1', 'P-5'])
  })

  it('não muta os itens de entrada', () => {
    const items = summarizeDashboard(stops, [reading('a', 'critical', MIN)], NOW).items
    const copy = structuredClone(items)
    deriveStopAlerts(items, { now: NOW })
    assert.deepEqual(items, copy)
  })
})
