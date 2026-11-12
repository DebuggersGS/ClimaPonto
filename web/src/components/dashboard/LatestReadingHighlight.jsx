import ConnectivityBadge from '../ui/ConnectivityBadge.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import EnvironmentalStatusBadge from '../ui/EnvironmentalStatusBadge.jsx'
import { IconDroplet, IconThermometer } from '../ui/icons.jsx'
import ReadingSourceBadge from '../ui/ReadingSourceBadge.jsx'
import { getConnectivity } from '../../utils/connectivity.js'
import { formatDateTimeWithZone, formatHumidity, formatRelativeAge, formatTemperature } from '../../utils/formatters.js'

function BigValue({ Icon, label, text }) {
  const unavailable = text === '—'
  return (
    <div>
      <p className="flex items-center gap-2 text-sm text-slate-600">
        <Icon className="h-5 w-5" />
        {label}
      </p>
      <p className="mt-1 text-4xl font-semibold tabular-nums text-slate-900">
        {text}
        {unavailable && <span className="sr-only"> indisponível</span>}
      </p>
    </div>
  )
}

/**
 * Destaque da leitura mais recente entre todos os pontos. Sem cor de estado no fundo.
 * @param {{ latest: { stop: object, reading: object }|null, now: Date|number }} props
 */
export default function LatestReadingHighlight({ latest, now }) {
  if (!latest) {
    return (
      <EmptyState
        title="Nenhuma leitura disponível"
        message="Ainda não há leituras visíveis para os pontos exibidos. Pontos demonstrativos locais não têm leituras."
      />
    )
  }
  const { stop, reading } = latest
  const age = formatRelativeAge(reading.measuredAt, now)
  const connectivity = getConnectivity(reading.measuredAt, now)
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="break-words text-lg font-semibold text-slate-900">
        {stop.name} <span className="font-mono text-sm font-normal text-slate-600">({stop.code})</span>
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BigValue Icon={IconThermometer} label="Temperatura" text={formatTemperature(reading.temperatureC)} />
        <BigValue Icon={IconDroplet} label="Umidade" text={formatHumidity(reading.humidityPct)} />
      </div>
      <p className="mt-4 text-sm text-slate-600">
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
    </div>
  )
}
