import { useId } from 'react'
import { cn } from '../../utils/cn.js'

/**
 * Seção de página com eyebrow, título (h2), descrição e ações opcionais.
 * @param {{ title: string, eyebrow?: string, description?: string, actions?: import('react').ReactNode, className?: string, children?: import('react').ReactNode }} props
 */
export default function Section({ title, eyebrow, description, actions, className, children }) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className={cn('mb-section', className)}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-700">{eyebrow}</p>
          )}
          <h2 id={titleId} className="text-xl font-semibold text-slate-900">
            {title}
          </h2>
          {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  )
}
