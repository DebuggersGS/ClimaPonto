import { Lightbulb } from 'lucide-react'
import Card from '../ui/Card.jsx'

/**
 * Lista de insights com o texto do resultado e a explicação de como foi calculado
 * (sempre visível, para leitores de tela e para quem navega por teclado).
 * @param {{ insights: Array<{ id: string, title: string, text: string, explanation: string }> }} props
 */
export default function InsightsPanel({ insights }) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
      {insights.map((insight) => (
        <li key={insight.id} className="min-w-0">
          <Card className="h-full">
            <h3 className="flex items-start gap-2 text-base font-semibold text-slate-900">
              <Lightbulb aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-200" />
              <span className="min-w-0 break-words">{insight.title}</span>
            </h3>
            <p className="mt-2 break-words text-slate-800">{insight.text}</p>
            <p className="mt-2 break-words text-sm text-slate-600">
              <span className="font-medium">Como foi calculado: </span>
              {insight.explanation}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  )
}
