import { useId, useState } from 'react'
import { ChevronDown, Lightbulb } from 'lucide-react'
import Card from '../ui/Card.jsx'
import { cn } from '../../utils/cn.js'

/** Primeiro cartão ocupa a largura toda; os demais dividem a grade, formando o Bento compacto. */
const CARD_SPANS = ['col-span-2', 'col-span-1', 'col-span-1', 'col-span-2 sm:col-span-1', 'col-span-2 sm:col-span-2']

function InsightCard({ insight, index }) {
  return (
    <li className={cn('min-w-0', CARD_SPANS[index] ?? 'col-span-1')}>
      <Card className="h-full !p-3 sm:!p-4">
        <h3 className="flex items-start gap-1.5 text-sm font-semibold text-slate-900">
          <Lightbulb aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700 dark:text-brand-200" />
          <span className="min-w-0 break-words">{insight.title}</span>
        </h3>
        <p className="mt-1.5 break-words text-2xl font-semibold leading-tight text-slate-900">{insight.value}</p>
        <p className="break-words text-xs text-slate-600">{insight.label}</p>
      </Card>
    </li>
  )
}

function Methodology({ insights }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-200 dark:hover:bg-white/10"
      >
        Como foi calculado
        <ChevronDown aria-hidden="true" className={cn('h-4 w-4', open && 'rotate-180')} />
      </button>
      {open && (
        <ul id={panelId} className="mt-2 space-y-3 text-sm text-slate-600">
          {insights.map((insight) => (
            <li key={insight.id} className="min-w-0 break-words">
              <p className="font-medium text-slate-900">{insight.title}</p>
              <p className="mt-0.5 text-slate-800">{insight.text}</p>
              <p className="mt-0.5">{insight.explanation}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Insights em Bento compacto: cada cartão mostra só o destaque (valor e rótulo).
 * Resultado completo e metodologia ficam em "Como foi calculado", recolhido por padrão.
 * @param {{ insights: Array<{ id: string, title: string, text: string, explanation: string, value: string, label: string }> }} props
 */
export default function InsightsPanel({ insights }) {
  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:gap-3">
        {insights.map((insight, index) => (
          <InsightCard key={insight.id} insight={insight} index={index} />
        ))}
      </ul>
      <Methodology insights={insights} />
    </>
  )
}
