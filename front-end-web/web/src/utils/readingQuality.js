import { getOfflineThresholdMs, SEND_INTERVAL_MS } from './connectivity.js'

const toMs = (value) => (value === null || value === undefined ? NaN : new Date(value).getTime())

/**
 * Qualidade das medições de um ponto num período. Regra PROVISÓRIA: o
 * intervalo de envio ainda não foi definido para o ESP32, então a
 * completude é uma estimativa, não uma garantia.
 * @param {object[]} readings leituras normalizadas (já válidas)
 * @param {{ start?: string|number|Date, end?: string|number|Date, sendIntervalMs?: number, discarded?: number|null }} [options]
 *   `discarded`: leituras descartadas por invalidez, quando a fonte as informa
 * @returns {{ valid: number, discarded: number|null, expected: number|null, completenessPct: number|null,
 *   exceedsExpected: boolean, largestGapMs: number|null, gapsAboveOffline: number, provisional: true, ruleText: string }}
 */
export function computeReadingQuality(readings, { start, end, sendIntervalMs = SEND_INTERVAL_MS, discarded = null } = {}) {
  const startMs = toMs(start)
  const endMs = toMs(end)
  const hasWindow = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs

  // Instantes iguais contam uma vez só (reenvio do dispositivo não é nova medição).
  const instants = [...new Set((readings ?? []).map((r) => r.measuredAtMs))]
    .filter((ms) => Number.isFinite(ms) && (!hasWindow || (ms >= startMs && ms <= endMs)))
    .sort((a, b) => a - b)

  const thresholdMs = getOfflineThresholdMs(sendIntervalMs)
  let largestGapMs = null
  let gapsAboveOffline = 0
  for (let i = 1; i < instants.length; i += 1) {
    const gap = instants[i] - instants[i - 1]
    if (largestGapMs === null || gap > largestGapMs) largestGapMs = gap
    if (gap > thresholdMs) gapsAboveOffline += 1
  }

  const expected = hasWindow ? Math.floor((endMs - startMs) / sendIntervalMs) : null
  const valid = instants.length
  const ratio = expected ? (valid / expected) * 100 : null

  return {
    valid,
    discarded: Number.isFinite(discarded) && discarded >= 0 ? discarded : null,
    expected,
    // Limitada a 100%: acima disso o dispositivo enviou mais que o intervalo provisório.
    completenessPct: ratio === null ? null : Math.min(100, ratio),
    exceedsExpected: ratio !== null && ratio > 100,
    largestGapMs,
    gapsAboveOffline,
    provisional: true,
    ruleText:
      `Regra provisória: esperado = período ÷ intervalo de envio (${sendIntervalMs / 60000} min, o intervalo de leitura do sensor); ` +
      `lacuna conta quando passa de ${thresholdMs / 1000} s entre leituras consecutivas. ` +
      'Instantes repetidos contam uma vez; períodos sem leitura nas bordas não entram nas lacunas.',
  }
}
