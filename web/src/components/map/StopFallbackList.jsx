import ConnectivityBadge from '../ui/ConnectivityBadge.jsx'
import EnvironmentalStatusBadge from '../ui/EnvironmentalStatusBadge.jsx'

/**
 * Lista acessível de pontos (alternativa ao canvas): um botão por ponto, com
 * estado ambiental e conectividade em texto.
 * @param {{ items: object[], selectedCode: string|null, onSelect: (code: string) => void, label: string }} props
 */
export default function StopFallbackList({ items, selectedCode, onSelect, label }) {
  return (
    <ul aria-label={label} className="grid gap-2 sm:grid-cols-2">
      {items.map(({ stop, reading, connectivity }) => (
        <li key={stop.id} className="min-w-0">
          <button
            type="button"
            aria-current={stop.code === selectedCode ? 'true' : undefined}
            onClick={() => onSelect(stop.code)}
            className="flex min-h-11 w-full flex-col items-start gap-1.5 rounded-xl bg-surface px-3 py-2 text-left text-sm ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-600 aria-[current=true]:ring-2 aria-[current=true]:ring-brand-700"
          >
            <span className="font-medium break-words text-slate-900">
              {stop.name} <span className="font-mono text-xs text-slate-700">({stop.code})</span>
            </span>
            <span className="flex flex-wrap gap-1.5">
              {reading && <EnvironmentalStatusBadge status={reading.environmentalStatus} size="sm" />}
              <ConnectivityBadge status={connectivity.status} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
