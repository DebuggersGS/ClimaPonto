import { useId } from 'react'
import Button from './Button.jsx'
import SegmentedControl from './SegmentedControl.jsx'
import TextField from './TextField.jsx'

const SEGMENTED = {
  environmental: 'Filtrar por estado ambiental',
  connectivity: 'Filtrar por conectividade',
}

const pointsText = (count) => (count === 1 ? '1 ponto' : `${count} pontos`)

/** Rótulo com contagem presente nos dados, ex.: "Normal (5)". */
const withCount = (option) => ({ value: option.value, label: `${option.label} (${option.count})` })

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
        className="block min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-2 focus-visible:outline-brand-600"
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

/**
 * Barra de busca e filtros de pontos. Cada filtro só aparece quando há ao menos
 * 2 valores distintos nos dados; só oferece valores presentes, com contagem.
 * O total ("Mostrando X de Y pontos") fica numa região aria-live.
 * @param {{ filter: ReturnType<import('../../hooks/useStopFilters.js').useStopFilters>, dimensions: Array<'neighborhood'|'environmental'|'connectivity'> }} props
 */
export default function StopFilterBar({ filter, dimensions }) {
  const { filters, setFilter, clear, options, results, total, hasActiveFilters } = filter
  const visible = dimensions.filter((name) => options[name === 'neighborhood' ? 'neighborhoods' : name].length >= 2)

  return (
    <div className="mb-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          type="search"
          label="Buscar pontos"
          hint="Por nome, código ou bairro"
          value={filters.text}
          onChange={(event) => setFilter('text', event.target.value)}
          autoComplete="off"
          className="[&_input]:min-h-11"
        />
        {visible.includes('neighborhood') && (
          <NeighborhoodSelect
            options={options.neighborhoods}
            value={filters.neighborhood}
            onChange={(value) => setFilter('neighborhood', value)}
          />
        )}
      </div>

      {['environmental', 'connectivity']
        .filter((name) => visible.includes(name))
        .map((name) => (
          <SegmentedControl
            key={name}
            label={SEGMENTED[name]}
            value={filters[name]}
            onChange={(value) => setFilter(name, value)}
            options={[{ value: '', label: 'Todos' }, ...options[name].map(withCount)]}
          />
        ))}

      <div className="flex flex-wrap items-center gap-3">
        <p role="status" aria-live="polite" aria-atomic="true" className="text-sm font-medium text-slate-700">
          Mostrando {results.length} de {pointsText(total)}
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
