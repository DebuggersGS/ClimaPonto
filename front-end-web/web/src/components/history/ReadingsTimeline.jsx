import { useMemo } from 'react'
import { formatDateTimeWithZone } from '../../utils/formatters.js'
import { buildReadingsTimeline } from '../../utils/readingsTimeline.js'

const TYPE_LABELS = { first: 'Início', last: 'Fim', status_change: 'Mudança de estado', gap: 'Lacuna' }

/**
 * Linha do tempo textual derivada das leituras carregadas, em ordem cronológica.
 * @param {{ readings: object[] }} props
 */
export default function ReadingsTimeline({ readings }) {
  const { events, truncated } = useMemo(() => buildReadingsTimeline(readings), [readings])
  if (events.length === 0) return <p>Nenhuma leitura para montar a linha do tempo.</p>
  return (
    <div>
      {truncated && <p className="mb-2">Linha do tempo resumida: eventos intermediários mais antigos foram omitidos.</p>}
      <ol className="space-y-2">
        {events.map((event, index) => (
          <li key={`${event.type}-${event.readingId}-${index}`} className="break-words">
            <span className="font-semibold text-slate-900">{TYPE_LABELS[event.type]}</span> · {formatDateTimeWithZone(event.atMs)}
            <br />
            {event.text}
          </li>
        ))}
      </ol>
    </div>
  )
}
