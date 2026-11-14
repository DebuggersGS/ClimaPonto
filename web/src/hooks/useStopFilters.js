import { useCallback, useMemo, useState } from 'react'
import { filterStops, getStopFilterOptions } from '../utils/stopFilters.js'

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
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const setFilter = useCallback((name, value) => setFilters((current) => ({ ...current, [name]: value })), [])
  const clear = useCallback(() => setFilters(EMPTY_FILTERS), [])

  const options = useMemo(() => getStopFilterOptions(items, { now, sendIntervalMs }), [items, now, sendIntervalMs])
  const results = useMemo(() => filterStops(items, filters, { now, sendIntervalMs }), [items, filters, now, sendIntervalMs])
  const hasActiveFilters = Object.values(filters).some((value) => value.trim() !== '')

  return { filters, setFilter, clear, options, results, total: items.length, hasActiveFilters }
}
