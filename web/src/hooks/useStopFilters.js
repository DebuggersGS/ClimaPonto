import { useCallback, useMemo, useState } from 'react'
import { filterStops, getStopFilterOptions, resolveActiveFilters } from '../utils/stopFilters.js'

const EMPTY_FILTERS = { text: '', neighborhood: '', environmental: '', connectivity: '' }

/**
 * Estado dos filtros de pontos (Dashboard e Pontos) + resultados e opções.
 * A regra de filtragem fica em utils/stopFilters.js; aqui só há estado e memoização.
 * `now` vem de quem chama (Dashboard usa o mesmo instante da conectividade exibida).
 *
 * @param {Array<object>} items pontos simples ou itens do summarizeDashboard
 * @param {{ now?: Date|number, sendIntervalMs?: number }} [options]
 */
export function useStopFilters(items, { now, sendIntervalMs } = {}) {
  const [selected, setFilters] = useState(EMPTY_FILTERS)

  const setFilter = useCallback((name, value) => setFilters((current) => ({ ...current, [name]: value })), [])
  const clear = useCallback(() => setFilters(EMPTY_FILTERS), [])

  const options = useMemo(() => getStopFilterOptions(items, { now, sendIntervalMs }), [items, now, sendIntervalMs])
  // Valor selecionado que sumiu das opções deixa de filtrar (derivado, sem efeito).
  const filters = useMemo(() => resolveActiveFilters(selected, options), [selected, options])
  const results = useMemo(() => filterStops(items, filters, { now, sendIntervalMs }), [items, filters, now, sendIntervalMs])
  const hasActiveFilters = Object.values(filters).some((value) => value.trim() !== '')

  return { filters, setFilter, clear, options, results, total: items.length, hasActiveFilters }
}
