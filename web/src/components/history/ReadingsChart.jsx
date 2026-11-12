import { buildSeriesGeometry, toPathData } from '../../utils/chartGeometry.js'
import { formatDateTimeWithZone } from '../../utils/formatters.js'
import { sortReadingsAsc } from '../../utils/readings.js'

/**
 * Gráfico de linha de uma única grandeza. Lacunas quebram a linha (sem
 * interpolação). Rótulos ficam em HTML para permanecerem legíveis no celular.
 * @param {{ readings: object[], field: 'temperatureC'|'humidityPct', title: string, unit?: string, formatValue: (value: number|null) => string }} props
 */
export default function ReadingsChart({ readings, field, title, unit, formatValue }) {
  const points = sortReadingsAsc(readings).map((reading) => ({ t: reading.measuredAtMs, value: reading[field] }))
  const validCount = points.filter((point) => point.value !== null && point.value !== undefined).length
  const legend = unit ? `${title} (${unit})` : title

  if (validCount < 2) {
    return (
      <figure>
        <figcaption className="text-sm font-medium text-slate-800">{legend}</figcaption>
        <p className="mt-2 rounded-md border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-600">
          Amostras insuficientes para desenhar o gráfico
        </p>
      </figure>
    )
  }

  const geometry = buildSeriesGeometry(points)
  const yMax = formatValue(geometry.yMax)
  const yMin = formatValue(geometry.yMin)
  const start = formatDateTimeWithZone(geometry.tStart)
  const end = formatDateTimeWithZone(geometry.tEnd)
  const ariaLabel = `Gráfico de ${title}: ${validCount} amostras, mínimo ${yMin}, máximo ${yMax}, de ${start} até ${end}.`

  return (
    <figure>
      <figcaption className="text-sm font-medium text-slate-800">{legend}</figcaption>
      <div className="mt-2 flex gap-2">
        <div className="flex w-16 shrink-0 flex-col justify-between text-xs tabular-nums text-slate-600">
          <span>
            <span className="sr-only">Máximo: </span>
            {yMax}
          </span>
          <span>
            <span className="sr-only">Mínimo: </span>
            {yMin}
          </span>
        </div>
        <svg
          viewBox={geometry.viewBox}
          role="img"
          aria-label={ariaLabel}
          preserveAspectRatio="none"
          className="h-40 min-w-0 flex-1 rounded-md border border-slate-200 bg-white sm:h-48"
        >
          <line x1="0" x2="600" y1="16" y2="16" className="stroke-slate-200" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2="600" y1="184" y2="184" className="stroke-slate-200" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {geometry.segments.map((segment) => (
            <path
              key={segment[0].t}
              d={toPathData(segment)}
              fill="none"
              className="stroke-brand-600"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {geometry.markers.map((marker) => (
            <circle key={marker.t} cx={marker.x} cy={marker.y} r="4" className="fill-brand-600" />
          ))}
        </svg>
      </div>
      <div className="mt-1 flex justify-between gap-2 pl-[4.5rem] text-xs text-slate-600">
        <span>{start}</span>
        <span className="text-right">{end}</span>
      </div>
      <p className="mt-1 text-xs text-slate-600">Linhas interrompidas indicam ausência de leituras no intervalo.</p>
    </figure>
  )
}
