/**
 * Geometria de sparkline (função pura): converte uma série ordenada em trechos
 * contínuos de coordenadas SVG. Valores ausentes ou inválidos quebram o trecho;
 * nunca se interpola nem se inventa ponto.
 */

const round = (n) => Math.round(n * 100) / 100

/**
 * @typedef {{ x: number, y: number }} SparkPoint
 * @typedef {{ viewBox: string, segments: SparkPoint[][], paths: string[], dots: SparkPoint[],
 *   min: number, max: number, last: number, count: number, lastPoint: SparkPoint }} Sparkline
 */

/**
 * @param {Array<number|null|undefined>} values posições igualmente espaçadas no eixo X
 * @param {{ width?: number, height?: number, padding?: number }} [options]
 * @returns {Sparkline|null} null quando há menos de 2 valores finitos
 */
export function buildSparkline(values, { width = 100, height = 32, padding = 2 } = {}) {
  const isValid = (v) => typeof v === 'number' && Number.isFinite(v)
  const valid = values.filter(isValid)
  if (valid.length < 2) return null

  const min = Math.min(...valid)
  const max = Math.max(...valid)
  const span = max - min
  const innerW = width - 2 * padding
  const innerH = height - 2 * padding
  const lastIndex = Math.max(values.length - 1, 1)

  const toPoint = (value, index) => ({
    x: round(padding + (index / lastIndex) * innerW),
    y: round(span === 0 ? height / 2 : padding + (1 - (value - min) / span) * innerH),
  })

  const segments = []
  let current = []
  values.forEach((value, index) => {
    if (isValid(value)) {
      current.push(toPoint(value, index))
    } else if (current.length > 0) {
      segments.push(current)
      current = []
    }
  })
  if (current.length > 0) segments.push(current)

  const paths = segments
    .filter((segment) => segment.length >= 2)
    .map((segment) => segment.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '))
  const dots = segments.filter((segment) => segment.length === 1).map((segment) => segment[0])
  const lastSegment = segments[segments.length - 1]

  return {
    viewBox: `0 0 ${width} ${height}`,
    segments,
    paths,
    dots,
    min,
    max,
    last: valid[valid.length - 1],
    count: valid.length,
    lastPoint: lastSegment[lastSegment.length - 1],
  }
}
