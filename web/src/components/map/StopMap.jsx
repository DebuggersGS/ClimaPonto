import { TriangleAlert } from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { buildStopGeoData, toMapItem } from '../../utils/geoMap.js'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import MapBoundary from './MapBoundary.jsx'
import MapLegend from './MapLegend.jsx'
import StopFallbackList from './StopFallbackList.jsx'
import { hasWebGL } from './webgl.js'

// Chunk próprio: MapLibre (~800 kB) só é baixado quando o mapa é exibido.
const StopMapCanvas = lazy(() => import('./StopMapCanvas.jsx'))

const FAILURE_TEXT = {
  webgl: 'Este navegador não oferece WebGL, necessário para o mapa interativo.',
  load: 'Não foi possível carregar o mapa interativo.',
  style: 'Não foi possível carregar o mapa base (estilo ou blocos do mapa).',
}

function FailureNotice({ kind, onRetry }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-300/80 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-400/40">
      <TriangleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1">{FAILURE_TEXT[kind]} Os pontos continuam disponíveis na lista abaixo.</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}

/** Pontos sem posição válida, com o motivo; continuam selecionáveis. */
function UnlocatedSection({ entries, onSelect, selectedCode }) {
  if (entries.length === 0) return null
  return (
    <section aria-labelledby="sem-localizacao" className="mt-4">
      <h2 id="sem-localizacao" className="text-base font-semibold text-slate-900">
        Sem localização
      </h2>
      <p className="text-sm text-slate-700">Estes pontos não aparecem no mapa porque não têm coordenadas utilizáveis.</p>
      <ul className="mt-2 space-y-2 text-sm text-slate-700">
        {entries.map(({ item, reason }) => (
          <li key={item.stop.id} className="flex flex-wrap items-center gap-x-2">
            <button
              type="button"
              aria-current={item.stop.code === selectedCode ? 'true' : undefined}
              onClick={() => onSelect(item.stop.code)}
              className="min-h-10 rounded-md px-2 font-medium text-brand-700 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-brand-200"
            >
              {item.stop.name} ({item.stop.code})
            </button>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Mapa real dos pontos (MapLibre + OpenFreeMap) com lista acessível de reserva:
 * sem WebGL, falha de estilo/tiles ou do chunk, mostra aviso, "Tentar novamente" e a lista.
 * @param {{ items: object[], selectedCode: string|null, onSelect: (code: string) => void, fictionalPosition?: boolean }} props
 *   `items` itens (summarizeDashboard) já filtrados; `fictionalPosition` rotula o conjunto demonstrativo
 */
export default function StopMap({ items: rawItems, selectedCode, onSelect, fictionalPosition = false, compact = false }) {
  const items = useMemo(() => (rawItems ?? []).map(toMapItem), [rawItems])
  const geo = useMemo(() => buildStopGeoData(items), [items])
  const [failure, setFailure] = useState(() => (hasWebGL() ? null : 'webgl'))
  const [attempt, setAttempt] = useState(0)
  const hasLocated = geo.featureCollection.features.length > 0

  const retry = () => {
    setFailure(hasWebGL() ? null : 'webgl')
    setAttempt((n) => n + 1)
  }
  // Falha do chunk e falha do estilo chegam por caminhos distintos; vale a primeira.
  const failWith = (kind) => () => setFailure((current) => current ?? kind)
  const unlocatedItems = new Set(geo.unlocated.map((entry) => entry.item))
  const located = items.filter((item) => !unlocatedItems.has(item))

  return (
    <div>
      {failure && <FailureNotice kind={failure} onRetry={retry} />}
      {!failure && hasLocated && (
        <figure aria-label="Mapa dos pontos de ônibus" className="m-0">
          <div
            className={
              compact
                ? 'relative h-64 w-full overflow-hidden rounded-card bg-surface-muted ring-1 ring-slate-900/10'
                : 'relative h-[60dvh] min-h-96 w-full overflow-hidden rounded-card bg-surface-muted ring-1 ring-slate-900/10 lg:h-[68dvh]'
            }
          >
            <MapBoundary key={attempt} onFailure={failWith('load')}>
              <Suspense fallback={<p role="status" className="p-4 text-sm text-slate-700">Carregando mapa…</p>}>
                <StopMapCanvas geo={geo} selectedCode={selectedCode} onSelect={onSelect} onFailure={failWith('style')} />
              </Suspense>
            </MapBoundary>
            {fictionalPosition && (
              <Badge tone="demo" icon="Sparkles" size="sm" className="absolute bottom-8 left-3 z-10">
                Posição fictícia (dados demonstrativos)
              </Badge>
            )}
          </div>
          {!compact && (
            <figcaption>
              <MapLegend />
            </figcaption>
          )}
        </figure>
      )}
      {!hasLocated && !failure && (
        <p className="text-sm text-slate-700">Nenhum ponto tem coordenadas válidas cadastradas para aparecer no mapa.</p>
      )}
      {(failure || (hasLocated && !compact)) && (
        <details open={failure !== null} className="mt-3">
          <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium text-slate-800 focus-visible:outline-2 focus-visible:outline-brand-600">
            Lista dos pontos no mapa ({located.length})
          </summary>
          <StopFallbackList items={located} selectedCode={selectedCode} onSelect={onSelect} label="Pontos com localização" />
        </details>
      )}
      <UnlocatedSection entries={geo.unlocated} onSelect={onSelect} selectedCode={selectedCode} />
    </div>
  )
}
