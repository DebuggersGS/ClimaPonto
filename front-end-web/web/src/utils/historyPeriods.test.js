import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_PERIOD_ID,
  HISTORY_LIMIT,
  applyHistoryLimit,
  getPeriodStart,
  parsePeriodId,
} from './historyPeriods.js'

const NOW = new Date('2026-11-12T15:30:00Z')
const makeRows = (n) => Array.from({ length: n }, (_, i) => ({ id: i }))

describe('getPeriodStart', () => {
  it('calcula o início de cada período', () => {
    assert.equal(getPeriodStart('24h', NOW), '2026-11-11T15:30:00.000Z')
    assert.equal(getPeriodStart('7d', NOW), '2026-11-05T15:30:00.000Z')
    assert.equal(getPeriodStart('30d', NOW), '2026-10-13T15:30:00.000Z')
  })

  it('usa o período padrão para id inválido', () => {
    assert.equal(getPeriodStart('x', NOW), '2026-11-11T15:30:00.000Z')
  })
})

describe('parsePeriodId', () => {
  it('aceita id válido e cai no padrão nos demais casos', () => {
    assert.equal(parsePeriodId('7d'), '7d')
    for (const v of ['abc', undefined, null, '']) {
      assert.equal(parsePeriodId(v), DEFAULT_PERIOD_ID)
    }
  })
})

describe('applyHistoryLimit', () => {
  it('mantém o limite abaixo do máximo do PostgREST', () => {
    assert.ok(HISTORY_LIMIT < 1000)
  })

  it('não trunca com exatamente HISTORY_LIMIT linhas', () => {
    const r = applyHistoryLimit(makeRows(HISTORY_LIMIT))
    assert.equal(r.truncated, false)
    assert.equal(r.rows.length, HISTORY_LIMIT)
  })

  it('trunca com HISTORY_LIMIT + 1 e mantém as mais recentes', () => {
    const input = makeRows(HISTORY_LIMIT + 1)
    const r = applyHistoryLimit(input)
    assert.equal(r.truncated, true)
    assert.deepEqual(r.rows, input.slice(0, HISTORY_LIMIT))
  })

  it('aceita lista vazia', () => {
    assert.deepEqual(applyHistoryLimit([]), { rows: [], truncated: false })
  })

  it('não altera a entrada', () => {
    const input = makeRows(HISTORY_LIMIT + 1)
    applyHistoryLimit(input)
    assert.equal(input.length, HISTORY_LIMIT + 1)
  })
})
