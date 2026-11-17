/**
 * Pontos do gráfico de medições: uma entrada por leitura (sem agregar, para o
 * tooltip mostrar horário e origem reais) e uma entrada vazia após cada
 * lacuna, de modo que a linha se interrompa em vez de ligar o que não foi medido.
 */

/**
 * @param {object[]} readings leituras do recorte (qualquer ordem)
 * @param {'temperatureC'|'humidityPct'} variable
 * @param {number} gapThresholdMs lacuna = intervalo maior que isto entre leituras consecutivas
 * @returns {{ points: Array<{ t: number, value: number|null, measuredAt?: string, source?: string }>,
 *   gaps: Array<{ startMs: number, endMs: number, durationMs: number }> }}
 */
export function buildMeasurementPoints(readings, variable, gapThresholdMs) {
  const valid = readings
    .filter((reading) => reading[variable] !== null && reading[variable] !== undefined)
    .sort((a, b) => a.measuredAtMs - b.measuredAtMs)
  const points = []
  const gaps = []
  valid.forEach((reading, index) => {
    const previous = valid[index - 1]
    if (previous && reading.measuredAtMs - previous.measuredAtMs > gapThresholdMs) {
      gaps.push({ startMs: previous.measuredAtMs, endMs: reading.measuredAtMs, durationMs: reading.measuredAtMs - previous.measuredAtMs })
      points.push({ t: previous.measuredAtMs + 1, value: null })
    }
    points.push({ t: reading.measuredAtMs, value: reading[variable], measuredAt: reading.measuredAt, source: reading.source })
  })
  return { points, gaps }
}
