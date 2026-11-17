import ExportCsvButton from '../history/ExportCsvButton.jsx'
import ReadingsTable from '../history/ReadingsTable.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import FeedbackMessage from '../ui/FeedbackMessage.jsx'
import MeasurementsChart from './MeasurementsChart.jsx'
import VariableControl from './VariableControl.jsx'

/**
 * Medições: gráfico, tabela paginada e CSV, todos sobre `insights.readings`
 * (o mesmo recorte), de modo que o que se vê é o que se exporta.
 */
export default function MeasurementsTab({ stop, insights, periodId, periodLabel, variable, onVariableChange }) {
  const { readings, slice, quality, truncated, discardedCount } = insights

  if (readings.length === 0) {
    return (
      <div>
        <h2 className="sr-only">Medições</h2>
        <EmptyState title="Sem leituras no período" message={`Não há leituras de ${stop.name} em: ${periodLabel.toLowerCase()}.`} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Medições</h2>
        <div className="flex flex-wrap items-end gap-3">
          <VariableControl value={variable} onChange={onVariableChange} />
          <ExportCsvButton readings={readings} stop={stop} periodId={periodId} originId="todas" />
        </div>
      </div>
      {truncated && (
        <FeedbackMessage tone="info" className="mb-0">
          Exibindo apenas as leituras mais recentes do período; leituras mais antigas foram omitidas (gráfico, tabela e CSV usam o mesmo recorte).
        </FeedbackMessage>
      )}
      {discardedCount > 0 && (
        <FeedbackMessage tone="info" className="mb-0">
          {discardedCount === 1 ? '1 leitura recebida foi descartada por estar inválida.' : `${discardedCount} leituras recebidas foram descartadas por estarem inválidas.`}
        </FeedbackMessage>
      )}
      <MeasurementsChart
        readings={readings}
        variable={variable}
        periodId={periodId}
        startMs={slice.startMs}
        endMs={slice.endMs}
        gapThresholdMs={quality.gapThresholdMs}
      />
      {quality.hasNonRealData && (
        <FeedbackMessage tone="info" className="mb-0">
          Parte destas leituras não é medição real (simulação, teste ou origem desconhecida); a origem de cada leitura aparece na tabela e no tooltip.
        </FeedbackMessage>
      )}
      <section aria-labelledby="tabela-medicoes">
        <h3 id="tabela-medicoes" className="mb-3 text-lg font-semibold text-slate-900">
          Leituras
        </h3>
        <ReadingsTable readings={readings} caption={`Leituras de ${stop.name} (${stop.code}) — ${periodLabel.toLowerCase()}`} />
      </section>
    </div>
  )
}
