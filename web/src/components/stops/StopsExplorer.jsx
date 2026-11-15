import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useStopFilters } from '../../hooks/useStopFilters.js'
import { getSensorLabScenarios } from '../../services/sensorLab.js'
import { cn } from '../../utils/cn.js'
import NoResultsState from '../ui/NoResultsState.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import StopFilterBar from '../ui/StopFilterBar.jsx'
import SensorLab from './SensorLab.jsx'
import { StopPanel, StopSheet } from './StopDetail.jsx'
import StopList from './StopList.jsx'
import StopMap from './StopMap.jsx'
import { useIsDesktop } from './useIsDesktop.js'

const VIEWS = [
  { value: 'mapa', label: 'Mapa' },
  { value: 'lista', label: 'Lista' },
]

/**
 * Mapa/lista de pontos com filtros, ficha e favoritos. Estado na URL:
 * ?vista=lista (padrão: mapa) e ?ponto=<código> (ficha; código inexistente é ignorado).
 * @param {{ stops: object[], items: object[], now: Date, favorites: ReturnType<import('../../hooks/useFavoriteStops.js').useFavoriteStops> }} props
 */
export default function StopsExplorer({ stops, items, now, favorites }) {
  const [params, setParams] = useSearchParams()
  const isDesktop = useIsDesktop()
  const filter = useStopFilters(items, { now, favorites: favorites.favorites })
  const scenarios = useMemo(() => getSensorLabScenarios(), [])

  const view = params.get('vista') === 'lista' ? 'lista' : 'mapa'
  const selectedCode = params.get('ponto')
  const selected = items.find((item) => item.stop.code === selectedCode) ?? null

  const update = (change) =>
    setParams((current) => {
      const next = new URLSearchParams(current)
      change(next)
      return next
    })
  const setView = (value) => update((next) => (value === 'lista' ? next.set('vista', 'lista') : next.delete('vista')))
  const select = (code) => update((next) => next.set('ponto', code))
  const close = () => update((next) => next.delete('ponto'))
  const toggleSelectedFavorite = () => favorites.toggle(selected.stop.code)

  const detailProps = selected && {
    item: selected,
    favorite: favorites.isFavorite(selected.stop.code),
    onToggleFavorite: toggleSelectedFavorite,
    onClose: close,
  }

  return (
    <>
      <div className="mb-4">
        <SegmentedControl label="Vista dos pontos" options={VIEWS} value={view} onChange={setView} />
      </div>
      <StopFilterBar filter={filter} dimensions={['neighborhood', 'environmental', 'connectivity', 'favorites']} />
      <div className={cn('grid gap-5', selected && isDesktop && 'lg:grid-cols-[minmax(0,1fr)_24rem]')}>
        <div className="min-w-0">
          {filter.results.length === 0 ? (
            <NoResultsState onClear={filter.clear} />
          ) : view === 'mapa' ? (
            <StopMap stops={stops} items={filter.results} selectedCode={selected?.stop.code ?? null} onSelect={select} />
          ) : (
            <StopList
              items={filter.results}
              isFavorite={favorites.isFavorite}
              onToggleFavorite={favorites.toggle}
              onSelect={select}
            />
          )}
        </div>
        {selected && isDesktop && <StopPanel {...detailProps} />}
      </div>
      {selected && !isDesktop && <StopSheet {...detailProps} />}
      <SensorLab scenarios={scenarios} items={items} />
    </>
  )
}
