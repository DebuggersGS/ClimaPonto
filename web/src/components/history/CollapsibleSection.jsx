import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Seção recolhida por padrão (botão com aria-expanded dentro de um h3).
 * O conteúdo só é montado quando aberto, evitando cálculo desnecessário.
 * @param {{ title: string, children: import('react').ReactNode }} props
 */
export default function CollapsibleSection({ title, children }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <section className="rounded-card bg-surface p-3 shadow-card ring-1 ring-slate-900/5">
      <h3 className="text-base font-semibold text-slate-900">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {title}
          <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="px-2 pb-2 pt-3 text-sm text-slate-700">
        {open && children}
      </div>
    </section>
  )
}
