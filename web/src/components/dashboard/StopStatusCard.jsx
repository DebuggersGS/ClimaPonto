import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import Card from '../ui/Card.jsx'
import ConnectivityBadge from '../ui/ConnectivityBadge.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import EnvironmentalStatusBadge from '../ui/EnvironmentalStatusBadge.jsx'
import { IconDroplet, IconThermometer } from '../ui/icons.jsx'
import ReadingSourceBadge from '../ui/ReadingSourceBadge.jsx'
import StopHistoryLink from '../ui/StopHistoryLink.jsx'
import { formatDateTimeWithZone, formatHumidity, formatRelativeAge, formatTemperature } from '../../utils/formatters.js'

function Measure({ Icon, label, text }) {
  const unavailable = text === '—'
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-900/5">
      <dt className="flex items-center gap-1.5 text-sm text-slate-600">
        <Icon />
        {label}
      </dt>
      <dd className="mt-0.5 whitespace-nowrap text-xl font-semibold sm:text-2xl tabular-nums text-slate-900">
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
 * Cartão de um ponto no Dashboard. Ponto sem leitura mostra "Sem leituras", que é
 * diferente de "Não classificado" (leitura existente sem estado gravado).
 * @param {{ item: { stop: object, reading: object|null, connectivity: { status: string } }, now: Date|number }} props
 */
export default function StopStatusCard({ item, now }) {
  const { stop, reading, connectivity } = item
  return (
    <Card interactive className="flex h-full flex-col break-words [&>div]:flex-1">
      <div className="flex h-full flex-col">
        <header>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-sm text-slate-700">{stop.code}</p>
            {stop.isDemo && (
              <Badge tone="demo" icon="Sparkles" size="sm">
                Demonstrativo
              </Badge>
            )}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{stop.name}</h3>
          {stop.neighborhood && <p className="text-sm text-slate-600">{stop.neighborhood}</p>}
        </header>
        <div className="mt-4 flex-1">
          {reading ? (
            <ReadingDetails reading={reading} connectivity={connectivity} now={now} />
          ) : (
            <EmptyState
              title="Sem leituras"
              message="Sem dados: nenhuma leitura recebida deste ponto."
              className="px-4 py-6"
            />
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <Link
            to={`/pontos/${encodeURIComponent(stop.code)}`}
            aria-label={`Abrir ${stop.name} (${stop.code})`}
            className="group/link inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-brand-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-brand-200"
          >
            Abrir ponto
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-150 ease-out-soft motion-safe:group-hover/link:translate-x-0.5"
            />
          </Link>
          <StopHistoryLink code={stop.code}>Histórico</StopHistoryLink>
        </div>
      </div>
    </Card>
  )
}
