import { useEffect, useRef, useState } from 'react'
import { formatDateTimeWithZone, formatHumidity, formatTemperature } from '../../utils/formatters.js'
import Button from '../ui/Button.jsx'
import EnvironmentalStatusBadge from '../ui/EnvironmentalStatusBadge.jsx'
import ReadingSourceBadge from '../ui/ReadingSourceBadge.jsx'

const PAGE_SIZE = 50
const HEADER = 'px-3 py-2 text-left text-sm font-semibold text-slate-800'
const NUMERIC_HEADER = 'px-3 py-2 text-right text-sm font-semibold text-slate-800'

/**
 * Tabela de leituras (já em ordem decrescente) com paginação no cliente.
 * @param {{ readings: object[], caption: string }} props
 */
export default function ReadingsTable({ readings, caption }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const statusRef = useRef(null)
  const loadedMoreRef = useRef(false)
  const total = readings.length
  const shown = Math.min(visible, total)
  const hasMore = shown < total

  // O botão some ao exibir tudo; o foco vai para a região de status para não se perder.
  useEffect(() => {
    if (loadedMoreRef.current && !hasMore) statusRef.current?.focus()
  }, [hasMore])

  function showMore() {
    loadedMoreRef.current = true
    setVisible((current) => current + PAGE_SIZE)
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <caption className="px-3 py-2 text-left text-sm font-medium text-slate-800">{caption}</caption>
          <thead className="border-y border-slate-200 bg-slate-50">
            <tr>
              <th scope="col" className={HEADER}>Data e hora</th>
              <th scope="col" className={NUMERIC_HEADER}>Temperatura</th>
              <th scope="col" className={NUMERIC_HEADER}>Umidade</th>
              <th scope="col" className={HEADER}>Origem</th>
              <th scope="col" className={HEADER}>Estado ambiental</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {readings.slice(0, shown).map((reading) => (
              <tr key={reading.id}>
                <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                  <time dateTime={reading.measuredAt}>{formatDateTimeWithZone(reading.measuredAt)}</time>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-900">
                  {formatTemperature(reading.temperatureC)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-900">
                  {formatHumidity(reading.humidityPct)}
                </td>
                <td className="px-3 py-2"><ReadingSourceBadge source={reading.source} /></td>
                <td className="px-3 py-2"><EnvironmentalStatusBadge status={reading.environmentalStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p ref={statusRef} role="status" tabIndex={-1} className="text-sm text-slate-600 focus-visible:outline-2 focus-visible:outline-brand-600">
          Exibindo {shown} de {total}
        </p>
        {hasMore && (
          <Button variant="secondary" onClick={showMore}>
            Mostrar mais
          </Button>
        )}
      </div>
    </div>
  )
}
