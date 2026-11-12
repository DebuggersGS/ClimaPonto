import { useId, useMemo } from 'react'
import { buildChartSeries } from '../../utils/chartSeries.js'
import { formatHumidity, formatTemperature } from '../../utils/formatters.js'
import SeriesChart from '../charts/SeriesChart.jsx'
import Card from '../ui/Card.jsx'
import ReadingsSummary from './ReadingsSummary.jsx'

const SERIES = [
  { chartField: 'temperature', field: 'temperatureC', title: 'Temperatura', unit: '°C', formatValue: formatTemperature },
  { chartField: 'humidity', field: 'humidityPct', title: 'Umidade', unit: '%', formatValue: formatHumidity },
]

const currentTime = () => Date.now()

/**
 * Evolução de temperatura e umidade: resumo estatístico + gráfico por grandeza
 * (cursores sincronizados). A série é recalculada quando as leituras mudam.
 * @param {{ readings: object[], periodId: string, headingLevel?: 2|3 }} props
 */
export default function ReadingsEvolution({ readings, periodId, headingLevel = 3 }) {
  const syncId = useId()
  const summaryBase = useId()
  // `now` fixo por conjunto de leituras: o gráfico não "anda" a cada render.
  const series = useMemo(() => buildChartSeries(readings, periodId, currentTime()), [readings, periodId])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {SERIES.map(({ chartField, field, title, unit, formatValue }) => {
        const summaryId = `${summaryBase}-${field}`
        return (
          <Card key={field} title={title} headingLevel={headingLevel} className="min-w-0">
            <div className="space-y-4">
              <ReadingsSummary readings={readings} field={field} label={title.toLowerCase()} formatValue={formatValue} id={summaryId} />
              <SeriesChart
                series={series}
                field={chartField}
                title={title}
                unit={unit}
                periodId={periodId}
                formatValue={formatValue}
                describedBy={summaryId}
                syncId={syncId}
              />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
