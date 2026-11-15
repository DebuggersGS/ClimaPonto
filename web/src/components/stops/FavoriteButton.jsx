import { Star } from 'lucide-react'
import { cn } from '../../utils/cn.js'

/**
 * Botão alternável de favorito: aria-pressed + texto + estrela cheia/vazia
 * (o estado nunca depende só da cor).
 * @param {{ name: string, pressed: boolean, onToggle: () => void, className?: string }} props
 */
export default function FavoriteButton({ name, pressed, onToggle, className }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={`Favorito: ${name}`}
      onClick={onToggle}
      className={cn(
        'inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium ring-1 ring-inset ring-slate-300 hover:bg-slate-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        pressed ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200' : 'bg-surface text-slate-800',
        className,
      )}
    >
      <Star aria-hidden="true" className="h-4 w-4" fill={pressed ? 'currentColor' : 'none'} />
      {pressed ? 'Favorito (marcado)' : 'Favorito'}
    </button>
  )
}
