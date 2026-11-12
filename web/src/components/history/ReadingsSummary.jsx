import { summarizeSeries } from '../../utils/readings.js'

function Value({ value, formatValue }) {
  if (value === null || value === undefined) {
    return (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">indisponível</span>
      </>
    )
  }
  return formatValue(value)
}

function TrendText({ trend, formatValue }) {
  if (trend.status !== 'available') return 'Dados insuficientes para indicar tendência'
  const { variation } = trend
  const sign = variation > 0 ? '+' : variation < 0 ? '−' : ''
  const word = variation > 0 ? 'subiu' : variation < 0 ? 'caiu' : 'estável'
  return `${word} (${sign}${formatValue(Math.abs(variation))})`
}

/**
 * Mínimo, máximo, média e tendência de uma grandeza (valores ausentes nunca viram zero).
 * @param {{ readings: object[], field: 'temperatureC'|'humidityPct', label: string, formatValue: (value: number|null) => string }} props
 */
export default function ReadingsSummary({ readings, field, label, formatValue }) {
  const summary = summarizeSeries(readings, field)
  const rows = [
    { term: 'Mínima', value: summary.min },
    { term: 'Máxima', value: summary.max },
  ]
  return (
    <dl aria-label={`Resumo de ${label}`} className="grid grid-cols-2 gap-3 text-sm">
      {rows.map(({ term, value }) => (
        <div key={term}>
          <dt className="text-slate-600">{term}</dt>
          <dd className="text-lg font-semibold tabular-nums text-slate-900">
            <Value value={value} formatValue={formatValue} />
          </dd>
        </div>
      ))}
      <div>
        <dt className="text-slate-600">Média</dt>
        <dd className="text-lg font-semibold tabular-nums text-slate-900">
          <Value value={summary.average} formatValue={formatValue} />
          <span className="block text-xs font-normal text-slate-600">({summary.count} amostras válidas)</span>
        </dd>
      </div>
      <div>
        <dt className="text-slate-600">Tendência</dt>
        <dd className="font-medium text-slate-900">
          <TrendText trend={summary.trend} formatValue={formatValue} />
        </dd>
      </div>
    </dl>
  )
}
