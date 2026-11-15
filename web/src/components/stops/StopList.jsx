import { MapPin } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import Card from '../ui/Card.jsx'
import ConnectivityBadge from '../ui/ConnectivityBadge.jsx'
import EnvironmentalStatusBadge from '../ui/EnvironmentalStatusBadge.jsx'
import { AnimatedItem, AnimatedList } from '../ui/Reveal.jsx'
import StopHistoryLink from '../ui/StopHistoryLink.jsx'
import FavoriteButton from './FavoriteButton.jsx'

function StopCard({ item, favorite, onToggleFavorite, onSelect }) {
  const { stop, reading, connectivity } = item
  return (
    <Card interactive className="h-full">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/40 dark:text-brand-200 dark:ring-brand-800"
        >
          <MapPin className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold break-words text-slate-900">{stop.name}</h2>
          <span className="mt-1 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
            {stop.code}
          </span>
        </div>
      </div>
      <p className="mt-3 font-medium text-slate-800">{stop.neighborhood}</p>
      {stop.description && <p className="mt-1 break-words text-slate-600">{stop.description}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {reading && <EnvironmentalStatusBadge status={reading.environmentalStatus} size="sm" />}
        <ConnectivityBadge status={connectivity.status} />
        {stop.isDemo && (
          <Badge tone="demo" icon="Sparkles" size="sm">
            Demonstrativo
          </Badge>
        )}
        {stop.active === false && (
          <Badge tone="neutral" size="sm">
            Inativo
          </Badge>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
        <button
          type="button"
          onClick={() => onSelect(stop.code)}
          className="inline-flex min-h-10 items-center rounded-md px-2 text-sm font-medium text-brand-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-brand-200"
        >
          Ver ficha<span className="sr-only"> de {stop.name}</span>
        </button>
        <StopHistoryLink code={stop.code} />
        <FavoriteButton name={stop.name} pressed={favorite(stop.code)} onToggle={() => onToggleFavorite(stop.code)} />
      </div>
    </Card>
  )
}

/**
 * Lista alternativa ao mapa: cartões com selos, ficha, histórico e favorito.
 * @param {{ items: object[], isFavorite: (code: string) => boolean, onToggleFavorite: (code: string) => void, onSelect: (code: string) => void }} props
 */
export default function StopList({ items, isFavorite, onToggleFavorite, onSelect }) {
  return (
    <AnimatedList as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <AnimatedItem as="li" key={item.stop.id}>
          <StopCard item={item} favorite={isFavorite} onToggleFavorite={onToggleFavorite} onSelect={onSelect} />
        </AnimatedItem>
      ))}
    </AnimatedList>
  )
}
