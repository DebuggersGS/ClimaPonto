const TIME_ZONE = 'America/Sao_Paulo'

const hourFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIME_ZONE })
const dayFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: TIME_ZONE })

/** Cores por grandeza (linha com contraste ≥ 3:1 sobre branco; o texto nunca depende só da cor). */
export const SERIES_TONES = {
  temperature: { stroke: '#d97706' },
  humidity: { stroke: '#0284c7' },
}

/**
 * Rótulo do eixo X no fuso de São Paulo: hora (24h) no período de 24 h; dia/mês nos demais.
 * @param {number} ms
 * @param {string} periodId
 */
export function formatTick(ms, periodId) {
  const formatter = periodId === '24h' ? hourFormatter : dayFormatter
  return formatter.format(new Date(ms))
}
