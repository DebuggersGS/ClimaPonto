import { cva } from 'class-variance-authority'
import { cn } from '../../utils/cn.js'

const card = cva('rounded-card p-5', {
  variants: {
    variant: {
      default: 'bg-surface shadow-card ring-1 ring-slate-900/5',
      glass: 'surface-glass',
      elevated: 'bg-surface shadow-elevated ring-1 ring-slate-900/5',
      // Destaque escuro: texto claro com contraste AA sobre o ink
      dark: 'bg-ink text-slate-100 shadow-elevated ring-1 ring-white/10',
      inset: 'bg-slate-50 ring-1 ring-inset ring-slate-900/5',
    },
    interactive: {
      true: 'transition-[transform,box-shadow] duration-250 ease-out-soft hover:-translate-y-0.5 hover:shadow-elevated',
      false: '',
    },
  },
  defaultVariants: { variant: 'default', interactive: false },
})

/**
 * Superfície base. Mantém a API anterior (title, headingLevel, className).
 * @param {{ title?: string, children?: import('react').ReactNode, className?: string, headingLevel?: 2|3, variant?: 'default'|'glass'|'elevated'|'dark'|'inset', interactive?: boolean }} props
 */
export default function Card({ title, children, className, headingLevel = 2, variant, interactive, ...props }) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  const isDark = variant === 'dark'
  return (
    <section className={cn(card({ variant, interactive: Boolean(interactive) }), className)} {...props}>
      {title && (
        <Heading className={cn('mb-2 text-base font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
          {title}
        </Heading>
      )}
      <div className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>{children}</div>
    </section>
  )
}
