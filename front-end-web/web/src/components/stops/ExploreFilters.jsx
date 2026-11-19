import { SlidersHorizontal, Star } from 'lucide-react'
import { useId, useState } from 'react'
import { createSearchDraft, reconcileSearchDraft, recordTyping } from '../../utils/searchDraft.js'
import { normalizeFilterText } from '../../utils/stopFilterParams.js'
import { shouldShowFilter } from '../../utils/stopFilters.js'
import Button from '../ui/Button.jsx'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '../ui/Popover.jsx'
import SearchField from '../ui/SearchField.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'

const pointsText = (count) => (count === 1 ? '1 ponto' : `${count} pontos`)
const withCount = (option) => ({ value: option.value, label: `${option.label} (${option.count})` })

function FilterGroup({ title, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <p aria-hidden="true" className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:w-32">
        {title}
      </p>
      {children}
    </div>
  )
}

function NeighborhoodSelect({ options, value, onChange }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-800">
        Bairro
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block min-h-11 w-full rounded-md border border-slate-300 bg-surface px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        <option value="">Todos os bairros</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} ({option.count})
          </option>
        ))}
      </select>
    </div>
  )
}

function MoreFilters({ filter }) {
  const { filters, setFilter, options } = filter
  const moreCount = (filters.neighborhood ? 1 : 0) + (filters.favoritesOnly ? 1 : 0)
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="secondary" size="sm" />}>
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
        Mais filtros
        {moreCount > 0 && (
          <span className="rounded-full bg-brand-700 px-1.5 text-xs font-semibold text-white">
            {moreCount}
            <span className="sr-only"> ativos</span>
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-3">
        <PopoverTitle className="text-base font-semibold text-slate-900">Mais filtros</PopoverTitle>
        {shouldShowFilter('neighborhood', options, filters) && (
          <NeighborhoodSelect options={options.neighborhoods} value={filters.neighborhood} onChange={(value) => setFilter('neighborhood', value)} />
        )}
        <Button
          variant={filters.favoritesOnly ? 'primary' : 'secondary'}
          size="sm"
          aria-pressed={filters.favoritesOnly}
          onClick={() => setFilter('favoritesOnly', !filters.favoritesOnly)}
        >
          <Star aria-hidden="true" className="h-4 w-4" fill={filters.favoritesOnly ? 'currentColor' : 'none'} />
          Somente favoritos
        </Button>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Barra de filtros do Explorar num único bloco alinhado: busca + vista + "Mais filtros" na 1ª linha,
 * grupos essenciais (estado e conectividade) com rótulo à esquerda, depois contagem e Limpar.
 * @param {{ filter: ReturnType<import('../../hooks/useStopFilters.js').useStopFilters>, viewControl?: import('react').ReactNode }} props
 */
export default function ExploreFilters({ filter, viewControl }) {
  const { filters, setFilter, clear, options, results, total, hasActiveFilters } = filter
  // O campo mostra sempre o rascunho; a URL (atrasada) só o substitui quando muda por fora (utils/searchDraft.js).
  const [search, setSearch] = useState(() => createSearchDraft(filters.text))
  const reconciled = reconcileSearchDraft(search, filters.text)
  if (reconciled) setSearch(reconciled)
  const shownText = (reconciled ?? search).draft
  const groups = ['environmental', 'connectivity'].filter((name) => shouldShowFilter(name, options, filters))

  return (
    <div className="mb-5 rounded-card bg-surface/80 p-3 shadow-xs ring-1 ring-slate-900/10 sm:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          label="Buscar pontos"
          hideLabel
          placeholder="Buscar por nome, código ou bairro"
          value={shownText}
          onValueChange={(value) => {
            setSearch((current) => recordTyping(current, value, normalizeFilterText))
            setFilter('text', value)
          }}
          className="min-w-0 flex-1 basis-full sm:basis-72"
        />
        <div className="flex flex-wrap items-center gap-2">
          {viewControl}
          <MoreFilters filter={filter} />
        </div>
      </div>
      {groups.length > 0 && (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-900/5 pt-3">
          {groups.map((name) => (
            <FilterGroup key={name} title={name === 'environmental' ? 'Estado ambiental' : 'Conectividade'}>
              <SegmentedControl
                label={name === 'environmental' ? 'Filtrar por estado ambiental' : 'Filtrar por conectividade'}
                value={filters[name]}
                onChange={(value) => setFilter(name, value)}
                options={[{ value: '', label: 'Todos' }, ...options[name].map(withCount)]}
              />
            </FilterGroup>
          ))}
        </div>
      )}
      <div className="mt-3 flex min-h-10 flex-wrap items-center gap-3">
        <p role="status" aria-live="polite" aria-atomic="true" className="text-sm font-medium text-slate-700">
          Mostrando {results.length} de {pointsText(total)}
        </p>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clear}>
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
