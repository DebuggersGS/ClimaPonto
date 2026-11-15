import { buildSparkline } from '../../utils/sparkline.js'
import { SERIES_TONES } from './chartFormat.js'

/**
 * Minigráfico de tendência de uma grandeza. Não renderiza nada com menos de 2
 * valores válidos. O valor também deve aparecer em texto ao lado (não só no SVG).
 * @param {{ values: Array<number|null|undefined>, field: 'temperature'|'humidity', label: string, formatValue: (v: number) => string, className?: string }} props
 */
export default function Sparkline({ values, field, label, formatValue, className }) {
  const spark = buildSparkline(values)
  if (!spark) return null
  const { stroke } = SERIES_TONES[field]
  const description = `Tendência de ${label}: mínimo ${formatValue(spark.min)}, máximo ${formatValue(spark.max)}, último ${formatValue(spark.last)}`
  return (
    <svg
      role="img"
      aria-label={description}
      viewBox={spark.viewBox}
      preserveAspectRatio="none"
      className={className ?? 'h-8 w-24 shrink-0 overflow-visible'}
    >
      {spark.paths.map((d) => (
        <path key={d} d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      ))}
      {spark.dots.map((p) => (
        <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r={1} fill={stroke} />
      ))}
      <circle cx={spark.lastPoint.x} cy={spark.lastPoint.y} r={2} fill={stroke} stroke="var(--color-surface)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
