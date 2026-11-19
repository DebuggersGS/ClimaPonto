/**
 * Mapa esquemático dos pontos (funções puras, sem DOM nem mapa base).
 * Posição é relativa, calculada só das coordenadas cadastradas; nada é
 * inventado, arredondado ou estimado.
 *
 * Itens aceitos: ponto simples ({ latitude, longitude, ... }) ou item do
 * summarizeDashboard ({ stop, reading, connectivity }).
 */

/**
 * Retângulo APROXIMADO do município de São Paulo (SP), em graus decimais.
 * Origem: extensão aproximada do município conhecida de mapas públicos
 * (cerca de -24,00 a -23,35 de latitude e -46,83 a -46,36 de longitude),
 * com folga pequena. Não é limite oficial: serve só para separar pontos
 * claramente fora da área do protótipo.
 */
export const SAO_PAULO_BOUNDS = Object.freeze({
  minLat: -24.0,
  maxLat: -23.35,
  minLng: -46.85,
  maxLng: -46.35,
})

/** Ponto do item, nos dois formatos aceitos. */
function stopOf(item) {
  if (item !== null && typeof item === 'object' && 'stop' in item) return item.stop ?? {}
  return item ?? {}
}

const isPresent = (value) => value !== null && value !== undefined && value !== ''
const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value)

/**
 * Valida as coordenadas de um ponto.
 * @param {{ latitude?: unknown, longitude?: unknown }} stop
 * @returns {{ status: 'located'|'missing'|'outside', reason: string|null }}
 */
function classifyCoordinates(stop) {
  const { latitude, longitude } = stop
  const hasLat = isPresent(latitude)
  const hasLng = isPresent(longitude)
  if (!hasLat && !hasLng) return { status: 'missing', reason: 'Sem coordenadas cadastradas.' }
  if (hasLat !== hasLng) return { status: 'missing', reason: 'Coordenadas incompletas (falta latitude ou longitude).' }
  if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
    return { status: 'missing', reason: 'Coordenadas não numéricas.' }
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { status: 'missing', reason: 'Coordenadas fora do intervalo válido.' }
  }
  const { minLat, maxLat, minLng, maxLng } = SAO_PAULO_BOUNDS
  if (latitude < minLat || latitude > maxLat || longitude < minLng || longitude > maxLng) {
    return { status: 'outside', reason: 'Fora da área aproximada do município de São Paulo.' }
  }
  return { status: 'located', reason: null }
}

/**
 * Separa os pontos por qualidade de coordenadas, preservando a ordem de entrada.
 * @param {Array<object>|null|undefined} items
 * @returns {{ located: object[], missing: Array<{ item: object, reason: string }>, outside: Array<{ item: object, reason: string }> }}
 */
export function partitionStopsByCoordinates(items) {
  const result = { located: [], missing: [], outside: [] }
  for (const item of Array.isArray(items) ? items : []) {
    const { status, reason } = classifyCoordinates(stopOf(item))
    if (status === 'located') result.located.push(item)
    else result[status].push({ item, reason })
  }
  return result
}

/** Posição centralizada quando não há extensão no eixo (ou ponto único). */
function axisPosition(value, min, scale, extent, size, padding) {
  if (extent === 0) return size / 2
  return padding + (value - min) * scale + (size - 2 * padding - extent * scale) / 2
}

/**
 * Projeta pontos já validados em x/y de um viewBox SVG. Equiretangular com
 * correção de cos(latitude média), escala uniforme (sem distorcer a forma)
 * ajustada à extensão dos próprios pontos. Determinística e sem arredondar.
 * x cresce para leste e y cresce para o sul (norte no topo).
 * @param {object[]} located itens retornados em `located` por partitionStopsByCoordinates
 * @param {{ width?: number, height?: number, padding?: number }} [viewBox]
 * @returns {Array<{ item: object, x: number, y: number }>}
 */
export function projectStops(located, { width = 800, height = 520, padding = 48 } = {}) {
  const list = Array.isArray(located) ? located : []
  if (list.length === 0) return []
  const coords = list.map((item) => {
    const { latitude, longitude } = stopOf(item)
    return { latitude, longitude }
  })
  const lats = coords.map((c) => c.latitude)
  const lngs = coords.map((c) => c.longitude)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const cosLat = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  const xExtent = (Math.max(...lngs) - minLng) * cosLat
  const yExtent = maxLat - minLat

  const innerW = width - 2 * padding
  const innerH = height - 2 * padding
  const candidates = [xExtent > 0 ? innerW / xExtent : Infinity, yExtent > 0 ? innerH / yExtent : Infinity]
  const scale = Math.min(...candidates)

  return list.map((item, index) => {
    const { latitude, longitude } = coords[index]
    if (!Number.isFinite(scale)) return { item, x: width / 2, y: height / 2 }
    const x = axisPosition((longitude - minLng) * cosLat, 0, scale, xExtent, width, padding)
    const y = axisPosition(maxLat - latitude, 0, scale, yExtent, height, padding)
    return { item, x, y }
  })
}
