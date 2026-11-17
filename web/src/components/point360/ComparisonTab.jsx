import { useId } from 'react'
import { useStopInsights } from '../../hooks/useStopInsights.js'
import { formatDateTimeWithZone } from '../../utils/formatters.js'
import { getReadingSourceInfo } from '../../utils/readings.js'
import { checkStopsComparability, VARIABLES } from '../../utils/stopInsights.js'
import StopSelect from '../history/StopSelect.jsx'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import FeedbackMessage from '../ui/FeedbackMessage.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import VariableControl from './VariableControl.jsx'

const signed = (value, format) => `${value > 0 ? '+' : ''}${format(value)}`

function StatsTable({ result, stopA, stopB }) {
  const { format } = VARIABLES[result.variable]
  const rows = [
    ['Amostras', (side) => String(side.n)],
    ['Mínimo', (side) => format(side.min)],
    ['Média', (side) => format(side.average)],
    ['Máximo', (side) => format(side.max)],
  ]
  return (
    <div role="region" tabIndex={0} aria-label="Tabela comparativa (com rolagem)" className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-brand-600">
      <table className="min-w-full text-sm">
        <caption className="sr-only">
          Comparação de {VARIABLES[result.variable].label.toLowerCase()} entre {stopA.name} e {stopB.name}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-semibold text-slate-700">Medida</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700">{stopA.name}</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700">{stopB.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, cell]) => (
            <tr key={label} className="border-t border-slate-200">
              <th scope="row" className="px-3 py-2 text-left font-medium text-slate-800">{label}</th>
              <td className="px-3 py-2 text-right tabular-nums text-slate-900">{cell(result.a)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-slate-900">{cell(result.b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Outcome({ result, stopA, stopB }) {
  if (result.status === 'not-comparable') {
    return <EmptyState variant="warning" title="Não comparável" message={result.message} role="status" />
  }
  const { label } = VARIABLES[result.variable]
  const sourceLabel = getReadingSourceInfo(result.source).label
  return (
    <div className="space-y-4">
      {result.isSimulation && (
        <FeedbackMessage tone="info" className="mb-0">
          A comparação usa leituras de simulação, não de sensor real.
        </FeedbackMessage>
      )}
      <Card title={`${label}: ${stopA.name} e ${stopB.name}`} headingLevel={3}>
        <p className="mb-3">
          Origem comum: {sourceLabel}. Trecho em que os dois têm leituras: {formatDateTimeWithZone(result.from)} a {formatDateTimeWithZone(result.to)}.
        </p>
        <StatsTable result={result} stopA={stopA} stopB={stopB} />
        <p className="mt-3 text-slate-900">
          {result.averageDifference === null
            ? 'Diferença de médias indisponível.'
            : `Diferença entre as médias (${stopA.name} menos ${stopB.name}): ${signed(result.averageDifference, VARIABLES[result.variable].format)}.`}
        </p>
        <p className="mt-1 text-xs">Comparação descritiva do mesmo período e da mesma variável; não é classificação nem previsão.</p>
      </Card>
    </div>
  )
}

/**
 * Comparação A/B: o ponto aberto (A) contra um segundo ponto escolhido (B),
 * sempre via checkStopsComparability, que informa o motivo quando não dá para comparar.
 * @param {{ stop: object, stops: object[], insights: object, periodId: string, now: Date, variable: string,
 *   onVariableChange: (v: string) => void, otherCode: string, onOtherChange: (code: string) => void }} props
 */
export default function ComparisonTab({ stop, stops, insights, periodId, now, variable, onVariableChange, otherCode, onOtherChange }) {
  const selectId = useId()
  const other = stops.find((item) => item.code === otherCode && item.code !== stop.code) ?? null
  const otherInsights = useStopInsights({ stop: other, periodId, now })
  const options = stops.filter((item) => item.code !== stop.code)

  let outcome = null
  if (other && otherInsights.isLoading) {
    outcome = <Skeleton shape="block" label="Carregando leituras do segundo ponto…" />
  } else if (other && otherInsights.error) {
    outcome = (
      <EmptyState variant="error" title="Não foi possível carregar o segundo ponto" message={otherInsights.error.message} />
    )
  } else if (other) {
    const result = checkStopsComparability(
      { stopId: stop.id, readings: insights.readings, variable, periodId },
      { stopId: other.id, readings: otherInsights.readings, variable, periodId },
      now,
    )
    outcome = <Outcome result={result} stopA={stop} stopB={other} />
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Comparação</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 sm:w-80">
          <StopSelect stops={options} value={other?.code ?? ''} onChange={onOtherChange} id={selectId} label="Comparar com" />
        </div>
        <VariableControl value={variable} onChange={onVariableChange} />
      </div>
      {outcome ?? <EmptyState variant="info" title="Escolha um segundo ponto" message={`Selecione outro ponto para comparar com ${stop.name} no mesmo período.`} />}
    </div>
  )
}
