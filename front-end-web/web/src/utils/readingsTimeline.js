import { getOfflineThresholdMs, SEND_INTERVAL_MS } from './connectivity.js'
import { ENVIRONMENTAL_STATUS_LABELS } from './readings.js'

/** Máximo padrão de eventos exibidos. */
export const TIMELINE_LIMIT = 50

function formatDuration(ms) {
  const totalMinutes = Math.round(ms / 60000)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}

const event = (type, reading, text, extra = {}) => ({
  type,
  atMs: reading.measuredAtMs,
  readingId: reading.id,
  text,
  ...extra,
})

/** Eventos entre leituras consecutivas: mudança de estado gravado e lacuna. */
function buildTransitionEvents(sorted, thresholdMs) {
  const events = []
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    const gapMs = curr.measuredAtMs - prev.measuredAtMs
    if (gapMs > thresholdMs) {
      events.push(
        event(
          'gap',
          curr,
          `Lacuna de ${formatDuration(gapMs)} sem leituras (acima de ${formatDuration(thresholdMs)}, regra provisória: 5 × o intervalo de leitura). Última leitura antes: ${prev.id}.`,
          { gapMs, previousReadingId: prev.id },
        ),
      )
    }
    if (prev.environmentalStatus !== curr.environmentalStatus) {
      const from = ENVIRONMENTAL_STATUS_LABELS[prev.environmentalStatus] ?? ENVIRONMENTAL_STATUS_LABELS.unclassified
      const to = ENVIRONMENTAL_STATUS_LABELS[curr.environmentalStatus] ?? ENVIRONMENTAL_STATUS_LABELS.unclassified
      events.push(
        event('status_change', curr, `Estado ambiental gravado mudou de "${from}" para "${to}".`, {
          from: prev.environmentalStatus,
          to: curr.environmentalStatus,
          previousReadingId: prev.id,
        }),
      )
    }
  }
  return events
}

/**
 * Linha do tempo derivada só das leituras carregadas, em ordem cronológica.
 * Usa o estado ambiental GRAVADO (nunca recalcula) e cada evento aponta uma leitura real.
 * Acima do limite, mantém o primeiro e o último evento e os mais recentes do meio.
 * @param {object[]} readings leituras normalizadas (qualquer ordem)
 * @param {{ sendIntervalMs?: number, limit?: number }} [options]
 * @returns {{ events: object[], truncated: boolean }}
 */
export function buildReadingsTimeline(readings, { sendIntervalMs = SEND_INTERVAL_MS, limit = TIMELINE_LIMIT } = {}) {
  const sorted = [...(readings ?? [])].sort((a, b) => a.measuredAtMs - b.measuredAtMs)
  if (sorted.length === 0) return { events: [], truncated: false }

  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const middle = buildTransitionEvents(sorted, getOfflineThresholdMs(sendIntervalMs))
  const head = event('first', first, 'Primeira leitura do período carregado.')
  const tail = sorted.length > 1 ? [event('last', last, 'Última leitura do período carregado.')] : []

  const maxMiddle = Math.max(0, limit - 1 - tail.length)
  const truncated = middle.length > maxMiddle
  const kept = truncated ? middle.slice(middle.length - maxMiddle) : middle
  return { events: [head, ...kept, ...tail], truncated }
}
