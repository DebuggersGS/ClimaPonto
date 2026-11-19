import { useState } from 'react'
import { cn } from '../../utils/cn.js'

const HEADINGS = { 2: 'h2', 3: 'h3' }

/**
 * Cartão de métrica. Valor '—' indica indisponível e ganha texto para leitores de tela.
 * Quando o valor muda, ele recebe um realce discreto (desligado com movimento reduzido).
 * @param {{ label: string, value: string, unit?: string, icon?: import('react').ElementType, description?: string, delta?: string, headingLevel?: 2|3, className?: string }} props
 */
export default function MetricCard({ label, value, unit, icon: Icon, description, delta, headingLevel = 3, className }) {
  const Heading = HEADINGS[headingLevel] ?? 'h3'
  const unavailable = value === '—'

  // Padrão "derivar estado durante a renderização": detecta mudança sem efeito.
  const [previous, setPrevious] = useState(value)
  const [changes, setChanges] = useState(0)
  if (previous !== value) {
    setPrevious(value)
    setChanges((count) => count + 1)
  }

  return (
    <section className={cn('rounded-card bg-surface p-5 shadow-card ring-1 ring-slate-900/5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Heading className="text-sm font-medium text-slate-600">{label}</Heading>
        {Icon && (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 flex items-baseline gap-1.5 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
        <span key={changes} className={cn('rounded-md', changes > 0 && 'metric-flash')}>
          {value}
          {unavailable && <span className="sr-only"> indisponível</span>}
        </span>
        {unit && !unavailable && <span className="text-base font-medium text-slate-600">{unit}</span>}
      </p>
      {delta && <p className="mt-1 text-sm font-medium text-slate-700 tabular-nums">{delta}</p>}
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    </section>
  )
}
