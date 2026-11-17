import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { countActiveFilters, EMPTY_STOP_FILTERS, parseStopFilterParams, serializeStopFilterParams } from '../utils/stopFilterParams.js'
import { filterStops, getStopFilterOptions, resolveActiveFilters } from '../utils/stopFilters.js'

/**
 * Estado dos filtros de pontos (Dashboard e Pontos) + resultados e opções.
 * A regra de filtragem fica em utils/stopFilters.js; aqui só há estado e memoização.
 * `now` vem de quem chama (Dashboard usa o mesmo instante da conectividade exibida).
 * Com `syncUrl`, os filtros vivem na URL (?q=, ?bairro=...), sem criar histórico a cada tecla;
 * sem ela (Dashboard), ficam em estado local.
 *
 * @param {Array<object>} items pontos simples ou itens do summarizeDashboard
 * @param {{ now?: Date|number, sendIntervalMs?: number, favorites?: string[], syncUrl?: boolean }} [options]
 *   `favorites` (códigos) só vale com 'Somente favoritos'
 */
export function useStopFilters(items, { now, sendIntervalMs, favorites, syncUrl = false } = {}) {
  const [params, setParams] = useSearchParams()
  const [local, setLocal] = useState(EMPTY_STOP_FILTERS)
  const selected = useMemo(() => (syncUrl ? parseStopFilterParams(params) : local), [syncUrl, params, local])

  const apply = useCallback(
    (change) => {
      if (!syncUrl) return setLocal(change)
      return setParams((current) => serializeStopFilterParams(current, change(parseStopFilterParams(current))), { replace: true })
    },
    [syncUrl, setParams],
  )
  const setFilter = useCallback((name, value) => apply((current) => ({ ...current, [name]: value })), [apply])
  const clear = useCallback(() => apply(() => EMPTY_STOP_FILTERS), [apply])

  const options = useMemo(() => getStopFilterOptions(items, { now, sendIntervalMs }), [items, now, sendIntervalMs])
  // Valor selecionado que sumiu das opções deixa de filtrar (derivado, sem efeito).
  const filters = useMemo(() => resolveActiveFilters(selected, options), [selected, options])
  const results = useMemo(() => filterStops(items, filters, { now, sendIntervalMs, favorites }), [items, filters, now, sendIntervalMs, favorites])
  const activeCount = countActiveFilters(filters)

  return { filters, setFilter, clear, options, results, total: items.length, hasActiveFilters: activeCount > 0, activeCount }
}
