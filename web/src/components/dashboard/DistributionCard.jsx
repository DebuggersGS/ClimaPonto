import Badge from '../ui/Badge.jsx'
import Card from '../ui/Card.jsx'
import { getToneClasses } from '../ui/tones.js'
import { cn } from '../../utils/cn.js'

/**
 * Distribuição de pontos por estado: barra segmentada (decorativa) + chips com
 * ícone, texto e contagem. A barra é só reforço visual; os chips carregam a informação.
 * @param {{ title: string, note: string, reference: string, keys: string[], counts: Record<string, number>,
 *   getPresentation: (key: string) => { label: string, tone: string, icon: string } }} props
 */
export default function DistributionCard({ title, note, reference, keys, counts, getPresentation }) {
  const total = keys.reduce((sum, key) => sum + counts[key], 0)
  return (
    <Card title={title} headingLevel={3} className="min-w-0">
      <p>{note}</p>
      <div
        aria-hidden="true"
        className="mt-4 flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-900/5"
      >
        {total > 0 &&
          keys
            .filter((key) => counts[key] > 0)
            .map((key) => (
              <span
                key={key}
                // flex-grow proporcional à contagem: sem cálculo de porcentagem nem largura fixa.
                style={{ flexGrow: counts[key], flexBasis: 0 }}
                className={cn('min-w-1 transition-[flex-grow] duration-500', getToneClasses(getPresentation(key).tone).dot)}
              />
            ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {keys.map((key) => {
          const info = getPresentation(key)
          return (
            <li key={key} className={counts[key] === 0 ? 'opacity-80' : undefined}>
              <Badge tone={info.tone} icon={info.icon}>
                {info.label}
                <span className="font-semibold tabular-nums">{counts[key]}</span>
              </Badge>
            </li>
          )
        })}
      </ul>
      <p className="mt-3">{reference}</p>
    </Card>
  )
}
