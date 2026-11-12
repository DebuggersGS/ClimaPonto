import { getOfflineThresholdMs } from './connectivity.js'

const isValidValue = (value) => typeof value === 'number' && Number.isFinite(value)

/**
 * Converte pontos de série temporal em coordenadas SVG.
 * X é proporcional ao tempo; Y é invertido (maior valor no topo). Valor nulo
 * ou lacuna maior que maxGapMs quebra o trecho; trecho de 1 ponto vira marker.
 * @param {Array<{ t: number, value: number|null }>} points em ordem crescente de t
 * @param {{ width?: number, height?: number, padding?: number, maxGapMs?: number }} [options]
 */
export function buildSeriesGeometry(
  points,
  { width = 600, height = 200, padding = 16, maxGapMs = getOfflineThresholdMs() } = {},
) {
  const valid = points.filter((point) => isValidValue(point.value))
  const empty = valid.length === 0
  const tStart = empty ? null : valid[0].t
  const tEnd = empty ? null : valid[valid.length - 1].t
  const values = valid.map((point) => point.value)
  const yMin = empty ? null : Math.min(...values)
  const yMax = empty ? null : Math.max(...values)

  const innerW = width - 2 * padding
  const innerH = height - 2 * padding
  // Domínio degenerado (instante único ou valor constante): centraliza.
  const toX = (t) => (tEnd === tStart ? padding + innerW / 2 : padding + ((t - tStart) / (tEnd - tStart)) * innerW)
  const toY = (v) => (yMax === yMin ? padding + innerH / 2 : padding + ((yMax - v) / (yMax - yMin)) * innerH)

  const groups = []
  let previous = null
  for (const point of points) {
    if (!isValidValue(point.value)) {
      previous = null
      continue
    }
    const mapped = { x: toX(point.t), y: toY(point.value), t: point.t, value: point.value }
    if (previous && point.t - previous.t <= maxGapMs) groups[groups.length - 1].push(mapped)
    else groups.push([mapped])
    previous = point
  }

  return {
    viewBox: `0 0 ${width} ${height}`,
    segments: groups.filter((group) => group.length >= 2),
    markers: groups.filter((group) => group.length === 1).map((group) => group[0]),
    yMin,
    yMax,
    tStart,
    tEnd,
  }
}

const round2 = (n) => Math.round(n * 100) / 100

/** Gera o atributo "d" de um path SVG ('M x y L x y ...'), com até 2 casas decimais. */
export function toPathData(segment) {
  return segment.map((p, i) => `${i === 0 ? 'M' : 'L'} ${round2(p.x)} ${round2(p.y)}`).join(' ')
}
