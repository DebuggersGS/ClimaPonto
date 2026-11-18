import { useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import MapGL, { AttributionControl, Layer, NavigationControl, Source } from 'react-map-gl/maplibre'
import { setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// O MapLibre 6 procura o worker em "./maplibre-gl-worker.mjs" ao lado do próprio módulo. Com o Vite isso
// quebra nos dois modos: o pré-empacotamento (dev) não copia o arquivo e o build não o emite. Sem worker
// nenhum estilo/bloco é processado e o mapa caía no aviso de falha. Aqui o Vite emite o worker como
// asset do próprio site (CSP: worker-src 'self') e o MapLibre recebe a URL explícita.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { RotateCcw } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { drawMarkerImage } from './markerImages.js'
import {
  ATTRIBUTION,
  clusterCountLayer,
  clusterLayer,
  FIT_OPTIONS,
  LAYER_IDS,
  markerImageId,
  MAP_LOCALE,
  MAP_STYLES,
  pointsLayer,
  SELECT_ZOOM,
  selectedLayer,
  SOURCE_ID,
  STATUS_LEGEND,
} from './mapConfig.js'
import { useColorScheme } from './useColorScheme.js'

setWorkerUrl(maplibreWorkerUrl)

const INTERACTIVE_LAYERS = [LAYER_IDS.clusters, LAYER_IDS.points]
const FLY_DURATION_MS = 800

/** Registra os 8 marcadores (estado × conectividade) de uma vez, antes de a camada pedir por eles. */
function addMarkerImages(map) {
  for (const { status } of STATUS_LEGEND) {
    for (const online of [true, false]) {
      const id = markerImageId(status, online)
      const image = drawMarkerImage(id)
      if (image && !map.hasImage(id)) map.addImage(id, image.data, { pixelRatio: image.pixelRatio })
    }
  }
}

/** Pontos [lng, lat] por código, para centralizar a seleção. */
const coordinatesByCode = (featureCollection) =>
  new Map(featureCollection.features.map((f) => [f.properties.code, f.geometry.coordinates]))

/**
 * Mapa MapLibre carregado sob demanda (chunk próprio). Cuida só do desenho e da
 * câmera; falhas de estilo/tiles sobem por `onFailure` para o invólucro mostrar a lista.
 * @param {{ geo: ReturnType<import('../../utils/geoMap.js').buildStopGeoData>, selectedCode: string|null,
 *   onSelect: (code: string) => void, onFailure: () => void }} props
 */
export default function StopMapCanvas({ geo, selectedCode, onSelect, onFailure }) {
  const { featureCollection, bounds, center, isFallback } = geo
  const scheme = useColorScheme()
  const reduced = useReducedMotion() === true
  const [map, setMap] = useState(null)
  const [hovering, setHovering] = useState(false)
  const [tileWarning, setTileWarning] = useState(false)
  const loadedRef = useRef(false)
  const selectedRef = useRef(selectedCode)
  const [initialView] = useState(() =>
    isFallback ? { longitude: center[0], latitude: center[1], zoom: 9.5 } : { bounds, fitBoundsOptions: FIT_OPTIONS },
  )

  const fitView = useCallback(
    (animate) => {
      if (!map) return
      if (isFallback) map.jumpTo({ center, zoom: 9.5 })
      else map.fitBounds(bounds, { ...FIT_OPTIONS, animate: animate && !reduced })
    },
    [map, bounds, center, isFallback, reduced],
  )

  // Imagens dos marcadores sob demanda (também após trocar o estilo claro/escuro).
  useEffect(() => {
    if (!map) return undefined
    const onMissing = (event) => {
      const image = drawMarkerImage(event.id)
      if (image && !map.hasImage(event.id)) map.addImage(event.id, image.data, { pixelRatio: image.pixelRatio })
    }
    map.on('styleimagemissing', onMissing)
    return () => map.off('styleimagemissing', onMissing)
  }, [map])

  // Reenquadra quando o conjunto de pontos muda (filtros), exceto com um ponto selecionado.
  const fitKey = featureCollection.features.map((f) => f.properties.code).join('|')
  useEffect(() => {
    if (!selectedRef.current) fitView(true)
  }, [fitKey, fitView])

  useEffect(() => {
    selectedRef.current = selectedCode
    const target = selectedCode && map ? coordinatesByCode(featureCollection).get(selectedCode) : null
    if (!target) return
    map.flyTo({ center: target, zoom: Math.max(map.getZoom(), SELECT_ZOOM), duration: FLY_DURATION_MS, animate: !reduced })
  }, [map, selectedCode, featureCollection, reduced])

  async function zoomIntoCluster(feature) {
    const { coordinates } = feature.geometry
    let zoom = map.getZoom() + 2
    try {
      zoom = await map.getSource(SOURCE_ID).getClusterExpansionZoom(feature.properties.cluster_id)
    } catch {
      // Sem a expansão exata, aproxima dois níveis: o clique continua útil.
    }
    map.easeTo({ center: coordinates, zoom, animate: !reduced })
  }

  function handleClick(event) {
    const feature = event.features?.[0]
    if (!feature || !map) return
    if (feature.properties.cluster) zoomIntoCluster(feature)
    else onSelect(feature.properties.code)
  }

  function handleError(event) {
    // O erro fica no console para diagnóstico real (o aviso da interface não substitui a causa).
    console.error('[mapa]', event.error ?? event)
    // Bloco isolado (tem sourceId/tile) não derruba o mapa: só avisa. Sem estilo carregado, cai na lista.
    if (event.sourceId || event.tile) setTileWarning(true)
    else if (!loadedRef.current) onFailure()
  }

  return (
    <div className="relative h-full w-full">
      <MapGL
        initialViewState={initialView}
        mapStyle={MAP_STYLES[scheme]}
        locale={MAP_LOCALE}
        attributionControl={false}
        interactiveLayerIds={INTERACTIVE_LAYERS}
        cursor={hovering ? 'pointer' : ''}
        // Marcadores registrados assim que o estilo chega (e de novo ao trocar claro/escuro), antes do 1º quadro.
        onStyleData={(event) => addMarkerImages(event.target)}
        onLoad={(event) => {
          loadedRef.current = true
          addMarkerImages(event.target)
          setMap(event.target)
        }}
        onError={handleError}
        onClick={handleClick}
        onMouseMove={(event) => setHovering((event.features?.length ?? 0) > 0)}
        onMouseLeave={() => setHovering(false)}
      >
        <AttributionControl compact customAttribution={ATTRIBUTION} position="bottom-right" />
        <NavigationControl position="top-right" />
        <Source id={SOURCE_ID} type="geojson" data={featureCollection} cluster clusterMaxZoom={14} clusterRadius={44}>
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...selectedLayer(selectedCode)} />
          <Layer {...pointsLayer} />
        </Source>
      </MapGL>
      <Button variant="secondary" size="sm" className="absolute left-3 top-3 z-10" onClick={() => fitView(true)}>
        <RotateCcw aria-hidden="true" className="h-4 w-4" />
        Reiniciar vista
      </Button>
      {tileWarning && (
        <p role="status" className="absolute inset-x-3 bottom-10 z-10 rounded-lg bg-surface px-3 py-2 text-sm text-slate-800 shadow-card ring-1 ring-slate-900/10">
          Parte do mapa base não carregou. Os pontos continuam disponíveis; use a lista abaixo ou tente novamente mais tarde.
        </p>
      )}
    </div>
  )
}
