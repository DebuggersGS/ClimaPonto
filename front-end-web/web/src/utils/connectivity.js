/**
 * Intervalo de leitura do sensor no ponto, em ms: 10 minutos.
 * Definido pela análise matemática (pasta matematica-dps/) e usado pela
 * Central de Leituras em Python. Na simulação do Wokwi o envio é mais rápido,
 * só para demonstração.
 */
export const SEND_INTERVAL_MS = 10 * 60000

/** Até este múltiplo do intervalo a leitura é considerada online. */
export const ONLINE_FACTOR = 2

/** Acima deste múltiplo do intervalo o ponto é considerado offline. */
export const OFFLINE_FACTOR = 5

/** Mesma tolerância da restrição measured_at <= received_at + 5 min do banco. */
export const CLOCK_TOLERANCE_MS = 5 * 60000

export const CONNECTIVITY_LABELS = {
  online: 'Online',
  delayed: 'Atrasado',
  offline: 'Offline',
  no_data: 'Sem dados',
  unknown: 'Indeterminado',
}

/** Idade (ms) a partir da qual o ponto é considerado offline. */
export function getOfflineThresholdMs(sendIntervalMs = SEND_INTERVAL_MS) {
  return OFFLINE_FACTOR * sendIntervalMs
}

/**
 * Classifica a conectividade a partir do instante da última leitura.
 * Dimensão separada do estado ambiental.
 * @param {string|Date|null|undefined} measuredAt instante da leitura (ISO ou Date)
 * @param {Date|number} now instante atual (Date ou ms)
 * @param {{ sendIntervalMs?: number }} [options]
 * @returns {{ status: 'online'|'delayed'|'offline'|'no_data'|'unknown', ageMs: number|null }}
 */
export function getConnectivity(measuredAt, now, { sendIntervalMs = SEND_INTERVAL_MS } = {}) {
  if (measuredAt === null || measuredAt === undefined || measuredAt === '') {
    return { status: 'no_data', ageMs: null }
  }
  const measuredMs = new Date(measuredAt).getTime()
  if (Number.isNaN(measuredMs)) return { status: 'no_data', ageMs: null }

  const age = Number(now instanceof Date ? now.getTime() : now) - measuredMs
  if (age < -CLOCK_TOLERANCE_MS) return { status: 'unknown', ageMs: age }
  if (age < 0) return { status: 'online', ageMs: 0 }
  if (age <= ONLINE_FACTOR * sendIntervalMs) return { status: 'online', ageMs: age }
  if (age <= getOfflineThresholdMs(sendIntervalMs)) return { status: 'delayed', ageMs: age }
  return { status: 'offline', ageMs: age }
}
