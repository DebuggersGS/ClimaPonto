import { ChevronDown, MapPin } from 'lucide-react'

/**
 * Seletor de ponto monitorado (select nativo rotulado); value é o code do ponto.
 * @param {{ stops: Array<{ code: string, name: string }>, value: string, onChange: (code: string) => void, id: string, label?: string }} props
 */
export default function StopSelect({ stops, value, onChange, id, label = 'Ponto monitorado' }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <MapPin aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700 dark:text-brand-200" />
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 w-full appearance-none truncate rounded-full border border-slate-300 bg-surface py-2 pl-9 pr-10 text-sm text-slate-900 shadow-card transition-colors hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <option value="">Selecione um ponto</option>
          {stops.map((stop) => (
            <option key={stop.code} value={stop.code}>
              {stop.code} — {stop.name}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
      </div>
    </div>
  )
}
