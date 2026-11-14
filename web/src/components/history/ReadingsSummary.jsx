import { ArrowDownRight, ArrowUpRight, Droplets, Minus, Thermometer } from 'lucide-react'
import { summarizeSeries } from '../../utils/readings.js'

const FIELD_ICONS = { temperatureC: Thermometer, humidityPct: Droplets }

function Stat({ term, value, formatValue }) {
  const unavailable = value === null || value === undefined
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-2 sm:px-3 ring-1 ring-inset ring-slate-900/5">
      <dt className="text-xs text-slate-600">{term}</dt>
      <dd className="whitespace-nowrap text-base font-semibold tabular-nums text-slate-900 sm:text-lg">
        {unavailable ? (
          <>
            <span aria-hidden="true">—</span>
            <span className="sr-only">indisponível</span>
          </>
        ) : (
          formatValue(value)
        )}
      </dd>
    </div>
  )
}

function Trend({ trend, formatValue }) {
  if (trend.status !== 'available') {
    return <span className="text-slate-600">Dados insuficientes para indicar tendência</span>
  }
  const { variation } = trend
  const Icon = variation > 0 ? ArrowUpRight : variation < 0 ? ArrowDownRight : Minus
  const sign = variation > 0 ? '+' : variation < 0 ? '−' : ''
  const word = variation > 0 ? 'Subiu' : variation < 0 ? 'Caiu' : 'Estável'
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-slate-900">
      <Icon aria-hidden="true" className="h-4 w-4" />
      {word} ({sign}{formatValue(Math.abs(variation))})
    </span>
  )
}

/**
 * Resumo estatístico em cartões: mínima, máxima, média e tendência (só com
 * leituras suficientes). Valores ausentes nunca viram zero. O `id` permite
 * que o gráfico o referencie em aria-describedby.
 * @param {{ readings: object[], field: 'temperatureC'|'humidityPct', label: string, formatValue: (v: number|null) => string, id?: string }} props
 */
export default function ReadingsSummary({ readings, field, label, formatValue, id }) {
  const summary = summarizeSeries(readings, field)
  const Icon = FIELD_ICONS[field]
  return (
    <div id={id} role="group" aria-label={`Resumo de ${label}`} className="space-y-2 text-sm">
      <dl className="grid grid-cols-3 gap-2">
        <Stat term="Mínima" value={summary.min} formatValue={formatValue} />
        <Stat term="Máxima" value={summary.max} formatValue={formatValue} />
        <Stat term="Média" value={summary.average} formatValue={formatValue} />
      </dl>
      <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <div className="inline-flex items-center gap-1.5">
          <dt className="inline-flex items-center gap-1.5">
            {Icon && <Icon aria-hidden="true" className="h-4 w-4" />}
            Amostras válidas:
          </dt>
          <dd className="font-semibold tabular-nums text-slate-900">{summary.count}</dd>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <dt>Tendência:</dt>
          <dd>
            <Trend trend={summary.trend} formatValue={formatValue} />
          </dd>
        </div>
      </dl>
    </div>
  )
}
