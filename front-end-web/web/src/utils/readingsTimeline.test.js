import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildReadingsTimeline } from './readingsTimeline.js'

const MIN = 10 * 60000 // um intervalo de leitura (10 min)
const T0 = Date.parse('2026-11-12T12:00:00Z')
const r = (id, minutes, environmentalStatus = 'normal') => ({ id, measuredAtMs: T0 + minutes * MIN, environmentalStatus })

describe('buildReadingsTimeline', () => {
  it('entrada vazia não gera eventos', () => {
    assert.deepEqual(buildReadingsTimeline([]), { events: [], truncated: false })
    assert.deepEqual(buildReadingsTimeline(null), { events: [], truncated: false })
  })

  it('uma única leitura gera só o evento de primeira leitura', () => {
    const { events } = buildReadingsTimeline([r('a', 0)])
    assert.deepEqual(events.map((e) => [e.type, e.readingId]), [['first', 'a']])
  })

  it('ordena cronologicamente mesmo com entrada decrescente e marca primeira/última', () => {
    const { events } = buildReadingsTimeline([r('c', 2), r('b', 1), r('a', 0)])
    assert.deepEqual(events.map((e) => [e.type, e.readingId]), [['first', 'a'], ['last', 'c']])
  })

  it('registra mudança do estado gravado entre leituras consecutivas', () => {
    const { events } = buildReadingsTimeline([r('a', 0, 'normal'), r('b', 1, 'normal'), r('c', 2, 'critical')])
    const change = events.find((e) => e.type === 'status_change')
    assert.equal(change.readingId, 'c')
    assert.equal(change.previousReadingId, 'b')
    assert.equal(change.from, 'normal')
    assert.equal(change.to, 'critical')
    assert.match(change.text, /Normal.*Crítico/)
  })

  it('não cria evento quando o estado não muda', () => {
    const { events } = buildReadingsTimeline([r('a', 0, 'attention'), r('b', 1, 'attention')])
    assert.equal(events.some((e) => e.type === 'status_change'), false)
  })

  it('registra lacuna acima do limiar offline (5 x intervalo) citando regra provisória', () => {
    const { events } = buildReadingsTimeline([r('a', 0), r('b', 6)])
    const gap = events.find((e) => e.type === 'gap')
    assert.equal(gap.gapMs, 6 * MIN)
    assert.equal(gap.readingId, 'b')
    assert.match(gap.text, /provisória/)
  })

  it('lacuna exatamente no limiar não é evento; o intervalo configurável é respeitado', () => {
    assert.equal(buildReadingsTimeline([r('a', 0), r('b', 5)]).events.some((e) => e.type === 'gap'), false)
    const custom = buildReadingsTimeline([r('a', 0), r('b', 1)], { sendIntervalMs: 10000 })
    assert.equal(custom.events.some((e) => e.type === 'gap'), true)
  })

  it('todo evento referencia uma leitura existente', () => {
    const input = [r('a', 0, 'normal'), r('b', 10, 'attention'), r('c', 11, 'normal')]
    const ids = new Set(input.map((x) => x.id))
    for (const e of buildReadingsTimeline(input).events) assert.ok(ids.has(e.readingId))
  })

  it('trunca no limite mantendo primeiro, último e os eventos mais recentes', () => {
    const input = Array.from({ length: 20 }, (_, i) => r(`r${i}`, i, i % 2 ? 'attention' : 'normal'))
    const { events, truncated } = buildReadingsTimeline(input, { limit: 5 })
    assert.equal(truncated, true)
    assert.equal(events.length, 5)
    assert.equal(events[0].type, 'first')
    assert.equal(events.at(-1).type, 'last')
    assert.deepEqual(events.slice(1, 4).map((e) => e.readingId), ['r17', 'r18', 'r19'])
  })

  it('não marca truncamento quando cabe no limite', () => {
    assert.equal(buildReadingsTimeline([r('a', 0), r('b', 1)], { limit: 2 }).truncated, false)
  })
})
