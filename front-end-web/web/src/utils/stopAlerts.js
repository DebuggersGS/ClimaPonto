import { getConnectivity, getOfflineThresholdMs } from './connectivity.js'
import { getReadingSourceInfo, normalizeEnvironmentalStatus } from './readings.js'

/**
 * Alertas internos derivados SÓ de dados gravados. Não há limiar de
 * temperatura ou umidade aqui: o estado ambiental vem do banco
 * (environmental_status) e a conectividade segue a regra provisória de
 * connectivity.js (intervalo de envio ainda não definido para o ESP32).
 *
 * @typedef {object} StopAlert
 * @property {string} stopCode
 * @property {string} stopName
 * @property {'environmental'|'connectivity'} type
 * @property {'critical'|'offline'|'attention'} severity da mais grave para a menos grave
 * @property {string} ruleText regra aplicada, em texto
 * @property {{ key: string, label: string, isRealMeasurement: boolean, note: string|null }} origin origem da leitura
 * @property {string} readingAt ISO do horário da leitura
 * @property {boolean} stale true no alerta de conectividade: a leitura está desatualizada
 */

const SEVERITY_RANK = { critical: 3, offline: 2, attention: 1 }

const ENVIRONMENTAL_RULE = {
  critical: 'Estado ambiental gravado na última leitura é "Crítico" (classificação feita pelo banco, não pela interface).',
  attention: 'Estado ambiental gravado na última leitura é "Atenção" (classificação feita pelo banco, não pela interface).',
}

function offlineRule(sendIntervalMs) {
  const minutes = (getOfflineThresholdMs(sendIntervalMs) / 60000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  return `Última leitura com mais de ${minutes} min (regra provisória: 5 × o intervalo de envio, ainda não definido para o dispositivo). Dado desatualizado.`
}

function buildAlert(stop, reading, type, severity, ruleText) {
  return {
    stopCode: stop.code,
    stopName: stop.name,
    type,
    severity,
    ruleText,
    origin: getReadingSourceInfo(reading.source),
    readingAt: reading.measuredAt,
    stale: type === 'connectivity',
  }
}

/** Alerta do item, ou null. Ponto sem leitura (sem dados) nunca gera alerta. */
function alertForItem(item, now, sendIntervalMs) {
  const stop = item?.stop
  const reading = item?.reading
  if (!stop || !reading) return null
  const { status } = getConnectivity(reading.measuredAt, now, { sendIntervalMs })
  if (status === 'offline') return buildAlert(stop, reading, 'connectivity', 'offline', offlineRule(sendIntervalMs))
  if (status === 'no_data') return null
  const environmental = normalizeEnvironmentalStatus(reading.environmentalStatus)
  if (environmental === 'critical' || environmental === 'attention') {
    return buildAlert(stop, reading, 'environmental', environmental, ENVIRONMENTAL_RULE[environmental])
  }
  return null
}

/**
 * Deriva os alertas dos itens do summarizeDashboard.
 *  - ambiental: só com estado gravado critical/attention e ponto NÃO offline
 *    (leitura antiga não vira alerta de calor);
 *  - conectividade: só ponto offline pela regra provisória (marcado desatualizado);
 *  - ponto sem leitura: nenhum alerta.
 * Ordem: severidade (maior primeiro), horário da leitura (mais recente primeiro), código.
 * @param {Array<{ stop: object, reading: object|null }>|null|undefined} items
 * @param {{ now: Date|number, sendIntervalMs?: number }} options `now` é obrigatório
 * @returns {StopAlert[]}
 */
export function deriveStopAlerts(items, { now, sendIntervalMs } = {}) {
  const alerts = []
  for (const item of Array.isArray(items) ? items : []) {
    const alert = alertForItem(item, now, sendIntervalMs)
    if (alert) alerts.push(alert)
  }
  return alerts.sort(
    (a, b) =>
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
      Date.parse(b.readingAt) - Date.parse(a.readingAt) ||
      String(a.stopCode).localeCompare(String(b.stopCode), 'pt-BR'),
  )
}
