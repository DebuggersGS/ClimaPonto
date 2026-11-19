import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { compareStops } from './stopComparison.js'

let seq = 0
const r = (stopId, ms, over = {}) => ({ id: `r${seq++}`, stopId, measuredAtMs: ms, temperatureC: 20, humidityPct: 50, source: 'sensor', ...over })
const set = (stopId, items) => ({ stopId, readings: items })

describe('compareStops', () => {
  it('rejeita o mesmo ponto', () => {
    const a = set('a', [r('a', 1)])
    assert.equal(compareStops(a, a).reason, 'same-stop')
    assert.equal(compareStops(a, null).reason, 'same-stop')
  })

  it('sem origem comum não é comparável', () => {
    const res = compareStops(set('a', [r('a', 1)]), set('b', [r('b', 1, { source: 'simulation' })]))
    assert.equal(res.status, 'not-comparable')
    assert.equal(res.reason, 'no-common-source')
  })

  it('descarta test e unknown', () => {
    for (const source of ['test', 'unknown']) {
      const res = compareStops(set('a', [r('a', 1, { source })]), set('b', [r('b', 1, { source })]))
      assert.equal(res.reason, 'no-common-source')
    }
  })

  it('prefere sensor e nunca mistura origens', () => {
    const a = set('a', [r('a', 1, { temperatureC: 10 }), r('a', 2, { source: 'simulation', temperatureC: 99 })])
    const b = set('b', [r('b', 1, { temperatureC: 20 }), r('b', 2, { source: 'simulation', temperatureC: 99 })])
    const res = compareStops(a, b)
    assert.equal(res.source, 'sensor')
    assert.equal(res.isSimulation, false)
    assert.equal(res.fields.temperatureC.a.n, 1)
    assert.equal(res.fields.temperatureC.averageDifference, -10)
  })

  it('usa simulação quando é a única origem comum e sinaliza', () => {
    const res = compareStops(set('a', [r('a', 1, { source: 'simulation' })]), set('b', [r('b', 1, { source: 'simulation' })]))
    assert.equal(res.source, 'simulation')
    assert.equal(res.isSimulation, true)
  })

  it('sem sobreposição de tempo não é comparável', () => {
    const res = compareStops(set('a', [r('a', 1), r('a', 2)]), set('b', [r('b', 5), r('b', 6)]))
    assert.equal(res.reason, 'no-overlap')
  })

  it('corta no trecho sobreposto e calcula n/min/média/máx', () => {
    const a = set('a', [r('a', 1, { temperatureC: 100 }), r('a', 5, { temperatureC: 20 }), r('a', 7, { temperatureC: 30 }), r('a', 20, { temperatureC: 100 })])
    const b = set('b', [r('b', 4, { temperatureC: 10 }), r('b', 8, { temperatureC: 14 })])
    const res = compareStops(a, b)
    assert.equal(res.from, 4)
    assert.equal(res.to, 8)
    assert.deepEqual(res.fields.temperatureC.a, { n: 2, min: 20, average: 25, max: 30 })
    assert.deepEqual(res.fields.temperatureC.b, { n: 2, min: 10, average: 12, max: 14 })
    assert.equal(res.fields.temperatureC.averageDifference, 13)
  })

  it('ignora valores nulos e deixa a diferença nula sem dados de um lado', () => {
    const a = set('a', [r('a', 1, { humidityPct: null })])
    const b = set('b', [r('b', 1, { humidityPct: 60 })])
    const res = compareStops(a, b)
    assert.equal(res.fields.humidityPct.a.n, 0)
    assert.equal(res.fields.humidityPct.averageDifference, null)
    assert.equal(res.fields.temperatureC.a.n, 1)
  })

  it('sem nenhum valor é no-readings; listas vazias, no-common-source', () => {
    const nulls = { temperatureC: null, humidityPct: null }
    assert.equal(compareStops(set('a', [r('a', 1, nulls)]), set('b', [r('b', 1, nulls)])).reason, 'no-readings')
    assert.equal(compareStops(set('a', []), set('b', [])).reason, 'no-common-source')
  })
})
