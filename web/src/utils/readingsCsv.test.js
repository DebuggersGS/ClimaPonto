import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildCsvFilename, buildReadingsCsv, escapeCsvCell } from './readingsCsv.js'

const stop = { code: 'PT-01', name: 'Ponto, "Central"' }
const reading = (over = {}) => ({
  id: '1',
  measuredAt: '2026-11-12T02:30:00Z',
  measuredAtMs: Date.parse('2026-11-12T02:30:00Z'),
  temperatureC: 31.5,
  humidityPct: null,
  environmentalStatus: 'attention',
  source: 'simulation',
  ...over,
})

describe('buildReadingsCsv', () => {
  it('gera cabeçalho, UTC e horário local de São Paulo', () => {
    const lines = buildReadingsCsv([reading()], stop).split('\r\n')
    assert.equal(
      lines[0],
      'ponto_codigo,ponto_nome,medido_em_utc,medido_em_local_america_sao_paulo,temperatura_c,umidade_pct,estado_ambiental,origem',
    )
    assert.equal(lines[1], 'PT-01,"Ponto, ""Central""",2026-11-12T02:30:00.000Z,2026-11-11 23:30:00,31.5,,Atenção,Simulação')
  })

  it('deixa ausentes vazios e mantém zero real', () => {
    const csv = buildReadingsCsv([reading({ temperatureC: 0, humidityPct: null })], stop)
    assert.match(csv.split('\r\n')[1], /,0,,/)
  })

  it('mantém temperatura negativa sem apóstrofo', () => {
    assert.match(buildReadingsCsv([reading({ temperatureC: -2.5 })], stop), /,-2\.5,/)
  })

  it('neutraliza fórmula em nome e código do ponto', () => {
    const csv = buildReadingsCsv([reading()], { code: '=CMD()', name: '@x' })
    assert.ok(csv.split('\r\n')[1].startsWith("'=CMD(),'@x,"))
  })

  it('devolve null para lista vazia', () => {
    assert.equal(buildReadingsCsv([], stop), null)
  })
})

describe('escapeCsvCell', () => {
  it('neutraliza = + - @ tab e CR e escapa aspas e quebras', () => {
    for (const c of ['=1', '+1', '-1', '@a', '\ta', '\ra']) assert.ok(escapeCsvCell(c).replace(/^"/, '').startsWith("'"))
    assert.equal(escapeCsvCell('a"b'), '"a""b"')
    assert.equal(escapeCsvCell('a\nb'), '"a\nb"')
    assert.equal(escapeCsvCell(null), '')
  })
})

describe('buildCsvFilename', () => {
  it('é determinístico e seguro', () => {
    assert.equal(buildCsvFilename('PT-01', '7d', 'sensor'), 'climaponto-pt-01-7d-sensor.csv')
    assert.equal(buildCsvFilename('../x', '24h'), 'climaponto-x-24h-todas.csv')
  })
})
