import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getConnectivity, getOfflineThresholdMs } from './connectivity.js'

const NOW = Date.parse('2026-11-12T15:30:00Z')
const ago = (ms) => new Date(NOW - ms).toISOString()

describe('getConnectivity', () => {
  it('respeita os limites exatos com o intervalo de 10 min', () => {
    assert.equal(getConnectivity(ago(1200000), NOW).status, 'online')
    assert.equal(getConnectivity(ago(1200001), NOW).status, 'delayed')
    assert.equal(getConnectivity(ago(3000000), NOW).status, 'delayed')
    assert.equal(getConnectivity(ago(3000001), NOW).status, 'offline')
  })

  it('aceita intervalo sobrescrito', () => {
    assert.equal(getConnectivity(ago(60001), NOW, { sendIntervalMs: 30000 }).status, 'delayed')
  })

  it('devolve no_data para null, undefined e string inválida', () => {
    for (const v of [null, undefined, 'abc']) {
      assert.deepEqual(getConnectivity(v, NOW), { status: 'no_data', ageMs: null })
    }
  })

  it('trata futuro dentro da tolerância como online com idade 0', () => {
    assert.deepEqual(getConnectivity(ago(-4 * 60000), NOW), { status: 'online', ageMs: 0 })
  })

  it('trata futuro além da tolerância como indeterminado', () => {
    const r = getConnectivity(ago(-6 * 60000), NOW)
    assert.equal(r.status, 'unknown')
    assert.equal(r.ageMs, -6 * 60000)
  })

  it('aceita Date e número como now', () => {
    assert.equal(getConnectivity(ago(1000), new Date(NOW)).ageMs, 1000)
    assert.equal(getConnectivity(ago(1000), NOW).ageMs, 1000)
  })
})

describe('getOfflineThresholdMs', () => {
  it('usa o intervalo padrão', () => {
    assert.equal(getOfflineThresholdMs(), 3000000)
  })
})
