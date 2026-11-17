import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCsvFilename,
  buildReadingsCsv,
  buildSummaryReportCsv,
  buildSummaryReportFilename,
  escapeCsvCell,
} from './readingsCsv.js'

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

  it('acrescenta a coluna periodo só quando o período é informado', () => {
    const lines = buildReadingsCsv([reading()], stop, { periodId: '7d' }).split('\r\n')
    assert.ok(lines[0].endsWith(',origem,periodo'))
    assert.ok(lines[1].endsWith(',Atenção,Simulação,7d'))
    assert.ok(!buildReadingsCsv([reading()], stop, {}).split('\r\n')[0].includes('periodo'))
  })

  it('neutraliza fórmula também na coluna periodo', () => {
    const lines = buildReadingsCsv([reading()], stop, { periodId: '=1+1' }).split('\r\n')
    assert.ok(lines[1].endsWith(",'=1+1"))
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

describe('buildSummaryReportCsv', () => {
  const at = (iso, over = {}) => reading({ id: iso, measuredAt: iso, measuredAtMs: Date.parse(iso), ...over })

  it('retorna null sem leituras', () => {
    assert.equal(buildSummaryReportCsv([], { stopCode: 'PT-01', period: '24h' }), null)
    assert.equal(buildSummaryReportCsv(null, { stopCode: 'PT-01', period: '24h' }), null)
  })

  it('gera contexto, bloco por dia (virada de dia em SP) e bloco por hora', () => {
    const csv = buildSummaryReportCsv(
      [
        at('2026-11-12T02:30:00Z', { temperatureC: 20, humidityPct: 60 }), // 11/11 23:30 em SP
        at('2026-11-12T02:40:00Z', { temperatureC: 30, humidityPct: null }),
        at('2026-11-12T15:00:00Z', { temperatureC: 0, humidityPct: null }), // 12/11 12:00 em SP
      ],
      { stopCode: 'PT-01', period: '7d' },
    )
    const lines = csv.split('\r\n')
    assert.equal(lines[0], 'ponto_codigo,PT-01')
    assert.equal(lines[1], 'periodo,7d')
    assert.equal(lines[2], 'fuso_horario,America/Sao_Paulo')
    assert.equal(lines[3], 'leituras_no_relatorio,3')
    assert.equal(lines[4], 'origens_incluidas,Simulação')
    assert.match(lines[6], /^dia,leituras,temperatura_media_\(°C\).*umidade_max_\(%\)$/)
    assert.equal(lines[7], '2026-11-11,2,25,20,30,60,60,60')
    assert.equal(lines[8], '2026-11-12,1,0,0,0,,,')
    assert.match(lines[10], /^hora_do_dia,leituras,/)
    assert.equal(lines[11], '12h,1,0,0,0,,,')
    assert.equal(lines[12], '23h,2,25,20,30,60,60,60')
    assert.equal(lines.at(-1), '')
  })

  it('neutraliza fórmula e aplica escape no código do ponto', () => {
    const csv = buildSummaryReportCsv([reading()], { stopCode: '=CMD,1', period: '24h' })
    assert.equal(csv.split('\r\n')[0], 'ponto_codigo,"\'=CMD,1"')
  })
})

describe('buildSummaryReportFilename', () => {
  it('é determinístico e seguro', () => {
    assert.equal(buildSummaryReportFilename('PT-01', '7d'), 'climaponto-resumo-pt-01-7d.csv')
    assert.equal(buildSummaryReportFilename('../x y', ''), 'climaponto-resumo-x-y-x.csv')
  })
})
