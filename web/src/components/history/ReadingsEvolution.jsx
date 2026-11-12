import { formatHumidity, formatTemperature } from '../../utils/formatters.js'
import ReadingsChart from './ReadingsChart.jsx'
import ReadingsSummary from './ReadingsSummary.jsx'

const SERIES = [
  { field: 'temperatureC', title: 'Temperatura', unit: '°C', formatValue: formatTemperature },
  { field: 'humidityPct', title: 'Umidade', unit: '%', formatValue: formatHumidity },
]

/**
 * Evolução de temperatura e umidade (resumo + gráfico por grandeza).
 * @param {{ readings: object[], headingLevel?: 2|3|4 }} props nível do título de cada grandeza
 */
export default function ReadingsEvolution({ readings, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {SERIES.map(({ field, title, unit, formatValue }) => (
        <section key={field} className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Heading className="mb-3 text-base font-semibold text-slate-900">{title}</Heading>
          <ReadingsSummary readings={readings} field={field} label={title.toLowerCase()} formatValue={formatValue} />
          <div className="mt-4">
            <ReadingsChart readings={readings} field={field} title={title} unit={unit} formatValue={formatValue} />
          </div>
        </section>
      ))}
    </div>
  )
}
