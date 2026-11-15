import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildHourlyProfile, buildWeekdayProfile, MIN_SAMPLES_PER_BUCKET } from './temporalProfiles.js'

let seq = 0
const r = (iso, temperatureC, humidityPct = null) => ({
  id: String(++seq),
  measuredAtMs: Date.parse(iso),
  temperatureC,
  humidityPct,
})

describe('buildHourlyProfile', () => {
  it('sempre devolve 24 faixas; as sem leitura ficam vazias', () => {
    const { buckets } = buildHourlyProfile([r('2026-11-12T15:00:00Z', 30)])
    assert.equal(buckets.length, 24)
    assert.equal(buckets.filter((b) => !b.empty).length, 1)
    assert.equal(buckets[0].empty, true)
    assert.equal(buckets[0].temperature.avg, null)
  })

  it('usa a hora de São Paulo (UTC-3) e vira o dia corretamente', () => {
    // 02:30Z do dia 12 = 23:30 do dia 11 em São Paulo
    const { buckets } = buildHourlyProfile([r('2026-11-12T02:30:00Z', 25)])
    assert.equal(buckets[23].empty, false)
    assert.equal(buckets[23].label, '23h')
    assert.equal(buckets[2].empty, true)
  })

  it('agrega média, mínimo e máximo ignorando nulos por grandeza', () => {
    const { buckets } = buildHourlyProfile([
      r('2026-11-12T15:00:00Z', 20, 50),
      r('2026-11-12T15:10:00Z', 30, null),
      r('2026-11-12T15:20:00Z', null, 70),
    ])
    const b = buckets[12]
    assert.deepEqual(b.temperature, { count: 2, avg: 25, min: 20, max: 30 })
    assert.deepEqual(b.humidity, { count: 2, avg: 60, min: 50, max: 70 })
    assert.equal(b.readingCount, 3)
  })

  it('zero real conta como medição', () => {
    const { buckets } = buildHourlyProfile([r('2026-11-12T15:00:00Z', 0)])
    assert.equal(buckets[12].temperature.count, 1)
    assert.equal(buckets[12].temperature.avg, 0)
  })

  it('destaca a faixa mais quente e a mais fria só com amostra mínima em 2 faixas', () => {
    const readings = []
    for (let i = 0; i < MIN_SAMPLES_PER_BUCKET; i += 1) {
      readings.push(r(`2026-11-12T15:0${i}:00Z`, 35))
      readings.push(r(`2026-11-12T09:0${i}:00Z`, 22))
    }
    const { highlight } = buildHourlyProfile(readings)
    assert.equal(highlight.hottest.label, '12h')
    assert.equal(highlight.coolest.label, '06h')
  })

  it('devolve amostra insuficiente com motivo (entrada vazia, uma faixa, poucas leituras)', () => {
    for (const input of [[], [r('2026-11-12T15:00:00Z', 30)]]) {
      const { highlight } = buildHourlyProfile(input)
      assert.equal(highlight.insufficient, true)
      assert.match(highlight.reason, /insuficientes/)
    }
    const few = [r('2026-11-12T15:00:00Z', 30), r('2026-11-12T16:00:00Z', 20)]
    assert.equal(buildHourlyProfile(few).highlight.insufficient, true)
  })

  it('não destaca quando as médias são iguais', () => {
    const readings = [12, 13].flatMap((h) => [0, 1, 2].map((m) => r(`2026-11-12T${h}:0${m}:00Z`, 28)))
    assert.equal(buildHourlyProfile(readings).highlight.insufficient, true)
  })
})

describe('buildWeekdayProfile', () => {
  it('devolve 7 faixas de segunda a domingo e usa o dia local', () => {
    // 2026-11-16 é segunda; 02:00Z ainda é domingo (15) em São Paulo
    const { buckets } = buildWeekdayProfile([r('2026-11-16T02:00:00Z', 24), r('2026-11-16T12:00:00Z', 30)])
    assert.deepEqual(
      buckets.map((b) => b.label),
      ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'],
    )
    assert.equal(buckets[0].temperature.avg, 30)
    assert.equal(buckets[6].temperature.avg, 24)
    assert.equal(buckets[6].key, 0)
    assert.equal(buckets[3].empty, true)
  })

  it('trata entrada vazia/nula sem exceção', () => {
    assert.equal(buildWeekdayProfile([]).highlight.insufficient, true)
    assert.equal(buildWeekdayProfile(null).buckets.length, 7)
  })
})
