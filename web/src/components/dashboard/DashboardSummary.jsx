import MetricCard from '../ui/MetricCard.jsx'
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconCheckCircle,
  IconHelpCircle,
  IconSignal,
  IconSignalOff,
} from '../ui/icons.jsx'
import { CONNECTIVITY_LABELS } from '../../utils/connectivity.js'
import { ENVIRONMENTAL_STATUS_LABELS } from '../../utils/readings.js'

const ENVIRONMENTAL_ITEMS = [
  { key: 'normal', Icon: IconCheckCircle },
  { key: 'attention', Icon: IconAlertTriangle },
  { key: 'critical', Icon: IconAlertOctagon },
  { key: 'unclassified', Icon: IconHelpCircle },
]

const CONNECTIVITY_ITEMS = [
  { key: 'online', Icon: IconSignal },
  { key: 'delayed', Icon: IconSignal },
  { key: 'offline', Icon: IconSignalOff },
  { key: 'no_data', Icon: IconSignalOff },
  { key: 'unknown', Icon: IconSignalOff },
]

function CountList({ title, note, reference, items, labels, counts }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{note}</p>
      <ul className="mt-3 divide-y divide-slate-100">
        {items.map(({ key, Icon }) => (
          <li key={key} className="flex items-center justify-between gap-3 py-2">
            <span className="flex items-center gap-2 text-sm text-slate-800">
              <Icon />
              {labels[key]}
            </span>
            <span className="text-lg font-semibold tabular-nums text-slate-900">{counts[key]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-slate-600">{reference}</p>
    </section>
  )
}

/**
 * Resumo do Dashboard: métricas gerais e contagens por estado ambiental e por conectividade.
 * @param {{ summary: ReturnType<import('../../utils/readings.js').summarizeDashboard> }} props
 */
export default function DashboardSummary({ summary }) {
  const { monitoredCount, withReadingsCount, noDataCount, demoCount, environmentalCounts, connectivityCounts } =
    summary
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Pontos monitorados" value={String(monitoredCount)} />
        <MetricCard label="Com leituras" value={String(withReadingsCount)} description="Têm ao menos uma leitura visível" />
        <MetricCard label="Sem dados" value={String(noDataCount)} description="Nenhuma leitura recebida" />
        <MetricCard label="Demonstrativos" value={String(demoCount)} description="Pontos fictícios, sem sensor" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CountList
          title="Estado ambiental registrado"
          note="Último estado gravado em cada leitura. É independente da conectividade."
          reference={`de ${withReadingsCount} ${withReadingsCount === 1 ? 'ponto com leitura' : 'pontos com leitura'}`}
          items={ENVIRONMENTAL_ITEMS}
          labels={ENVIRONMENTAL_STATUS_LABELS}
          counts={environmentalCounts}
        />
        <CountList
          title="Conectividade"
          note="Idade da última leitura. É independente do estado ambiental."
          reference={`de ${monitoredCount} ${monitoredCount === 1 ? 'ponto monitorado' : 'pontos monitorados'}`}
          items={CONNECTIVITY_ITEMS}
          labels={CONNECTIVITY_LABELS}
          counts={connectivityCounts}
        />
      </div>
    </div>
  )
}
