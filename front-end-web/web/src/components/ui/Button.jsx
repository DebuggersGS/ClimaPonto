import { cva } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import { cn } from '../../utils/cn.js'

const button = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,box-shadow,transform,color] duration-150 ease-out-soft motion-safe:active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:
          'bg-linear-to-b from-brand-600 to-brand-700 text-white shadow-card hover:from-brand-700 hover:to-brand-800 disabled:from-brand-600/60 disabled:to-brand-700/60 disabled:shadow-none',
        secondary:
          'bg-surface text-slate-800 shadow-xs ring-1 ring-slate-300 hover:bg-slate-50 disabled:text-slate-500 disabled:shadow-none',
        danger: 'bg-red-700 text-white shadow-card hover:bg-red-800 disabled:bg-red-700/60 disabled:shadow-none',
        ghost: 'text-slate-700 hover:bg-slate-900/5 disabled:text-slate-500',
        subtle: 'bg-brand-50 text-brand-800 hover:bg-brand-100 dark:bg-brand-900/40 dark:text-brand-200 dark:hover:bg-brand-900/70 disabled:text-slate-500 disabled:bg-slate-100',
      },
      size: {
        sm: 'min-h-10 rounded-full px-3.5 py-1.5 text-sm',
        md: 'min-h-10 rounded-full px-4 py-2 text-sm',
        lg: 'min-h-12 rounded-full px-6 py-2.5 text-base',
        // Só ícone: alvo de toque quadrado de 40 px; exige aria-label.
        icon: 'h-10 w-10 rounded-full p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

/**
 * Botão padrão. Altura mínima de 40 px para toque; `loading` mostra spinner,
 * bloqueia o clique e marca aria-busy (o rótulo continua visível).
 * @param {{ variant?: 'primary'|'secondary'|'danger'|'ghost'|'subtle', size?: 'sm'|'md'|'lg'|'icon', loading?: boolean }} props
 */
export default function Button({
  variant,
  size,
  type = 'button',
  loading = false,
  disabled,
  className,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(button({ variant, size }), className)}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin-slow" />}
      {children}
    </button>
  )
}
