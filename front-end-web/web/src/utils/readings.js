import { getConnectivity } from './connectivity.js'

export const ENVIRONMENTAL_STATUS_LABELS = {
  normal: 'Normal',
  attention: 'Atenção',
  critical: 'Crítico',
  unclassified: 'Não classificado',
}

/**
 * Normaliza o estado ambiental GRAVADO no banco. Nunca deriva o estado de
 * temperatura/umidade: null ou valor desconhecido vira "unclassified".
 * @param {unknown} value
 * @returns {'normal'|'attention'|'critical'|'unclassified'}
 */
export function normalizeEnvironmentalStatus(value) {
  return value === 'normal' || value === 'attention' || value === 'critical' ? value : 'unclassified'
}

export const READING_SOURCES = {
  sensor: { label: 'Sensor', isRealMeasurement: true, note: null },
  simulation: { label: 'Simulação', isRealMeasurement: false, note: 'Simulação — não é medição real' },
  test: { label: 'Teste', isRealMeasurement: false, note: 'Teste — visível só para administradores' },
}

/**
 * @param {unknown} source valor de readings.source
 * @returns {{ key: string, label: string, isRealMeasurement: boolean, note: string|null }}
 */
export function getReadingSourceInfo(source) {
  if (typeof source === 'string' && Object.hasOwn(READING_SOURCES, source)) {
    return { key: source, ...READING_SOURCES[source] }
  }
  return {
    key: 'unknown',
    label: 'Origem desconhecida',
    isRealMeasurement: false,
    note: 'Origem não informada — não tratar como medição real',
  }
}

/** Faixas de plausibilidade do contrato de dados; NÃO são limites ambientais. */
export const PLAUSIBLE_RANGES = {
  temperatureC: { min: -40, max: 80 },
  humidityPct: { min: 0, max: 100 },
}

/**
 * Converte número ou string numérica em medição válida.
 * @param {unknown} value
 * @param {{ min: number, max: number }} range
 * @returns {number|null} número finito dentro da faixa, ou null
 */
export function toMeasurement(value, range) {
  let number = null
  if (typeof value === 'number') number = value
  else if (typeof value === 'string' && value.trim() !== '') number = Number(value)
  if (number === null || !Number.isFinite(number)) return null
  return number >= range.min && number <= range.max ? number : null
}

/**
 * Converte uma linha do banco (readings ou stop_latest_readings) para o modelo do front.
 * @param {object|null|undefined} row
 * @returns {object|null} null se id, stop_id ou measured_at estiverem ausentes/inválidos
 */
export function normalizeReading(row) {
  if (!row) return null
  const id = row.id ?? row.reading_id
  const stopId = row.stop_id
  const measuredAt = row.measured_at
  if (!id || !stopId || typeof measuredAt !== 'string') return null
  const measuredAtMs = Date.parse(measuredAt)
  if (Number.isNaN(measuredAtMs)) return null
  return {
    id,
    stopId,
    temperatureC: toMeasurement(row.temperature_c, PLAUSIBLE_RANGES.temperatureC),
    humidityPct: toMeasurement(row.humidity_pct, PLAUSIBLE_RANGES.humidityPct),
    environmentalStatus: normalizeEnvironmentalStatus(row.environmental_status),
    source: getReadingSourceInfo(row.source).key,
    measuredAt,
    measuredAtMs,
    receivedAt: typeof row.received_at === 'string' ? row.received_at : null,
  }
}

/**
 * Normaliza uma lista, descartando linhas inválidas e duplicatas (mesmo id; vale a primeira).
 * @param {Array<object>|null|undefined} rows
 * @returns {{ readings: object[], discardedCount: number }}
 */
export function normalizeReadings(rows) {
  const readings = []
  const seen = new Set()
  let discardedCount = 0
  for (const row of rows ?? []) {
    const reading = normalizeReading(row)
    if (!reading || seen.has(reading.id)) {
      discardedCount += 1
      continue
    }
    seen.add(reading.id)
    readings.push(reading)
  }
  return { readings, discardedCount }
}

function compareById(a, b) {
  if (a.id < b.id) return -1
  return a.id > b.id ? 1 : 0
}

/** Mais recentes primeiro; empate desempatado por id. Não muta a entrada. */
export function sortReadingsDesc(readings) {
  return [...readings].sort((a, b) => b.measuredAtMs - a.measuredAtMs || compareById(a, b))
}

/** Mais antigas primeiro; empate desempatado por id. Não muta a entrada. */
export function sortReadingsAsc(readings) {
  return [...readings].sort((a, b) => a.measuredAtMs - b.measuredAtMs || compareById(a, b))
}

/** Mínimo de amostras válidas para exibir tendência. */
export const MIN_TREND_READINGS = 3

/**
 * Resume uma série usando somente valores não nulos (ausente nunca vira zero).
 * A variação da tendência é arredondada a 1 casa decimal para evitar ruído de
 * ponto flutuante (25.3 - 24.1 => 1.2).
 * @param {object[]} readings
 * @param {'temperatureC'|'humidityPct'} field
 */
export function summarizeSeries(readings, field) {
  const valid = sortReadingsAsc(readings).filter((reading) => reading[field] !== null && reading[field] !== undefined)
  const values = valid.map((reading) => reading[field])
  const count = values.length
  const summary = {
    count,
    min: count ? Math.min(...values) : null,
    max: count ? Math.max(...values) : null,
    average: count ? values.reduce((sum, v) => sum + v, 0) / count : null,
    trend: { status: 'insufficient' },
  }
  if (count >= MIN_TREND_READINGS) {
    const first = values[0]
    const last = values[count - 1]
    summary.trend = { status: 'available', first, last, variation: Math.round((last - first) * 10) / 10 }
  }
  return summary
}

/**
 * Associa a leitura mais recente a cada ponto, na ordem dos pontos.
 * Leituras de pontos fora da lista são ignoradas.
 * @returns {Array<{ stop: object, reading: object|null }>}
 */
export function attachLatestReadings(stops, latestReadings) {
  const byStop = new Map()
  for (const reading of latestReadings ?? []) {
    const current = byStop.get(reading.stopId)
    if (!current || reading.measuredAtMs > current.measuredAtMs) byStop.set(reading.stopId, reading)
  }
  return stops.map((stop) => ({ stop, reading: byStop.get(stop.id) ?? null }))
}

/**
 * Visão consolidada do Dashboard. Estado ambiental e conectividade são
 * dimensões separadas; ponto sem leitura conta como no_data, nunca como não classificado.
 * @param {object[]} stops
 * @param {object[]} latestReadings leituras já normalizadas
 * @param {Date|number} now instante atual (sempre parâmetro)
 * @param {{ sendIntervalMs?: number }} [options]
 */
export function summarizeDashboard(stops, latestReadings, now, { sendIntervalMs } = {}) {
  const attached = attachLatestReadings(stops, latestReadings)
  const environmentalCounts = { normal: 0, attention: 0, critical: 0, unclassified: 0 }
  const connectivityCounts = { online: 0, delayed: 0, offline: 0, no_data: 0, unknown: 0 }
  let latest = null
  let withReadingsCount = 0

  const items = attached.map(({ stop, reading }) => {
    const connectivity = getConnectivity(reading?.measuredAt ?? null, now, { sendIntervalMs })
    connectivityCounts[connectivity.status] += 1
    if (reading) {
      withReadingsCount += 1
      environmentalCounts[reading.environmentalStatus] += 1
      if (!latest || reading.measuredAtMs > latest.reading.measuredAtMs) latest = { stop, reading }
    }
    return { stop, reading, connectivity }
  })

  return {
    monitoredCount: stops.length,
    withReadingsCount,
    noDataCount: stops.length - withReadingsCount,
    demoCount: stops.filter((stop) => stop.isDemo).length,
    latest,
    environmentalCounts,
    connectivityCounts,
    items,
  }
}
