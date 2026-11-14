import { useEffect, useRef, useState } from 'react'
import { formatDateTimeWithZone, formatHumidity, formatTemperature } from '../../utils/formatters.js'
import Button from '../ui/Button.jsx'
import EnvironmentalStatusBadge from '../ui/EnvironmentalStatusBadge.jsx'
import ReadingSourceBadge from '../ui/ReadingSourceBadge.jsx'

const PAGE_SIZE = 50
const HEADER = 'sticky top-0 z-10 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-[inset_0_-1px_0_rgb(226_232_240)]'
const NUMERIC_HEADER = `${HEADER} text-right`

function DesktopTable({ readings, caption }) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Tabela de leituras (com rolagem)"
      className="relative hidden max-h-[32rem] overflow-auto rounded-card bg-surface shadow-card ring-1 ring-slate-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 md:block"
    >
      <table className="min-w-full text-sm">
        <caption className="px-4 py-3 text-left text-sm font-medium text-slate-800">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={HEADER}>Data e hora</th>
            <th scope="col" className={NUMERIC_HEADER}>Temperatura</th>
            <th scope="col" className={NUMERIC_HEADER}>Umidade</th>
            <th scope="col" className={HEADER}>Origem</th>
            <th scope="col" className={HEADER}>Estado ambiental</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((reading) => (
            <tr key={reading.id} className="even:bg-slate-50/70">
              <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-slate-800">
                <time dateTime={reading.measuredAt}>{formatDateTimeWithZone(reading.measuredAt)}</time>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums font-medium text-slate-900">
                {formatTemperature(reading.temperatureC)}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums font-medium text-slate-900">
                {formatHumidity(reading.humidityPct)}
              </td>
              <td className="px-4 py-2.5"><ReadingSourceBadge source={reading.source} /></td>
              <td className="px-4 py-2.5"><EnvironmentalStatusBadge status={reading.environmentalStatus} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// No celular cada leitura vira um cartão, sem rolagem horizontal.
function MobileList({ readings, caption }) {
  return (
    <div className="md:hidden">
      <p className="mb-2 text-sm font-medium text-slate-800">{caption}</p>
      <ul className="space-y-2">
        {readings.map((reading) => (
          <li key={reading.id} className="rounded-card bg-surface p-4 shadow-card ring-1 ring-slate-900/5">
            <time dateTime={reading.measuredAt} className="text-sm font-medium tabular-nums text-slate-800">
              {formatDateTimeWithZone(reading.measuredAt)}
            </time>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-slate-600">Temperatura</dt>
                <dd className="whitespace-nowrap text-lg font-semibold tabular-nums text-slate-900">{formatTemperature(reading.temperatureC)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-600">Umidade</dt>
                <dd className="whitespace-nowrap text-lg font-semibold tabular-nums text-slate-900">{formatHumidity(reading.humidityPct)}</dd>
              </div>
            </dl>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <ReadingSourceBadge source={reading.source} />
              <EnvironmentalStatusBadge status={reading.environmentalStatus} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Leituras (já em ordem decrescente) com paginação no cliente: tabela no
 * desktop e lista de cartões no celular.
 * @param {{ readings: object[], caption: string }} props
 */
export default function ReadingsTable({ readings, caption }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const statusRef = useRef(null)
  const loadedMoreRef = useRef(false)
  const total = readings.length
  const shown = Math.min(visible, total)
  const hasMore = shown < total
  const page = readings.slice(0, shown)

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
      <DesktopTable readings={page} caption={caption} />
      <MobileList readings={page} caption={caption} />
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
