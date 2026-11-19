import Card from '../ui/Card.jsx'
import ConnectivityBadge from '../ui/ConnectivityBadge.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import EnvironmentalStatusBadge from '../ui/EnvironmentalStatusBadge.jsx'
import { IconDroplet, IconThermometer } from '../ui/icons.jsx'
import ReadingSourceBadge from '../ui/ReadingSourceBadge.jsx'
import { getConnectivity } from '../../utils/connectivity.js'
import { formatDateTimeWithZone, formatHumidity, formatRelativeAge, formatTemperature } from '../../utils/formatters.js'

function BigValue({ Icon, label, text, large = false }) {
  const unavailable = text === '—'
  return (
    <div>
      <p className="flex items-center gap-2 text-sm text-slate-600">
        <Icon className="h-5 w-5" />
        {label}
      </p>
      <p
        className={`mt-1 whitespace-nowrap font-semibold tracking-tight text-slate-900 tabular-nums ${large ? 'text-5xl @md:text-6xl' : 'text-3xl @md:text-4xl'}`}
      >
        {text}
        {unavailable && <span className="sr-only"> indisponível</span>}
      </p>
    </div>
  )
}

/**
 * Painel em destaque da leitura mais recente entre todos os pontos.
 * Estado ambiental e conectividade são selos separados; sem cor de estado no fundo.
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
    <Card variant="elevated" className="p-6 sm:p-8">
      <h3 className="break-words text-lg font-semibold text-slate-900">
        {stop.name} <span className="font-mono text-sm font-normal text-slate-600">({stop.code})</span>
      </h3>
      {/* Container query: empilha os valores quando o cartão é estreito (ex.: col-span-5 em 1366 px). */}
      <div className="@container mt-5">
        <div className="grid grid-cols-1 gap-6 @md:grid-cols-2">
        <BigValue Icon={IconThermometer} label="Temperatura" text={formatTemperature(reading.temperatureC)} large />
        <BigValue Icon={IconDroplet} label="Umidade" text={formatHumidity(reading.humidityPct)} />
        </div>
      </div>
      <p className="mt-5 text-sm text-slate-600">
        Medido em{' '}
        <time dateTime={reading.measuredAt} className="font-medium text-slate-800">
          {formatDateTimeWithZone(reading.measuredAt)}
        </time>{' '}
        ({age})
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <EnvironmentalStatusBadge status={reading.environmentalStatus} />
        <ConnectivityBadge status={connectivity.status} />
        <ReadingSourceBadge source={reading.source} />
      </div>
    </Card>
  )
}
