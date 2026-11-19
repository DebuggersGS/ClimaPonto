import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ALL_ORIGINS, buildOriginOptions, filterByOrigin, parseOriginId, summarizeByDay } from './historyExploration.js'

const r = (iso, source, t, h) => ({ id: iso + source, measuredAtMs: Date.parse(iso), source, temperatureC: t, humidityPct: h })

describe('parseOriginId', () => {
  it('aceita origens válidas e cai em todas', () => {
    assert.equal(parseOriginId('sensor'), 'sensor')
    for (const v of ['x', '', null, undefined, '__proto__']) assert.equal(parseOriginId(v), ALL_ORIGINS)
  })
})

describe('opções e filtro', () => {
  const list = [r('2026-11-12T10:00:00Z', 'simulation', 1, 1), r('2026-11-12T11:00:00Z', 'sensor', 2, 2)]
  it('deriva opções das origens presentes', () => {
    assert.deepEqual(buildOriginOptions(list).map((o) => o.value), ['todas', 'sensor', 'simulation'])
  })
  it('filtra por origem', () => {
    assert.equal(filterByOrigin(list, 'sensor').length, 1)
    assert.equal(filterByOrigin(list, 'todas').length, 2)
    assert.equal(filterByOrigin(list, 'test').length, 0)
  })
})

describe('summarizeByDay', () => {
  it('separa dias no fuso de São Paulo (virada às 03:00 UTC)', () => {
    const days = summarizeByDay([
      r('2026-11-12T02:59:00Z', 'sensor', 20, 50),
      r('2026-11-12T03:00:00Z', 'sensor', 30, null),
      r('2026-11-12T04:00:00Z', 'sensor', 34, null),
    ])
    assert.deepEqual(days.map((d) => d.day), ['2026-11-12', '2026-11-11'])
    assert.equal(days[0].count, 2)
    assert.equal(days[0].temperatureC.avg, 32)
    assert.equal(days[0].humidityPct.count, 0)
    assert.equal(days[0].humidityPct.avg, null)
    assert.equal(days[1].humidityPct.max, 50)
  })
  it('não cria dias sem leitura', () => {
    assert.equal(summarizeByDay([]).length, 0)
  })
})
