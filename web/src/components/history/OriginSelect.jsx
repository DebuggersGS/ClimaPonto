import { ChevronDown, Radio } from 'lucide-react'
import { ALL_ORIGINS } from '../../utils/historyExploration.js'
import { getReadingSourceInfo } from '../../utils/readings.js'

/**
 * Filtro de origem das leituras (select nativo rotulado). Mantém a origem
 * escolhida na lista mesmo que o período atual não tenha leituras dela.
 * @param {{ options: Array<{ value: string, label: string }>, value: string, onChange: (value: string) => void, id: string }} props
 */
export default function OriginSelect({ options, value, onChange, id }) {
  const list = options.some((option) => option.value === value)
    ? options
    : [...options, { value, label: getReadingSourceInfo(value).label }]
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        Origem dos dados
      </label>
      <div className="relative">
        <Radio aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700 dark:text-brand-200" />
        <select
          id={id}
          value={value ?? ALL_ORIGINS}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 w-full appearance-none truncate rounded-full border border-slate-300 bg-surface py-2 pl-9 pr-10 text-sm text-slate-900 shadow-card transition-colors hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {list.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 text-slate-600" />
      </div>
    </div>
  )
}
