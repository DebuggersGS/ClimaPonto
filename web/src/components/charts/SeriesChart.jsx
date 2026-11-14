import { useId } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getValueDomain } from '../../utils/chartSeries.js'
import EmptyState from '../ui/EmptyState.jsx'
import { fadeUp } from '../ui/motion.js'
import ChartTooltip from './ChartTooltip.jsx'
import { SERIES_TONES, formatTick } from './chartFormat.js'

const AXIS_TICK = { fontSize: 12, fill: '#475569' }

/**
 * Gráfico de área de uma grandeza. Lacunas ficam visíveis (connectNulls=false).
 * Dois gráficos com o mesmo syncId sincronizam o cursor.
 * @param {{ series: object[], field: 'temperature'|'humidity', title: string, unit: string, periodId: string,
 *   formatValue: (v: number|null) => string, describedBy?: string, syncId?: string }} props
 */
export default function SeriesChart({ series, field, title, unit, periodId, formatValue, describedBy, syncId }) {
  const gradientId = useId()
  const reducedMotion = useReducedMotion()
  const domain = getValueDomain(series, field)
  const { stroke } = SERIES_TONES[field]
  const legend = `${title} (${unit})`

  if (!domain.hasData) {
    return (
      <figure aria-describedby={describedBy}>
        <figcaption className="mb-2 text-sm font-medium text-slate-800">{legend}</figcaption>
        <EmptyState title="Sem amostras no período" message={`Nenhuma leitura de ${title.toLowerCase()} para desenhar o gráfico.`} />
      </figure>
    )
  }

  return (
    <motion.figure aria-describedby={describedBy} variants={fadeUp} initial={reducedMotion ? false : 'hidden'} animate="visible" className="min-w-0">
      <figcaption className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
        <span aria-hidden="true" className="h-0.5 w-5 rounded-full" style={{ backgroundColor: stroke }} />
        {legend}
      </figcaption>
      <div className="h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} syncId={syncId} accessibilityLayer margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="t"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              tickFormatter={(ms) => formatTick(ms, periodId)}
              minTickGap={32}
              tickMargin={8}
              padding={{ left: 8, right: 8 }}
              interval="preserveStartEnd"
            />
            <YAxis
              width={52}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              domain={[domain.min, domain.max]}
              tickFormatter={(value) => `${Math.round(value)}${unit}`}
              tickCount={4}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }}
              content={<ChartTooltip field={field} title={title} formatValue={formatValue} />}
            />
            <Area
              type="monotone"
              dataKey={field}
              name={title}
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              connectNulls={false}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
              isAnimationActive={!reducedMotion}
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-slate-600">Intervalos sem leituras aparecem como lacunas no gráfico.</p>
    </motion.figure>
  )
}
