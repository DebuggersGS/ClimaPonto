import { ENVIRONMENTAL_STATUS_LABELS, getReadingSourceInfo } from './readings.js'

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
 * @param {object[]} readings leituras normalizadas
 * @param {{ code: string, name: string }} stop
 * @returns {string|null} null quando não há leituras
 */
export function buildReadingsCsv(readings, stop) {
  if (!readings || readings.length === 0) return null
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
    ].join(','),
  )
  const headerLine = HEADER.join(',')
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
