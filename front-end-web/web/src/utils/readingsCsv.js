import { summarizeByDay } from './historyExploration.js'
import { ENVIRONMENTAL_STATUS_LABELS, getReadingSourceInfo } from './readings.js'
import { buildHourlyProfile } from './temporalProfiles.js'

const TIME_ZONE = 'America/Sao_Paulo'
const HEADER = [
  'ponto_codigo',
  'ponto_nome',
  'medido_em_utc',
  'medido_em_local_america_sao_paulo',
  'temperatura_c',
  'umidade_pct',
  'estado_ambiental',
  'origem',
]

const localFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

/** Horário local de São Paulo como "AAAA-MM-DD HH:mm:ss". */
function formatLocal(ms) {
  const p = Object.fromEntries(localFormatter.formatToParts(new Date(ms)).map((part) => [part.type, part.value]))
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`
}

/**
 * Neutraliza injeção de fórmula (planilhas) e aplica o escape RFC 4180.
 * Textos vindos do banco começando por = + - @ tab ou CR ganham apóstrofo.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeCsvCell(value) {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/** Número ausente fica vazio (nunca zero); número válido não passa pela neutralização de "-". */
function numberCell(value) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
}

/**
 * Gera o CSV das leituras exibidas.
 * @param {object[]} readings leituras normalizadas (as mesmas do gráfico e da tabela)
 * @param {{ code: string, name: string }} stop
 * @param {{ periodId?: string }} [options] com `periodId`, acrescenta a coluna final `periodo`
 *   (a origem já é coluna fixa); sem ele o formato original é mantido
 * @returns {string|null} null quando não há leituras
 */
export function buildReadingsCsv(readings, stop, { periodId } = {}) {
  if (!readings || readings.length === 0) return null
  const withPeriod = typeof periodId === 'string' && periodId !== ''
  const rows = readings.map((reading) =>
    [
      escapeCsvCell(stop.code),
      escapeCsvCell(stop.name),
      new Date(reading.measuredAtMs).toISOString(),
      formatLocal(reading.measuredAtMs),
      numberCell(reading.temperatureC),
      numberCell(reading.humidityPct),
      escapeCsvCell(ENVIRONMENTAL_STATUS_LABELS[reading.environmentalStatus] ?? ENVIRONMENTAL_STATUS_LABELS.unclassified),
      escapeCsvCell(getReadingSourceInfo(reading.source).label),
      ...(withPeriod ? [escapeCsvCell(periodId)] : []),
    ].join(','),
  )
  const headerLine = (withPeriod ? [...HEADER, 'periodo'] : HEADER).join(',')
  return [headerLine, ...rows].join('\r\n') + '\r\n'
}

/**
 * Nome de arquivo determinístico, só com caracteres seguros.
 * @param {string} stopCode
 * @param {string} periodId
 * @param {string} [originId] 'todas' ou origem filtrada
 */
export function buildCsvFilename(stopCode, periodId, originId = 'todas') {
  const safe = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x'
  return `climaponto-${safe(stopCode)}-${safe(periodId)}-${safe(originId)}.csv`
}

const SUMMARY_COLUMNS = [
  'leituras',
  'temperatura_media_(°C)',
  'temperatura_min_(°C)',
  'temperatura_max_(°C)',
  'umidade_media_(%)',
  'umidade_min_(%)',
  'umidade_max_(%)',
]

/** Média/mín/máx arredondados a 2 casas para o CSV; ausente fica vazio. */
function roundedCell(value) {
  return typeof value === 'number' && Number.isFinite(value) ? String(Number(value.toFixed(2))) : ''
}

function summaryRow(label, count, temperature, humidity) {
  return [
    escapeCsvCell(label),
    String(count),
    ...[temperature, humidity].flatMap((s) => [s.avg, s.min, s.max].map(roundedCell)),
  ].join(',')
}

/**
 * Relatório resumido em CSV: cabeçalho de contexto, bloco por dia e bloco por
 * hora (America/Sao_Paulo). Só estatística descritiva das leituras recebidas.
 * @param {object[]} readings leituras normalizadas já filtradas
 * @param {{ stopCode: string, period: string }} meta
 * @returns {string|null} null quando não há leituras
 */
export function buildSummaryReportCsv(readings, { stopCode, period }) {
  if (!readings || readings.length === 0) return null
  const origins = [...new Set(readings.map((r) => getReadingSourceInfo(r.source).label))].sort()
  const days = [...summarizeByDay(readings)].reverse()
  const hours = buildHourlyProfile(readings).buckets.filter((b) => !b.empty)

  const lines = [
    `ponto_codigo,${escapeCsvCell(stopCode)}`,
    `periodo,${escapeCsvCell(period)}`,
    `fuso_horario,${TIME_ZONE}`,
    `leituras_no_relatorio,${readings.length}`,
    `origens_incluidas,${escapeCsvCell(origins.join('; '))}`,
    '',
    ['dia', ...SUMMARY_COLUMNS].join(','),
    ...days.map((d) => summaryRow(d.day, d.count, d.temperatureC, d.humidityPct)),
    '',
    ['hora_do_dia', ...SUMMARY_COLUMNS].join(','),
    ...hours.map((b) => summaryRow(b.label, b.readingCount, b.temperature, b.humidity)),
  ]
  return lines.join('\r\n') + '\r\n'
}

/**
 * Nome de arquivo determinístico do relatório resumido, só com caracteres seguros.
 * @param {string} stopCode
 * @param {string} period id do período
 */
export function buildSummaryReportFilename(stopCode, period) {
  const safe = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x'
  return `climaponto-resumo-${safe(stopCode)}-${safe(period)}.csv`
}
