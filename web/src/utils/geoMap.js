import { partitionStopsByCoordinates, SAO_PAULO_BOUNDS } from './stopMap.js'
import { normalizeEnvironmentalStatus } from './readings.js'

/**
 * Dados geográficos para o mapa real (MapLibre). Funções puras, sem DOM.
 * Só pontos com coordenadas cadastradas e válidas viram feições; nenhuma
 * coordenada é inventada, arredondada ou estimada.
 *
 * Itens aceitos: ponto simples ou item do summarizeDashboard ({ stop, reading, connectivity }).
 */

/** Centro APROXIMADO de São Paulo [lng, lat]; usado só como enquadramento quando nenhum ponto tem posição. */
export const SAO_PAULO_CENTER = Object.freeze([-46.6333, -23.5505])

/** Formas do marcador por estado ambiental: o estado nunca depende só da cor. */
export const MARKER_SHAPES = Object.freeze({
  normal: 'circle',
  attention: 'triangle',
  critical: 'diamond',
  unclassified: 'square',
})

const CONNECTIVITY_STATUSES = ['online', 'delayed', 'offline', 'no_data', 'unknown']

function unwrap(item) {
  if (item !== null && typeof item === 'object' && 'stop' in item) {
    return { stop: item.stop ?? {}, reading: item.reading ?? null, connectivity: item.connectivity ?? null }
  }
  return { stop: item ?? {}, reading: null, connectivity: null }
}

/**
 * Origem exibida: 'observado' só quando há leitura de sensor real (ou ponto sem
 * leitura e não demonstrativo); simulação, teste, origem desconhecida e pontos
 * demonstrativos são 'demonstrativo'.
 * @param {{ isDemo?: boolean }} stop
 * @param {{ source?: string }|null} reading
 * @returns {'observado'|'demonstrativo'}
 */
export function resolveMapOrigin(stop, reading) {
  if (stop?.isDemo === true) return 'demonstrativo'
  if (reading && reading.source !== 'sensor') return 'demonstrativo'
  return 'observado'
}

function toFeature(item) {
  const { stop, reading, connectivity } = unwrap(item)
  const environmental = normalizeEnvironmentalStatus(reading?.environmentalStatus)
  const status = CONNECTIVITY_STATUSES.includes(connectivity?.status) ? connectivity.status : 'no_data'
  return {
    type: 'Feature',
    id: stop.id ?? stop.code,
    geometry: { type: 'Point', coordinates: [stop.longitude, stop.latitude] },
    properties: {
      id: stop.id ?? null,
      code: stop.code ?? null,
      name: stop.name ?? null,
      neighborhood: stop.neighborhood ?? null,
      origin: resolveMapOrigin(stop, reading),
      environmental,
      hasReading: reading !== null,
      connectivity: status,
      markerShape: MARKER_SHAPES[environmental],
    },
  }
}

/**
 * Enquadramento [[minLng, minLat], [maxLng, maxLat]] das coordenadas reais.
 * @param {Array<[number, number]>} coordinates pares [lng, lat]
 * @returns {{ bounds: [[number, number], [number, number]], center: [number, number], isFallback: boolean }}
 *   `isFallback` é true quando não há coordenada real e vale o enquadramento de São Paulo
 */
export function getMapBounds(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    const { minLng, minLat, maxLng, maxLat } = SAO_PAULO_BOUNDS
    return { bounds: [[minLng, minLat], [maxLng, maxLat]], center: [...SAO_PAULO_CENTER], isFallback: true }
  }
  const lngs = coordinates.map(([lng]) => lng)
  const lats = coordinates.map(([, lat]) => lat)
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)]
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)]
  return {
    bounds: [[minLng, minLat], [maxLng, maxLat]],
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
    isFallback: false,
  }
}

/**
 * Monta os dados do mapa.
 * @param {Array<object>|null|undefined} items
 * @returns {{
 *   featureCollection: { type: 'FeatureCollection', features: object[] },
 *   bounds: [[number, number], [number, number]],
 *   center: [number, number],
 *   isFallback: boolean,
 *   unlocated: Array<{ item: object, reason: string, kind: 'missing'|'outside' }>
 * }}
 */
export function buildStopGeoData(items) {
  const { located, missing, outside } = partitionStopsByCoordinates(items)
  const features = located.map(toFeature)
  const { bounds, center, isFallback } = getMapBounds(features.map((f) => f.geometry.coordinates))
  return {
    featureCollection: { type: 'FeatureCollection', features },
    bounds,
    center,
    isFallback,
    unlocated: [
      ...missing.map((entry) => ({ ...entry, kind: 'missing' })),
      ...outside.map((entry) => ({ ...entry, kind: 'outside' })),
    ],
  }
}
