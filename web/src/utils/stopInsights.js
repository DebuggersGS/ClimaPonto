import { getConnectivity, getOfflineThresholdMs, SEND_INTERVAL_MS } from './connectivity.js'
import { formatHumidity, formatTemperature } from './formatters.js'
import { applyHistoryLimit, getPeriodStart, HISTORY_PERIODS, parsePeriodId } from './historyPeriods.js'
import { computeReadingQuality } from './readingQuality.js'
import { getReadingSourceInfo, sortReadingsDesc, summarizeSeries } from './readings.js'
import { compareStops, NOT_COMPARABLE_REASONS } from './stopComparison.js'

/** Variáveis do Ponto 360°: campo da leitura normalizada, unidade e formatação. */
export const VARIABLES = {
  temperatureC: { label: 'Temperatura', unit: '°C', format: formatTemperature },
  humidityPct: { label: 'Umidade', unit: '%', format: formatHumidity },
}

const SOURCE_ORDER = ['sensor', 'simulation', 'test', 'unknown']

const toNowMs = (now) => (now instanceof Date ? now.getTime() : Number(now))
const periodOf = (periodId) => HISTORY_PERIODS.find((p) => p.id === parsePeriodId(periodId))
const hasValue = (reading, field) => reading[field] !== null && reading[field] !== undefined

/**
 * Recorte de leituras por janela. Gráfico, tabela e CSV devem receber SEMPRE o
 * mesmo `readings` daqui, para que os três mostrem exatamente as mesmas linhas.
 * Leituras com horário à frente de `now` ficam fora (a janela termina em `now`).
 * @param {object[]} readings leituras normalizadas
 * @param {string} periodId '24h' | '7d' | '30d' (desconhecido vira o padrão)
 * @param {Date|number} now instante atual (sempre parâmetro)
 * @param {{ limit?: number }} [options] limite de linhas (padrão HISTORY_LIMIT; Infinity para não limitar)
 * @returns {{ periodId: string, label: string, startMs: number, endMs: number, readings: object[],
 *   inWindowCount: number, truncated: boolean }} `readings` em ordem decrescente
 */
export function sliceReadingsByWindow(readings, periodId, now, { limit } = {}) {
  const period = periodOf(periodId)
  const endMs = toNowMs(now)
  const startMs = Date.parse(getPeriodStart(period.id, endMs))
  const inWindow = sortReadingsDesc((readings ?? []).filter((r) => r.measuredAtMs >= startMs && r.measuredAtMs <= endMs))
  const { rows, truncated } = applyHistoryLimit(inWindow, limit)
  return { periodId: period.id, label: period.label, startMs, endMs, readings: rows, inWindowCount: inWindow.length, truncated }
}

function describeCurrent(readings, field) {
  const latest = readings.find((r) => hasValue(r, field))
  if (!latest) return { status: 'absent', unit: VARIABLES[field].unit }
  const source = getReadingSourceInfo(latest.source)
  return {
    status: 'available',
    value: latest[field],
    unit: VARIABLES[field].unit,
    measuredAt: latest.measuredAt,
    measuredAtMs: latest.measuredAtMs,
    source: source.key,
    sourceLabel: source.label,
    isRealMeasurement: source.isRealMeasurement,
  }
}

/**
 * Resumo atual: por métrica, a leitura mais recente QUE TEM aquele valor.
 * Métrica ausente fica `absent` (nunca zero) e não herda o horário de outra métrica.
 * @param {object[]} readings leituras normalizadas (qualquer ordem)
 * @returns {{ temperature: object, humidity: object, hasAny: boolean }}
 */
export function summarizeCurrent(readings) {
  const sorted = sortReadingsDesc(readings ?? [])
  const temperature = describeCurrent(sorted, 'temperatureC')
  const humidity = describeCurrent(sorted, 'humidityPct')
  return { temperature, humidity, hasAny: temperature.status === 'available' || humidity.status === 'available' }
}

function distributeBySource(readings) {
  const counts = Object.fromEntries(SOURCE_ORDER.map((key) => [key, 0]))
  for (const reading of readings) counts[getReadingSourceInfo(reading.source).key] += 1
  const total = readings.length
  return SOURCE_ORDER.map((key) => ({
    source: key,
    label: getReadingSourceInfo(key).label,
    count: counts[key],
    pct: total ? (counts[key] / total) * 100 : null,
  }))
}

/**
 * Qualidade dos dados do recorte: amostras, lacunas, idade da última leitura e
 * distribuição por origem. Reaproveita computeReadingQuality (regra provisória).
 * @param {ReturnType<typeof sliceReadingsByWindow>} windowSlice recorte; use `limit: Infinity` para medir tudo
 * @param {Date|number} now
 * @param {{ sendIntervalMs?: number }} [options]
 */
export function summarizeStopQuality(windowSlice, now, { sendIntervalMs = SEND_INTERVAL_MS } = {}) {
  const { readings, startMs, endMs } = windowSlice
  const base = computeReadingQuality(readings, { start: startMs, end: endMs, sendIntervalMs })
  const last = readings[0] ?? null // recorte vem em ordem decrescente
  const connectivity = getConnectivity(last?.measuredAt ?? null, now, { sendIntervalMs })
  const distribution = distributeBySource(readings)
  return {
    sampleCount: readings.length,
    expectedCount: base.expected,
    completenessPct: base.completenessPct,
    gapCount: base.gapsAboveOffline,
    largestGapMs: base.largestGapMs,
    gapThresholdMs: getOfflineThresholdMs(sendIntervalMs),
    lastReadingAt: last?.measuredAt ?? null,
    lastReadingAgeMs: connectivity.ageMs,
    connectivity: connectivity.status,
    sourceDistribution: distribution,
    hasNonRealData: readings.some((r) => !getReadingSourceInfo(r.source).isRealMeasurement),
    provisional: base.provisional,
    ruleText: base.ruleText,
  }
}

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

function formatDuration(ms) {
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round((minutes / 60) * 10) / 10
  if (hours < 48) return `${numberFormatter.format(hours)} h`
  return `${numberFormatter.format(Math.round((hours / 24) * 10) / 10)} dias`
}

/** "Últimas 24 horas" -> "nas últimas 24 horas" (concordância dos rótulos de HISTORY_PERIODS). */
const inPeriod = (label) => `${label.startsWith('Últimas') ? 'nas' : 'nos'} ${label.toLowerCase()}`

const plural = (count, one, many) => (count === 1 ? one : many)

function describeVariable(readings, field) {
  const { label, unit, format } = VARIABLES[field]
  const s = summarizeSeries(readings, field)
  if (s.count === 0) return `${label}: sem valores no período.`
  const text = `${label}: de ${format(s.min)} a ${format(s.max)}, média ${format(s.average)} (${s.count} ${plural(s.count, 'amostra', 'amostras')}).`
  if (s.trend.status !== 'available') return `${text} Amostras insuficientes para indicar tendência.`
  const v = s.trend.variation
  const sign = v > 0 ? '+' : ''
  const direction = v > 0 ? 'alta' : v < 0 ? 'queda' : 'estável'
  return `${text} Entre a primeira e a última leitura: ${sign}${numberFormatter.format(v)} ${unit} (${direction}).`
}

/**
 * Narrativa determinística em pt-BR, montada só com números já calculados.
 * Descreve; não classifica nem prevê.
 * @param {ReturnType<typeof sliceReadingsByWindow>} windowSlice
 * @param {ReturnType<typeof summarizeStopQuality>} quality
 * @returns {string[]} frases, na ordem de leitura
 */
export function buildStopNarrative(windowSlice, quality) {
  const period = inPeriod(windowSlice.label)
  if (quality.sampleCount === 0) return [`Não há leituras neste ponto ${period}.`]
  const { sampleCount } = quality
  const sentences = [`${period[0].toUpperCase()}${period.slice(1)}, há ${sampleCount} ${plural(sampleCount, 'leitura', 'leituras')} neste ponto.`]
  sentences.push(describeVariable(windowSlice.readings, 'temperatureC'))
  sentences.push(describeVariable(windowSlice.readings, 'humidityPct'))

  const origins = quality.sourceDistribution.filter((o) => o.count > 0)
  sentences.push(`Origem: ${origins.map((o) => `${o.label} (${o.count})`).join(', ')}.`)
  if (quality.hasNonRealData) sentences.push('Inclui dados que não são medição real (simulação, teste ou origem desconhecida).')

  const threshold = formatDuration(quality.gapThresholdMs)
  sentences.push(
    quality.gapCount === 0
      ? `Nenhuma lacuna acima de ${threshold} entre leituras consecutivas.`
      : `${quality.gapCount} ${plural(quality.gapCount, 'lacuna', 'lacunas')} acima de ${threshold} entre leituras consecutivas; a maior tem ${formatDuration(quality.largestGapMs)}.`,
  )
  if (quality.lastReadingAgeMs !== null && quality.lastReadingAgeMs >= 0) {
    sentences.push(`A última leitura tem ${formatDuration(quality.lastReadingAgeMs)}.`)
  }
  if (windowSlice.truncated) sentences.push(`Exibindo as ${windowSlice.readings.length} leituras mais recentes de ${windowSlice.inWindowCount} no período.`)
  return sentences
}

export const AB_NOT_COMPARABLE_REASONS = {
  ...NOT_COMPARABLE_REASONS,
  'invalid-variable': 'Escolha temperatura ou umidade.',
  'variable-mismatch': 'As séries são de variáveis ou unidades diferentes.',
  'period-mismatch': 'As séries são de períodos diferentes.',
  'no-data-a': 'O primeiro ponto não tem leituras com esse valor no período.',
  'no-data-b': 'O segundo ponto não tem leituras com esse valor no período.',
}

const blocked = (reason, extra = {}) => ({ status: 'not-comparable', reason, message: AB_NOT_COMPARABLE_REASONS[reason], ...extra })

const seriesFor = (side, variable, periodId, now) =>
  sliceReadingsByWindow(side.readings, periodId, now, { limit: Infinity }).readings.filter((r) => hasValue(r, variable))

/**
 * Checagem A/B: só compara a MESMA variável/unidade no MESMO período, com
 * motivo explícito quando não dá. Ausência de valor nunca vira 0: leituras sem
 * a variável saem antes de comparar. A comparação em si é a de compareStops.
 * @param {{ stopId: string, readings: object[], variable: string, periodId: string }} a
 * @param {{ stopId: string, readings: object[], variable: string, periodId: string }} b
 * @param {Date|number} now
 * @returns {{ status: 'not-comparable', reason: string, message: string }
 *   | { status: 'comparable', variable: string, unit: string, periodId: string, source: string, isSimulation: boolean,
 *       from: number, to: number, a: object, b: object, averageDifference: number|null }}
 */
export function checkStopsComparability(a, b, now) {
  if (!Object.hasOwn(VARIABLES, a?.variable) || !Object.hasOwn(VARIABLES, b?.variable)) return blocked('invalid-variable')
  if (a.variable !== b.variable) return blocked('variable-mismatch')
  if (parsePeriodId(a.periodId) !== parsePeriodId(b.periodId)) return blocked('period-mismatch')

  const { variable } = a
  const periodId = parsePeriodId(a.periodId)
  const seriesA = seriesFor(a, variable, periodId, now)
  const seriesB = seriesFor(b, variable, periodId, now)
  const result = compareStops({ stopId: a.stopId, readings: seriesA }, { stopId: b.stopId, readings: seriesB })

  if (result.status === 'not-comparable') {
    if (result.reason !== 'same-stop' && seriesA.length === 0) return blocked('no-data-a')
    if (result.reason !== 'same-stop' && seriesB.length === 0) return blocked('no-data-b')
    return blocked(result.reason)
  }
  const field = result.fields[variable]
  return {
    status: 'comparable',
    variable,
    unit: VARIABLES[variable].unit,
    periodId,
    source: result.source,
    isSimulation: result.isSimulation,
    from: result.from,
    to: result.to,
    a: field.a,
    b: field.b,
    averageDifference: field.averageDifference,
  }
}
