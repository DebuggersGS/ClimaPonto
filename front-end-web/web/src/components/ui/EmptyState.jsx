import { cva } from 'class-variance-authority'
import { CircleX, Info, Inbox, TriangleAlert } from 'lucide-react'
import { cn } from '../../utils/cn.js'

const medallion = cva('flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-inset', {
  variants: {
    variant: {
      neutral: 'bg-linear-to-br from-slate-100 to-slate-200 text-slate-700 ring-slate-300/60',
      info: 'bg-linear-to-br from-sky-50 to-cyan-100 text-sky-800 ring-sky-300/60',
      warning: 'bg-linear-to-br from-amber-50 to-amber-100 text-amber-900 ring-amber-300/60',
      error: 'bg-linear-to-br from-red-50 to-rose-100 text-red-800 ring-red-300/60',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

const ICONS = { neutral: Inbox, info: Info, warning: TriangleAlert, error: CircleX }

/**
 * Estado vazio/indisponível: medalhão com ícone, título, texto e ação opcional.
 * Com variant="error" vira região `role="alert"` (anunciada por leitores de tela);
 * `role` explícito sobrepõe esse padrão.
 * @param {{ title: string, message?: string, variant?: 'neutral'|'info'|'warning'|'error', action?: import('react').ReactNode, role?: string, className?: string }} props
 */
export default function EmptyState({ title, message, variant = 'neutral', action, role, className }) {
  const Icon = ICONS[variant] ?? Inbox
  return (
    <div
      role={role ?? (variant === 'error' ? 'alert' : undefined)}
      className={cn(
        'flex flex-col items-center rounded-card border border-dashed border-slate-300 bg-surface/70 px-6 py-10 text-center',
        className,
      )}
    >
      <span aria-hidden="true" className={medallion({ variant })}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-semibold text-slate-900">{title}</p>
      {message && <p className="mt-1 max-w-md text-sm text-slate-600">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
