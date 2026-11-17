import { MARKER_SHAPES } from '../../utils/geoMap.js'

/**
 * Configuração do mapa (sem DOM): estilos, textos, cores e camadas.
 * Estilos vetoriais públicos do OpenFreeMap (sem chave de API). O estilo escuro
 * usa "fiord"; se o OpenFreeMap renomear estilos, só estas constantes mudam.
 */
export const MAP_STYLES = Object.freeze({
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/fiord',
})

export const ATTRIBUTION = Object.freeze([
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
  '<a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a>',
])

/** Textos do MapLibre em português (controles de navegação, atribuição e canvas). */
export const MAP_LOCALE = Object.freeze({
  'Map.Title': 'Mapa dos pontos de ônibus',
  'NavigationControl.ZoomIn': 'Aproximar',
  'NavigationControl.ZoomOut': 'Afastar',
  'NavigationControl.ResetBearing': 'Reorientar para o norte',
  'AttributionControl.ToggleAttribution': 'Mostrar ou ocultar atribuição',
  'AttributionControl.MapFeedback': 'Sugerir correção no mapa',
  'LogoControl.Title': 'Logotipo do MapLibre',
})

export const SOURCE_ID = 'stops'
export const LAYER_IDS = Object.freeze({ clusters: 'stop-clusters', points: 'stop-points' })

/** Cor de cada estado ambiental; a forma (MARKER_SHAPES) repete a informação. */
export const STATUS_COLORS = Object.freeze({
  normal: '#047857',
  attention: '#b45309',
  critical: '#b91c1c',
  unclassified: '#475569',
})

export const STATUS_LEGEND = Object.freeze([
  { status: 'normal', label: 'Normal' },
  { status: 'attention', label: 'Atenção' },
  { status: 'critical', label: 'Crítico' },
  { status: 'unclassified', label: 'Sem classificação' },
])

export const SHAPE_BY_STATUS = MARKER_SHAPES

/** Nome da imagem do marcador: estado ambiental + conectividade (on = online, off = contorno tracejado). */
export const markerImageId = (status, online) => `marker-${status}-${online ? 'on' : 'off'}`

/** Lê o nome da imagem; devolve null quando não é de marcador. */
export function parseMarkerImageId(id) {
  const match = /^marker-(normal|attention|critical|unclassified)-(on|off)$/.exec(id ?? '')
  return match ? { status: match[1], online: match[2] === 'on' } : null
}

/** Enquadramento padrão ao mostrar todos os pontos. */
export const FIT_OPTIONS = Object.freeze({ padding: 64, maxZoom: 15 })
export const SELECT_ZOOM = 15

const CLUSTER_FILTER = ['has', 'point_count']

export const clusterLayer = {
  id: LAYER_IDS.clusters,
  type: 'circle',
  source: SOURCE_ID,
  filter: CLUSTER_FILTER,
  paint: {
    'circle-color': '#0a56a3',
    'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 50, 28],
    'circle-stroke-width': 3,
    'circle-stroke-color': '#ffffff',
  },
}

export const clusterCountLayer = {
  id: 'stop-cluster-count',
  type: 'symbol',
  source: SOURCE_ID,
  filter: CLUSTER_FILTER,
  layout: {
    'text-field': ['to-string', ['get', 'point_count']],
    'text-font': ['Noto Sans Bold'],
    'text-size': 13,
    'text-allow-overlap': true,
  },
  paint: { 'text-color': '#ffffff' },
}

/** Anel de destaque do ponto selecionado (atrás do ícone). */
export const selectedLayer = (code) => ({
  id: 'stop-selected',
  type: 'circle',
  source: SOURCE_ID,
  filter: ['all', ['!', CLUSTER_FILTER], ['==', ['get', 'code'], code ?? '']],
  paint: {
    'circle-radius': 20,
    'circle-color': '#ffffff',
    'circle-stroke-width': 4,
    'circle-stroke-color': '#0a56a3',
  },
})

export const pointsLayer = {
  id: LAYER_IDS.points,
  type: 'symbol',
  source: SOURCE_ID,
  filter: ['!', CLUSTER_FILTER],
  layout: {
    'icon-image': [
      'concat',
      'marker-',
      ['get', 'environmental'],
      '-',
      ['case', ['==', ['get', 'connectivity'], 'online'], 'on', 'off'],
    ],
    'icon-size': 1,
    'icon-allow-overlap': true,
  },
}
