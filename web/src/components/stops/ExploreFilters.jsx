import { SlidersHorizontal, Star } from 'lucide-react'
import { useId, useState } from 'react'
import { shouldShowFilter } from '../../utils/stopFilters.js'
import Button from '../ui/Button.jsx'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '../ui/Popover.jsx'
import SearchField from '../ui/SearchField.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'

const pointsText = (count) => (count === 1 ? '1 ponto' : `${count} pontos`)
const withCount = (option) => ({ value: option.value, label: `${option.label} (${option.count})` })
const activeText = (count) => (count === 1 ? '1 filtro ativo' : `${count} filtros ativos`)

function FilterGroup({ title, children }) {
  return (
    <div>
      <p aria-hidden="true" className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
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
 * Filtros do Explorar em uma linha que quebra bem em telas estreitas: busca,
 * grupos essenciais (estado e conectividade), "Mais filtros", contagem e Limpar.
 * @param {{ filter: ReturnType<import('../../hooks/useStopFilters.js').useStopFilters> }} props
 */
export default function ExploreFilters({ filter }) {
  const { filters, setFilter, clear, options, results, total, hasActiveFilters, activeCount } = filter
  // Rascunho local: a URL guarda o texto sem espaços nas pontas, mas quem digita precisa deles.
  const [draft, setDraft] = useState(filters.text)
  const shownText = draft.trim() === filters.text ? draft : filters.text

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <SearchField
          label="Buscar pontos"
          hideLabel
          placeholder="Buscar por nome, código ou bairro"
          value={shownText}
          onValueChange={(value) => {
            setDraft(value)
            setFilter('text', value)
          }}
          className="w-full sm:w-80"
        />
        {['environmental', 'connectivity']
          .filter((name) => shouldShowFilter(name, options, filters))
          .map((name) => (
            <FilterGroup key={name} title={name === 'environmental' ? 'Estado ambiental' : 'Conectividade'}>
              <SegmentedControl
                label={name === 'environmental' ? 'Filtrar por estado ambiental' : 'Filtrar por conectividade'}
                value={filters[name]}
                onChange={(value) => setFilter(name, value)}
                options={[{ value: '', label: 'Todos' }, ...options[name].map(withCount)]}
              />
            </FilterGroup>
          ))}
        <MoreFilters filter={filter} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <p role="status" aria-live="polite" aria-atomic="true" className="text-sm font-medium text-slate-700">
          Mostrando {results.length} de {pointsText(total)}
          {hasActiveFilters && ` · ${activeText(activeCount)}`}
        </p>
        {hasActiveFilters && (
          <Button variant="secondary" size="sm" onClick={clear}>
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
