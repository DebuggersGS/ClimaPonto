import { HISTORY_PERIODS, getPeriodStart, parsePeriodId } from './historyPeriods.js'

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS

/**
 * Tamanho do intervalo (bucket) de agregação por período, em ms. Fonte única:
 * 24h → 48 intervalos, 7d → 56, 30d → 60 (densidade legível em 375 px).
 */
export const CHART_BUCKET_MS = {
  '24h': 30 * MINUTE_MS,
  '7d': 3 * HOUR_MS,
  '30d': 12 * HOUR_MS,
}

/** Folga do domínio Y, como fração da amplitude real dos dados. */
export const DOMAIN_PADDING_RATIO = 0.1

/** Folga (em cada lado) quando todos os valores são iguais. */
export const CONSTANT_DOMAIN_PADDING = 1

const VALUE_FIELDS = ['temperature', 'humidity']

function toMs(value) {
  return value instanceof Date ? value.getTime() : value
}

function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function averageOf(sum, count) {
  return count > 0 ? sum / count : null
}

function createBucket(startMs, endMs) {
  return { startMs, endMs, tempSum: 0, tempCount: 0, humSum: 0, humCount: 0 }
}

function toPoint(bucket) {
  return {
    start: new Date(bucket.startMs).toISOString(),
    end: new Date(bucket.endMs).toISOString(),
    // Centro do intervalo: posição em que o ponto é desenhado no eixo X.
    t: bucket.startMs + (bucket.endMs - bucket.startMs) / 2,
    temperature: averageOf(bucket.tempSum, bucket.tempCount),
    humidity: averageOf(bucket.humSum, bucket.humCount),
    temperatureCount: bucket.tempCount,
    humidityCount: bucket.humCount,
  }
}

/**
 * Agrega leituras normalizadas em intervalos uniformes cobrindo todo o período
 * (de getPeriodStart até `now`). Cada intervalo é [início, fim); o último inclui
 * `now`, de modo que uma leitura exatamente em `now` não se perde, e uma leitura
 * na fronteira entre dois intervalos pertence ao posterior.
 *
 * Médias usam só valores válidos; sem amostra da grandeza → null (lacuna), nunca
 * zero nem interpolação. Leituras fora do período são ignoradas.
 *
 * @param {Array<{ measuredAtMs: number, temperatureC: number|null, humidityPct: number|null }>} readings
 * @param {string} periodId '24h' | '7d' | '30d' (desconhecido → padrão)
 * @param {Date|number} now instante atual (sempre parâmetro)
 * @returns {Array<{ start: string, end: string, t: number, temperature: number|null,
 *   humidity: number|null, temperatureCount: number, humidityCount: number }>}
 */
export function buildChartSeries(readings, periodId, now) {
  const id = parsePeriodId(periodId)
  const bucketMs = CHART_BUCKET_MS[id]
  const nowMs = toMs(now)
  const startMs = Date.parse(getPeriodStart(id, nowMs))
  const { durationMs } = HISTORY_PERIODS.find((period) => period.id === id)
  const count = Math.ceil(durationMs / bucketMs)

  const buckets = Array.from({ length: count }, (_, i) =>
    createBucket(startMs + i * bucketMs, Math.min(startMs + (i + 1) * bucketMs, nowMs)),
  )

  for (const reading of readings ?? []) {
    const at = reading?.measuredAtMs
    if (!isValidNumber(at) || at < startMs || at > nowMs) continue
    const index = Math.min(Math.floor((at - startMs) / bucketMs), count - 1)
    const bucket = buckets[index]
    if (isValidNumber(reading.temperatureC)) {
      bucket.tempSum += reading.temperatureC
      bucket.tempCount += 1
    }
    if (isValidNumber(reading.humidityPct)) {
      bucket.humSum += reading.humidityPct
      bucket.humCount += 1
    }
  }

  return buckets.map(toPoint)
}

/**
 * Domínio do eixo Y a partir dos valores reais (mín./máx.) com folga.
 * Valor constante recebe folga fixa; série sem dados devolve um domínio
 * genérico 0–1 com `hasData: false` (o chamador decide não desenhar a linha).
 * Nunca produz max === min, evitando divisão por zero na escala.
 *
 * @param {Array<object>} series saída de buildChartSeries
 * @param {'temperature'|'humidity'} field
 * @returns {{ min: number, max: number, dataMin: number|null, dataMax: number|null, hasData: boolean }}
 */
export function getValueDomain(series, field) {
  if (!VALUE_FIELDS.includes(field)) throw new RangeError(`Grandeza desconhecida: ${field}`)
  const values = (series ?? []).map((point) => point[field]).filter(isValidNumber)
  if (values.length === 0) return { min: 0, max: 1, dataMin: null, dataMax: null, hasData: false }

  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const span = dataMax - dataMin
  const padding = span === 0 ? CONSTANT_DOMAIN_PADDING : span * DOMAIN_PADDING_RATIO
  return { min: dataMin - padding, max: dataMax + padding, dataMin, dataMax, hasData: true }
}
