/**
 * Perfis temporais descritivos (por hora do dia e por dia da semana) no fuso
 * America/Sao_Paulo. Só agregam as leituras carregadas: sem previsão, sem
 * classificação e sem limiar ambiental.
 */

const TIME_ZONE = 'America/Sao_Paulo'

/** Mínimo de leituras de temperatura numa faixa para ela entrar no destaque. */
export const MIN_SAMPLES_PER_BUCKET = 3

const WEEKDAY_BY_NAME = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
const WEEKDAY_LABELS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
/** Exibição da semana começando na segunda-feira; a chave segue Date#getDay (0 = domingo). */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  hour: '2-digit',
  hourCycle: 'h23',
})

/** Hora (0–23) e dia da semana (0 = domingo) locais de São Paulo. */
function getLocalParts(ms) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(new Date(ms)).map((p) => [p.type, p.value]))
  return { hour: Number(parts.hour), weekday: WEEKDAY_BY_NAME[parts.weekday] }
}

function stats(values) {
  if (values.length === 0) return { count: 0, avg: null, min: null, max: null }
  const sum = values.reduce((total, value) => total + value, 0)
  return { count: values.length, avg: sum / values.length, min: Math.min(...values), max: Math.max(...values) }
}

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

function buildBucket(key, label, items) {
  const temperature = stats(items.map((r) => r.temperatureC).filter(isNumber))
  const humidity = stats(items.map((r) => r.humidityPct).filter(isNumber))
  return { key, label, empty: items.length === 0, readingCount: items.length, temperature, humidity }
}

/**
 * Destaque descritivo: faixa de maior e de menor temperatura média entre as
 * faixas com amostra mínima. Sem amostra suficiente, devolve o motivo.
 * @param {object[]} buckets
 * @returns {{ hottest: object, coolest: object }|{ insufficient: true, reason: string }}
 */
function buildHighlight(buckets) {
  const eligible = buckets.filter((b) => b.temperature.count >= MIN_SAMPLES_PER_BUCKET)
  if (eligible.length < 2) {
    return {
      insufficient: true,
      reason: `Dados insuficientes: são necessárias ao menos 2 faixas com ${MIN_SAMPLES_PER_BUCKET} ou mais leituras de temperatura (há ${eligible.length}).`,
    }
  }
  const byAvg = [...eligible].sort((a, b) => a.temperature.avg - b.temperature.avg)
  const coolest = byAvg[0]
  const hottest = byAvg[byAvg.length - 1]
  if (hottest.temperature.avg === coolest.temperature.avg) {
    return { insufficient: true, reason: 'Sem diferença entre as médias das faixas com amostra suficiente.' }
  }
  return { hottest, coolest }
}

function groupBy(readings, getKey) {
  const groups = new Map()
  for (const reading of readings ?? []) {
    const key = getKey(getLocalParts(reading.measuredAtMs))
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(reading)
  }
  return groups
}

/**
 * Perfil por hora do dia (0–23, America/Sao_Paulo). Sempre 24 faixas, as sem leitura com `empty: true`.
 * @param {object[]} readings leituras normalizadas
 * @returns {{ buckets: object[], highlight: object }}
 */
export function buildHourlyProfile(readings) {
  const groups = groupBy(readings, (p) => p.hour)
  const buckets = Array.from({ length: 24 }, (_, hour) =>
    buildBucket(hour, `${String(hour).padStart(2, '0')}h`, groups.get(hour) ?? []),
  )
  return { buckets, highlight: buildHighlight(buckets) }
}

/**
 * Perfil por dia da semana (America/Sao_Paulo), de segunda a domingo; chave 0 = domingo.
 * @param {object[]} readings leituras normalizadas
 * @returns {{ buckets: object[], highlight: object }}
 */
export function buildWeekdayProfile(readings) {
  const groups = groupBy(readings, (p) => p.weekday)
  const buckets = WEEKDAY_ORDER.map((day) => buildBucket(day, WEEKDAY_LABELS[day], groups.get(day) ?? []))
  return { buckets, highlight: buildHighlight(buckets) }
}
