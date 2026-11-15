import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computeReadingQuality } from './readingQuality.js'

const MIN = 60000
const START = Date.parse('2026-11-12T12:00:00Z')
const END = START + 10 * MIN
const r = (minutes) => ({ id: String(minutes), measuredAtMs: START + minutes * MIN })

describe('computeReadingQuality', () => {
  it('calcula válidas, esperado e completude com intervalo provisório de 60 s', () => {
    const q = computeReadingQuality([r(0), r(1), r(2), r(3), r(4)], { start: START, end: END, discarded: 2 })
    assert.equal(q.valid, 5)
    assert.equal(q.discarded, 2)
    assert.equal(q.expected, 10)
    assert.equal(q.completenessPct, 50)
    assert.equal(q.exceedsExpected, false)
    assert.equal(q.provisional, true)
    assert.match(q.ruleText, /provisória/)
  })

  it('aceita ISO e Date em start/end', () => {
    const q = computeReadingQuality([r(0)], { start: new Date(START), end: new Date(END).toISOString() })
    assert.equal(q.expected, 10)
  })

  it('descartadas só aparecem quando informadas', () => {
    assert.equal(computeReadingQuality([r(0)], { start: START, end: END }).discarded, null)
    assert.equal(computeReadingQuality([r(0)], { start: START, end: END, discarded: 0 }).discarded, 0)
    assert.equal(computeReadingQuality([r(0)], { discarded: -1 }).discarded, null)
  })

  it('deduplica instantes iguais', () => {
    const q = computeReadingQuality([r(0), r(0), r(1)], { start: START, end: END })
    assert.equal(q.valid, 2)
  })

  it('limita a completude a 100% e sinaliza excesso', () => {
    const many = Array.from({ length: 11 }, (_, i) => ({ id: `x${i}`, measuredAtMs: START + i * 1000 }))
    const q = computeReadingQuality(many, { start: START, end: END })
    assert.equal(q.completenessPct, 100)
    assert.equal(q.exceedsExpected, true)
  })

  it('maior lacuna e lacunas acima do limiar offline (5 intervalos)', () => {
    const q = computeReadingQuality([r(0), r(1), r(8), r(9)], { start: START, end: END })
    assert.equal(q.largestGapMs, 7 * MIN)
    assert.equal(q.gapsAboveOffline, 1)
    const edge = computeReadingQuality([r(0), r(5)], { start: START, end: END })
    assert.equal(edge.gapsAboveOffline, 0)
  })

  it('ignora leituras fora do período informado', () => {
    const q = computeReadingQuality([r(-5), r(1), r(20)], { start: START, end: END })
    assert.equal(q.valid, 1)
  })

  it('sem período válido, completude não calculável (null), nunca zero', () => {
    for (const opts of [{}, { start: END, end: START }, { start: 'x', end: END }]) {
      const q = computeReadingQuality([r(0), r(1)], opts)
      assert.equal(q.expected, null)
      assert.equal(q.completenessPct, null)
      assert.equal(q.valid, 2)
    }
  })

  it('período menor que o intervalo: esperado 0 => completude null (sem divisão por zero)', () => {
    const q = computeReadingQuality([r(0)], { start: START, end: START + 1000 })
    assert.equal(q.expected, 0)
    assert.equal(q.completenessPct, null)
  })

  it('entrada vazia ou nula', () => {
    for (const input of [[], null]) {
      const q = computeReadingQuality(input, { start: START, end: END })
      assert.equal(q.valid, 0)
      assert.equal(q.completenessPct, 0)
      assert.equal(q.largestGapMs, null)
      assert.equal(q.gapsAboveOffline, 0)
    }
  })

  it('respeita sendIntervalMs configurável', () => {
    const q = computeReadingQuality([r(0)], { start: START, end: END, sendIntervalMs: 5 * MIN })
    assert.equal(q.expected, 2)
    assert.equal(q.completenessPct, 50)
  })
})
