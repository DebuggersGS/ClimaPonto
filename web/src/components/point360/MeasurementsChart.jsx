import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDateTimeWithZone } from '../../utils/formatters.js'
import { getReadingSourceInfo } from '../../utils/readings.js'
import { VARIABLES } from '../../utils/stopInsights.js'
import { SERIES_TONES, formatTick } from '../charts/chartFormat.js'
import EmptyState from '../ui/EmptyState.jsx'
import { buildMeasurementPoints } from './measurementPoints.js'

const AXIS_TICK = { fontSize: 12, fill: 'var(--color-slate-600)' }
const TONE_BY_VARIABLE = { temperatureC: 'temperature', humidityPct: 'humidity' }
const MAX_GAPS_LISTED = 5

const formatGapDuration = (ms) => {
  const minutes = Math.round(ms / 60000)
  return minutes < 90 ? `${minutes} min` : `${Math.round(minutes / 6) / 10} h`
}

function PointTooltip({ active, payload, variable }) {
  const point = active ? payload?.[0]?.payload : null
  if (!point || point.value === null) return null
  const { label, unit, format } = VARIABLES[variable]
  return (
    <div className="surface-glass rounded-lg px-3 py-2 text-xs text-slate-800 shadow-elevated">
      <p className="font-semibold">{formatDateTimeWithZone(point.measuredAt)}</p>
      <p className="mt-1 tabular-nums">
        {label}: <span className="font-semibold">{format(point.value)}</span>
        <span className="sr-only"> ({unit})</span>
      </p>
      <p className="text-slate-600">Origem: {getReadingSourceInfo(point.source).label}</p>
    </div>
  )
}

/**
 * Série bruta de uma variável no recorte, com lacunas desenhadas como faixas
 * tracejadas e listadas em texto (a lacuna nunca depende só da cor).
 * @param {{ readings: object[], variable: 'temperatureC'|'humidityPct', periodId: string, startMs: number, endMs: number, gapThresholdMs: number }} props
 */
export default function MeasurementsChart({ readings, variable, periodId, startMs, endMs, gapThresholdMs }) {
  const { label, unit } = VARIABLES[variable]
  const { points, gaps } = buildMeasurementPoints(readings, variable, gapThresholdMs)
  const stroke = SERIES_TONES[TONE_BY_VARIABLE[variable]].stroke
  const hasValues = points.some((point) => point.value !== null)

  if (!hasValues) {
    return <EmptyState title="Sem amostras no período" message={`Nenhuma leitura de ${label.toLowerCase()} para desenhar o gráfico.`} />
  }

  return (
    <figure aria-describedby="medicoes-resumo" className="m-0 min-w-0">
      <figcaption className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
        <span aria-hidden="true" className="h-0.5 w-5 rounded-full" style={{ backgroundColor: stroke }} />
        {label} ({unit}) — leituras individuais
      </figcaption>
      <div className="h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} accessibilityLayer margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-slate-200)" />
            {gaps.map((gap) => (
              <ReferenceArea
                key={gap.startMs}
                x1={gap.startMs}
                x2={gap.endMs}
                fill="var(--color-slate-400)"
                fillOpacity={0.2}
                stroke="var(--color-slate-500)"
                strokeDasharray="4 3"
                ifOverflow="hidden"
              />
            ))}
            <XAxis
              type="number"
              dataKey="t"
              domain={[startMs, endMs]}
              allowDataOverflow
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              tickFormatter={(ms) => formatTick(ms, periodId)}
              tickCount={5}
              tickMargin={8}
            />
            <YAxis
              width={52}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              domain={[(min) => Math.floor(min - 1), (max) => Math.ceil(max + 1)]}
              tickFormatter={(value) => `${Math.round(value)}${unit}`}
              tickCount={4}
              allowDecimals={false}
            />
            <Tooltip cursor={{ stroke: 'var(--color-slate-400)', strokeDasharray: '3 3' }} content={<PointTooltip variable={variable} />} />
            <Line
              type="linear"
              dataKey="value"
              name={label}
              stroke={stroke}
              strokeWidth={2}
              connectNulls={false}
              dot={points.length <= 80 ? { r: 2.5 } : false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-surface)' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div id="medicoes-resumo" className="mt-2 text-xs text-slate-600">
        <p>
          {gaps.length === 0
            ? 'Nenhuma lacuna entre leituras consecutivas.'
            : `${gaps.length} ${gaps.length === 1 ? 'lacuna' : 'lacunas'} (faixas tracejadas no gráfico): intervalos sem leituras acima do limite de ${formatGapDuration(gapThresholdMs)}.`}
        </p>
        {gaps.length > 0 && (
          <ul className="mt-1 list-disc pl-5">
            {gaps.slice(0, MAX_GAPS_LISTED).map((gap) => (
              <li key={gap.startMs} className="tabular-nums">
                de {formatDateTimeWithZone(gap.startMs)} a {formatDateTimeWithZone(gap.endMs)} ({formatGapDuration(gap.durationMs)})
              </li>
            ))}
            {gaps.length > MAX_GAPS_LISTED && <li>e mais {gaps.length - MAX_GAPS_LISTED}.</li>}
          </ul>
        )}
      </div>
    </figure>
  )
}
