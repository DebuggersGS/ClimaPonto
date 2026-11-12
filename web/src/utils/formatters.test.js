import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatDateTime,
  formatDateTimeWithZone,
  formatHumidity,
  formatRelativeAge,
  formatTemperature,
  formatTimeWithZone,
} from './formatters.js'

const ISO = '2026-11-12T15:30:00Z'
const NOW = Date.parse(ISO)
const at = (offsetMs) => new Date(NOW + offsetMs).toISOString()

describe('formatDateTime (regressão)', () => {
  it('formata no horário de Brasília', () => {
    assert.equal(formatDateTime(ISO).replace(/[\u00A0\u202F]/g, ' '), '12/11/2026, 12:30')
  })
  it('devolve traço para entradas vazias ou inválidas', () => {
    for (const v of [null, '', 'abc']) assert.equal(formatDateTime(v), '—')
  })
})

describe('formatDateTimeWithZone e formatTimeWithZone', () => {
  it('formatam com fuso', () => {
    assert.equal(formatDateTimeWithZone(ISO), '12/11/2026, 12:30 GMT-3')
    assert.equal(formatTimeWithZone(ISO), '12:30 GMT-3')
    assert.equal(formatTimeWithZone(new Date(ISO)), '12:30 GMT-3')
  })
  it('devolvem traço para entrada inválida', () => {
    for (const v of [null, '', 'abc']) {
      assert.equal(formatDateTimeWithZone(v), '—')
      assert.equal(formatTimeWithZone(v), '—')
    }
  })
})

describe('formatRelativeAge', () => {
  it('formata idades passadas', () => {
    assert.equal(formatRelativeAge(at(-30000), NOW), 'agora há pouco')
    assert.equal(formatRelativeAge(at(-5 * 60000), NOW), 'há 5 min')
    assert.equal(formatRelativeAge(at(-2 * 3600000), NOW), 'há 2 h')
    assert.equal(formatRelativeAge(at(-86400000), NOW), 'há 1 dia')
    assert.equal(formatRelativeAge(at(-3 * 86400000), NOW), 'há 3 dias')
  })
  it('trata futuro conforme a tolerância', () => {
    assert.equal(formatRelativeAge(at(4 * 60000), NOW), 'agora há pouco')
    assert.equal(formatRelativeAge(at(6 * 60000), NOW), 'horário à frente do relógio')
  })
  it('devolve traço para entrada inválida', () => {
    assert.equal(formatRelativeAge('abc', NOW), '—')
    assert.equal(formatRelativeAge(null, NOW), '—')
  })
})

describe('formatTemperature e formatHumidity', () => {
  it('formatam com uma casa decimal', () => {
    assert.equal(formatTemperature(23.5), '23,5 °C')
    assert.equal(formatTemperature(-0.04), '0,0 °C')
    assert.equal(formatHumidity(61), '61,0 %')
  })
  it('devolvem traço para ausentes', () => {
    for (const v of [null, undefined, NaN]) {
      assert.equal(formatTemperature(v), '—')
      assert.equal(formatHumidity(v), '—')
    }
  })
})
