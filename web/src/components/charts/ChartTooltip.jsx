import { formatDateTimeWithZone, formatTimeWithZone } from '../../utils/formatters.js'

/**
 * Tooltip em cartão glass: intervalo agregado (com fuso), média e nº de leituras.
 * @param {{ active?: boolean, payload?: Array<{ payload: object }>, field: 'temperature'|'humidity', title: string, formatValue: (v: number|null) => string }} props
 */
export default function ChartTooltip({ active, payload, field, title, formatValue }) {
  const point = active ? payload?.[0]?.payload : null
  if (!point) return null
  const count = point[`${field}Count`]
  return (
    <div className="surface-glass rounded-lg px-3 py-2 text-xs text-slate-800 shadow-elevated">
      <p className="font-semibold">
        {formatDateTimeWithZone(point.start)} – {formatTimeWithZone(point.end)}
      </p>
      {point[field] === null ? (
        <p className="mt-1">{title}: sem leituras neste intervalo</p>
      ) : (
        <>
          <p className="mt-1 tabular-nums">
            {title} (média): <span className="font-semibold">{formatValue(point[field])}</span>
          </p>
          <p className="tabular-nums text-slate-600">
            {count} {count === 1 ? 'leitura agregada' : 'leituras agregadas'}
          </p>
        </>
      )}
    </div>
  )
}
