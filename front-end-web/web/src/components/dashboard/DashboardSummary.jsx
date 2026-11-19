import { AnimatedItem, AnimatedList } from '../ui/Reveal.jsx'
import MetricCard from '../ui/MetricCard.jsx'
import { IconChart, IconFlask, IconHelpCircle, IconSignal } from '../ui/icons.jsx'
import DistributionCard from './DistributionCard.jsx'
import { getConnectivityTone, getEnvironmentalTone } from '../../utils/statusTones.js'

const ENVIRONMENTAL_KEYS = ['normal', 'attention', 'critical', 'unclassified']
const CONNECTIVITY_KEYS = ['online', 'delayed', 'offline', 'no_data', 'unknown']

const plural = (count, one, many) => (count === 1 ? one : many)

/**
 * Resumo do Dashboard: faixa de métricas (com entrada em sequência) e
 * distribuições por estado ambiental e por conectividade.
 * @param {{ summary: ReturnType<import('../../utils/readings.js').summarizeDashboard> }} props
 */
export default function DashboardSummary({ summary }) {
  const { monitoredCount, withReadingsCount, noDataCount, demoCount, environmentalCounts, connectivityCounts } =
    summary
  const metrics = [
    { label: 'Pontos monitorados', value: monitoredCount, icon: IconChart },
    { label: 'Com leituras', value: withReadingsCount, icon: IconSignal, description: 'Têm ao menos uma leitura visível' },
    { label: 'Sem dados', value: noDataCount, icon: IconHelpCircle, description: 'Nenhuma leitura recebida' },
    { label: 'Demonstrativos', value: demoCount, icon: IconFlask, description: 'Pontos fictícios, sem sensor' },
  ]
  return (
    <div className="space-y-4">
      <AnimatedList className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {metrics.map(({ value, ...metric }) => (
          <AnimatedItem key={metric.label}>
            <MetricCard {...metric} value={String(value)} className="h-full" />
          </AnimatedItem>
        ))}
      </AnimatedList>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1 min-[1500px]:grid-cols-2">
        <DistributionCard
          title="Estado ambiental registrado"
          note="Último estado gravado em cada leitura. É independente da conectividade."
          reference={`de ${withReadingsCount} ${plural(withReadingsCount, 'ponto com leitura', 'pontos com leitura')}`}
          keys={ENVIRONMENTAL_KEYS}
          counts={environmentalCounts}
          getPresentation={getEnvironmentalTone}
        />
        <DistributionCard
          title="Conectividade"
          note="Idade da última leitura. É independente do estado ambiental."
          reference={`de ${monitoredCount} ${plural(monitoredCount, 'ponto monitorado', 'pontos monitorados')}`}
          keys={CONNECTIVITY_KEYS}
          counts={connectivityCounts}
          getPresentation={getConnectivityTone}
        />
      </div>
    </div>
  )
}
