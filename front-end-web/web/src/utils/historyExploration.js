import { READING_SOURCES, getReadingSourceInfo } from './readings.js'

export const ALL_ORIGINS = 'todas'
const ORIGIN_ORDER = ['sensor', 'simulation', 'test', 'unknown']

/**
 * Lê o parâmetro `origem` da URL; valor inválido ou ausente vira "todas".
 * @param {unknown} value
 * @returns {string}
 */
export function parseOriginId(value) {
  return typeof value === 'string' && (Object.hasOwn(READING_SOURCES, value) || value === 'unknown') ? value : ALL_ORIGINS
}

/**
 * Opções do filtro: "Todas as origens" e as origens presentes nas leituras.
 * @param {object[]} readings
 * @returns {Array<{ value: string, label: string }>}
 */
export function buildOriginOptions(readings) {
  const present = new Set(readings.map((reading) => reading.source))
  const options = ORIGIN_ORDER.filter((key) => present.has(key)).map((key) => ({
    value: key,
    label: getReadingSourceInfo(key).label,
  }))
  return [{ value: ALL_ORIGINS, label: 'Todas as origens' }, ...options]
}

/** @returns {object[]} leituras da origem escolhida (todas, se "todas") */
export function filterByOrigin(readings, originId) {
  return originId === ALL_ORIGINS ? readings : readings.filter((reading) => reading.source === originId)
}

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Dia civil em São Paulo como "AAAA-MM-DD". */
export function getSaoPauloDay(ms) {
  return dayFormatter.format(new Date(ms))
}

function stats(values) {
  if (values.length === 0) return { count: 0, min: null, avg: null, max: null }
  const sum = values.reduce((total, value) => total + value, 0)
  return { count: values.length, min: Math.min(...values), avg: sum / values.length, max: Math.max(...values) }
}

/**
 * Resume por dia civil (America/Sao_Paulo), do mais recente ao mais antigo.
 * Ausentes são ignorados; dias sem leitura não são criados.
 * @param {object[]} readings
 * @returns {Array<{ day: string, count: number, temperatureC: object, humidityPct: object }>}
 */
export function summarizeByDay(readings) {
  const groups = new Map()
  for (const reading of readings) {
    const day = getSaoPauloDay(reading.measuredAtMs)
    if (!groups.has(day)) groups.set(day, [])
    groups.get(day).push(reading)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([day, items]) => ({
      day,
      count: items.length,
      temperatureC: stats(items.map((r) => r.temperatureC).filter((v) => v !== null && v !== undefined)),
      humidityPct: stats(items.map((r) => r.humidityPct).filter((v) => v !== null && v !== undefined)),
    }))
}
