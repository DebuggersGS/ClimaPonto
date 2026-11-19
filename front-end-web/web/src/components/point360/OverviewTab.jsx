import { Clock, Droplets, Layers, Thermometer } from 'lucide-react'
import { buildChartSeries } from '../../utils/chartSeries.js'
import { formatRelativeAge } from '../../utils/formatters.js'
import { VARIABLES } from '../../utils/stopInsights.js'
import { partitionStopsByCoordinates } from '../../utils/stopMap.js'
import SeriesChart from '../charts/SeriesChart.jsx'
import StopMap from '../map/StopMap.jsx'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import MetricCard from '../ui/MetricCard.jsx'

const noop = () => {}

function Indicators({ current, quality, now }) {
  const cards = []
  for (const [field, summary, Icon] of [
    ['temperatureC', current.temperature, Thermometer],
    ['humidityPct', current.humidity, Droplets],
  ]) {
    if (summary.status !== 'available') continue
    cards.push(
      <MetricCard
        key={field}
        icon={Icon}
        label={`${VARIABLES[field].label} atual`}
        value={VARIABLES[field].format(summary.value)}
        description={`${formatRelativeAge(summary.measuredAt, now)} · ${summary.sourceLabel}`}
      />,
    )
  }
  cards.push(
    <MetricCard
      key="amostras"
      icon={Layers}
      label="Amostras no período"
      value={String(quality.sampleCount)}
      description={quality.completenessPct === null ? undefined : `Cobertura estimada: ${Math.round(quality.completenessPct)}% (regra provisória)`}
    />,
    <MetricCard key="idade" icon={Clock} label="Última leitura" value={formatRelativeAge(quality.lastReadingAt, now)} />,
  )
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.slice(0, 4)}</div>
}

function MiniMap({ stop }) {
  if (partitionStopsByCoordinates([stop]).located.length === 0) return null
  return (
    <section aria-labelledby="minimapa-titulo">
      <h3 id="minimapa-titulo" className="mb-2 text-lg font-semibold text-slate-900">
        Localização
      </h3>
      <StopMap items={[stop]} selectedCode={stop.code} onSelect={noop} fictionalPosition={stop.isDemo} compact />
    </section>
  )
}

/**
 * Visão geral: 2 a 4 indicadores disponíveis, gráfico principal e minimapa.
 * Sem leituras, mostra um estado vazio honesto (nenhum indicador é inventado).
 */
export default function OverviewTab({ stop, insights, periodId, periodLabel, now }) {
  const { current, quality, readings } = insights

  if (!current.hasAny) {
    return (
      <div className="space-y-6">
        <h2 className="sr-only">Visão geral</h2>
        <EmptyState
          title="Sem leituras no período"
          message={`${stop.name} não tem leituras de temperatura ou umidade em: ${periodLabel.toLowerCase()}. Tente outro período.`}
        />
        <MiniMap stop={stop} />
      </div>
    )
  }

  const series = buildChartSeries(readings, periodId, now)
  const mainField = current.temperature.status === 'available' ? 'temperature' : 'humidity'
  const variable = mainField === 'temperature' ? 'temperatureC' : 'humidityPct'
  const secondary = mainField === 'temperature' && current.humidity.status === 'available' ? 'humidity' : null

  return (
    <div className="space-y-6">
      <h2 className="sr-only">Visão geral</h2>
      <Indicators current={current} quality={quality} now={now} />
      <Card title="Evolução no período" headingLevel={3}>
        <SeriesChart
          series={series}
          field={mainField}
          title={VARIABLES[variable].label}
          unit={VARIABLES[variable].unit}
          periodId={periodId}
          formatValue={VARIABLES[variable].format}
        />
        {secondary && (
          <div className="mt-6">
            <SeriesChart
              series={series}
              field="humidity"
              title={VARIABLES.humidityPct.label}
              unit={VARIABLES.humidityPct.unit}
              periodId={periodId}
              formatValue={VARIABLES.humidityPct.format}
            />
          </div>
        )}
      </Card>
      <MiniMap stop={stop} />
    </div>
  )
}
