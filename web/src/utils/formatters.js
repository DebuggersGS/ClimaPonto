import { CLOCK_TOLERANCE_MS } from './connectivity.js'

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

/** Formata um timestamp UTC (ISO 8601) no horário de Brasília. */
export function formatDateTime(isoString) {
  if (!isoString) return '—'
  const date = new Date(isoString)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

const TIME_ZONE = 'America/Sao_Paulo'

const dateTimeZoneFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'shortOffset',
  timeZone: TIME_ZONE,
})

const timeZoneFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'shortOffset',
  timeZone: TIME_ZONE,
})

const oneDecimalFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function toValidDate(value) {
  if (value === null || value === undefined || value === '') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

// O Intl pode usar espaços não separáveis (U+00A0/U+202F); normaliza para espaço comum.
function normalizeSpaces(text) {
  return text.replace(/[\u00A0\u202F]/g, ' ')
}

/** Data e hora com fuso, ex.: '12/11/2026, 12:30 GMT-3'. */
export function formatDateTimeWithZone(value) {
  const date = toValidDate(value)
  return date ? normalizeSpaces(dateTimeZoneFormatter.format(date)) : '—'
}

/** Hora com fuso, ex.: '12:30 GMT-3'. */
export function formatTimeWithZone(value) {
  const date = toValidDate(value)
  return date ? normalizeSpaces(timeZoneFormatter.format(date)) : '—'
}

/**
 * Idade relativa da leitura em português.
 * @param {string|Date|null} measuredAt
 * @param {Date|number} now instante atual
 */
export function formatRelativeAge(measuredAt, now) {
  const date = toValidDate(measuredAt)
  if (!date) return '—'
  const age = Number(now instanceof Date ? now.getTime() : now) - date.getTime()
  if (age < -CLOCK_TOLERANCE_MS) return 'horário à frente do relógio'
  if (age < 60000) return 'agora há pouco'
  const minutes = Math.floor(age / 60000)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'há 1 dia' : `há ${days} dias`
}

// Espaço não separável (U+00A0) entre número e unidade: impede que '21,0' e '°C'
// fiquem em linhas diferentes em telas estreitas (375 px).
export const UNIT_SEPARATOR = '\u00A0'

function formatOneDecimal(value, unit) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—'
  const text = normalizeSpaces(oneDecimalFormatter.format(Number(value)))
  // Evita '-0,0' quando o valor negativo arredonda para zero.
  const safe = text === '-0,0' ? '0,0' : text
  return `${safe}${UNIT_SEPARATOR}${unit}`
}

/** Temperatura com 1 casa e espaço não separável antes da unidade, ex.: '23,5\u00A0°C'. */
export function formatTemperature(value) {
  return formatOneDecimal(value, '°C')
}

/** Umidade com 1 casa e espaço não separável antes da unidade, ex.: '61,0\u00A0%'. */
export function formatHumidity(value) {
  return formatOneDecimal(value, '%')
}
