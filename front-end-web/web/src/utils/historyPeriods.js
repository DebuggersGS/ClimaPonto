const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export const HISTORY_PERIODS = [
  { id: '24h', label: 'Últimas 24 horas', shortLabel: '24 h', durationMs: DAY_MS },
  { id: '7d', label: 'Últimos 7 dias', shortLabel: '7 dias', durationMs: 7 * DAY_MS },
  { id: '30d', label: 'Últimos 30 dias', shortLabel: '30 dias', durationMs: 30 * DAY_MS },
]

export const DEFAULT_PERIOD_ID = '24h'

/**
 * Máximo de linhas exibidas. Menor que o máximo padrão de 1000 linhas do
 * PostgREST no Supabase; a consulta pede HISTORY_LIMIT + 1 para detectar truncamento.
 */
export const HISTORY_LIMIT = 500

/** Devolve o id se for um período conhecido; caso contrário, o padrão. */
export function parsePeriodId(value) {
  return HISTORY_PERIODS.some((p) => p.id === value) ? value : DEFAULT_PERIOD_ID
}

/**
 * Início do período como ISO 8601 UTC.
 * @param {string} periodId
 * @param {Date|number} now instante atual
 */
export function getPeriodStart(periodId, now) {
  const id = parsePeriodId(periodId)
  const { durationMs } = HISTORY_PERIODS.find((p) => p.id === id)
  const nowMs = now instanceof Date ? now.getTime() : now
  return new Date(nowMs - durationMs).toISOString()
}

/**
 * Mantém as `limit` leituras mais recentes (entrada em ordem decrescente) e
 * indica se havia mais linhas. Não altera a entrada.
 */
export function applyHistoryLimit(rowsDesc, limit = HISTORY_LIMIT) {
  return { rows: rowsDesc.slice(0, limit), truncated: rowsDesc.length > limit }
}
