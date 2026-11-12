/**
 * Cabeçalho de página (h1). `eyebrow` e `actions` são opcionais.
 * @param {{ title: string, description?: string, eyebrow?: string, actions?: import('react').ReactNode }} props
 */
export default function PageHeader({ title, description, eyebrow, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-700">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-base text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
