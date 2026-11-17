import { PanelRightOpen } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useDataScenario } from '../../hooks/useDataScenario.js'
import { useStopFilters } from '../../hooks/useStopFilters.js'
import { cn } from '../../utils/cn.js'
import StopMap from '../map/StopMap.jsx'
import Button from '../ui/Button.jsx'
import NoResultsState from '../ui/NoResultsState.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import ExploreFilters from './ExploreFilters.jsx'
import { StopPanel, StopSheet } from './StopDetail.jsx'
import StopList from './StopList.jsx'
import { useIsDesktop } from './useIsDesktop.js'

const VIEWS = [
  { value: 'mapa', label: 'Mapa' },
  { value: 'lista', label: 'Lista' },
]

/**
 * Mapa/lista de pontos com filtros, ficha e favoritos. Estado na URL:
 * filtros (?q, ?bairro, ?ambiente, ?conexao, ?favoritos), ?vista=lista (padrão: mapa)
 * e ?ponto=<código> (ficha; código inexistente é ignorado).
 * @param {{ items: object[], now: Date, source: string, favorites: ReturnType<import('../../hooks/useFavoriteStops.js').useFavoriteStops> }} props
 *   `source` é o modo de dados; mock e cenário demonstrativo rotulam a posição como fictícia
 */
export default function StopsExplorer({ items, now, source, favorites }) {
  const [params, setParams] = useSearchParams()
  const isDesktop = useIsDesktop()
  const { isDemonstrative } = useDataScenario()
  const filter = useStopFilters(items, { now, favorites: favorites.favorites, syncUrl: true })
  // Código recolhido e se o foco deve ir ao painel ao reabri-lo.
  const [panel, setPanel] = useState({ collapsedCode: null, focusPanel: false })

  const view = params.get('vista') === 'lista' ? 'lista' : 'mapa'
  const selectedCode = params.get('ponto')
  const selected = items.find((item) => item.stop.code === selectedCode) ?? null
  const fictionalPosition = isDemonstrative || source === 'mock'
  const collapsed = selected !== null && panel.collapsedCode === selected.stop.code

  const update = (change) =>
    setParams((current) => {
      const next = new URLSearchParams(current)
      change(next)
      return next
    })
  const setView = (value) => update((next) => (value === 'lista' ? next.set('vista', 'lista') : next.delete('vista')))
  const select = (code) => {
    setPanel({ collapsedCode: null, focusPanel: false })
    update((next) => next.set('ponto', code))
  }
  const close = () => update((next) => next.delete('ponto'))

  const detailProps = selected && {
    item: selected,
    favorite: favorites.isFavorite(selected.stop.code),
    onToggleFavorite: () => favorites.toggle(selected.stop.code),
    onClose: close,
    fictionalPosition,
  }
  const showPanel = selected && isDesktop && !collapsed

  return (
    <>
      <div className="mb-3">
        <SegmentedControl label="Vista dos pontos" options={VIEWS} value={view} onChange={setView} />
      </div>
      <ExploreFilters filter={filter} />
      <div className={cn('grid gap-5', showPanel && 'lg:grid-cols-[minmax(0,1fr)_22rem]')}>
        <div className="min-w-0">
          {selected && isDesktop && collapsed && (
            <Button
              variant="secondary"
              size="sm"
              autoFocus
              className="mb-3"
              onClick={() => setPanel({ collapsedCode: null, focusPanel: true })}
            >
              <PanelRightOpen aria-hidden="true" className="h-4 w-4" />
              Mostrar painel de {selected.stop.name}
            </Button>
          )}
          {filter.results.length === 0 ? (
            <NoResultsState onClear={filter.clear} />
          ) : view === 'mapa' ? (
            <StopMap items={filter.results} selectedCode={selected?.stop.code ?? null} onSelect={select} fictionalPosition={fictionalPosition} />
          ) : (
            <StopList items={filter.results} isFavorite={favorites.isFavorite} onToggleFavorite={favorites.toggle} onSelect={select} />
          )}
        </div>
        {showPanel && (
          <StopPanel
            {...detailProps}
            focusHeading={panel.focusPanel}
            onCollapse={() => setPanel({ collapsedCode: selected.stop.code, focusPanel: false })}
          />
        )}
      </div>
      {selected && !isDesktop && <StopSheet {...detailProps} />}
    </>
  )
}
