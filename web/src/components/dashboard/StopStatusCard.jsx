import Card from '../ui/Card.jsx'
import ConnectivityBadge from '../ui/ConnectivityBadge.jsx'
import EnvironmentalStatusBadge from '../ui/EnvironmentalStatusBadge.jsx'
import { IconDroplet, IconSignalOff, IconThermometer } from '../ui/icons.jsx'
import ReadingSourceBadge from '../ui/ReadingSourceBadge.jsx'
import StopHistoryLink from '../ui/StopHistoryLink.jsx'
import { formatDateTimeWithZone, formatHumidity, formatRelativeAge, formatTemperature } from '../../utils/formatters.js'

function Measure({ Icon, label, text }) {
  const unavailable = text === '—'
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-sm text-slate-600">
        <Icon />
        {label}
      </dt>
      <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">
        {text}
        {unavailable && <span className="sr-only"> indisponível</span>}
      </dd>
    </div>
  )
}

function ReadingDetails({ reading, connectivity, now }) {
  const age = formatRelativeAge(reading.measuredAt, now)
  return (
    <>
      <dl className="grid grid-cols-2 gap-3">
        <Measure Icon={IconThermometer} label="Temperatura" text={formatTemperature(reading.temperatureC)} />
        <Measure Icon={IconDroplet} label="Umidade" text={formatHumidity(reading.humidityPct)} />
      </dl>
      <p className="mt-3 text-sm text-slate-600">
        Medido em{' '}
        <time dateTime={reading.measuredAt} className="font-medium text-slate-800">
          {formatDateTimeWithZone(reading.measuredAt)}
        </time>{' '}
        ({age})
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <EnvironmentalStatusBadge status={reading.environmentalStatus} />
        <ConnectivityBadge status={connectivity.status} ageText={age} />
        <ReadingSourceBadge source={reading.source} />
      </div>
    </>
  )
}

/**
 * Cartão de um ponto no Dashboard. Ponto sem leitura mostra "Sem dados", que é
 * diferente de "Não classificado" (leitura existente sem estado gravado).
 * @param {{ item: { stop: object, reading: object|null, connectivity: { status: string } }, now: Date|number }} props
 */
export default function StopStatusCard({ item, now }) {
  const { stop, reading, connectivity } = item
  return (
    <Card title={stop.name} headingLevel={3} className="flex h-full flex-col break-words">
      <p className="font-mono text-sm text-slate-700">{stop.code}</p>
      {stop.neighborhood && <p className="mt-0.5 text-sm text-slate-600">{stop.neighborhood}</p>}
      {stop.isDemo && (
        <p className="mt-2">
          <span className="inline-flex rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
            Demonstrativo
          </span>
        </p>
      )}
      <div className="mt-3 flex-1">
        {reading ? (
          <ReadingDetails reading={reading} connectivity={connectivity} now={now} />
        ) : (
          <p className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-sm font-medium text-slate-700">
            <IconSignalOff />
            Sem dados: nenhuma leitura recebida
          </p>
        )}
      </div>
      <div className="mt-3 border-t border-slate-100 pt-2">
        <StopHistoryLink code={stop.code} />
      </div>
    </Card>
  )
}
