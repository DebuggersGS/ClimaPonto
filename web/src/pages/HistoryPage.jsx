import { useId } from 'react'
import { useSearchParams } from 'react-router'
import PeriodFilter from '../components/history/PeriodFilter.jsx'
import ReadingsEvolution from '../components/history/ReadingsEvolution.jsx'
import ReadingsTable from '../components/history/ReadingsTable.jsx'
import StopSelect from '../components/history/StopSelect.jsx'
import Button from '../components/ui/Button.jsx'
import DataSourceBadge from '../components/ui/DataSourceBadge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import FeedbackMessage from '../components/ui/FeedbackMessage.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useReadingsHistory } from '../hooks/useReadingsHistory.js'
import { useStops } from '../hooks/useStops.js'
import { HISTORY_LIMIT, HISTORY_PERIODS, parsePeriodId } from '../utils/historyPeriods.js'

export default function HistoryPage() {
  useDocumentTitle('Histórico')
  const selectId = useId()
  const [searchParams, setSearchParams] = useSearchParams()
  const { stops, isLoading: stopsLoading, error: stopsError, source } = useStops()

  const code = searchParams.get('ponto') ?? ''
  const periodId = parsePeriodId(searchParams.get('periodo'))
  const period = HISTORY_PERIODS.find((item) => item.id === periodId)
  const stop = stops.find((item) => item.code === code)

  const { readings, truncated, discardedCount, isLoading, error, retry } = useReadingsHistory({
    stopId: stop?.id,
    periodId,
  })

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setSearchParams(next, { replace: true })
  }

  const notFound = !stopsLoading && !stopsError && code !== '' && !stop
  const showResults = Boolean(stop) && !error

  return (
    <>
      <PageHeader
        title="Histórico"
        description="Registro das leituras de temperatura e umidade ao longo do tempo."
      />

      <DataSourceBadge source={source} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="sm:w-80">
          <StopSelect stops={stops} value={stop?.code ?? ''} onChange={(value) => updateParams({ ponto: value })} id={selectId} />
        </div>
        <PeriodFilter value={periodId} onChange={(value) => updateParams({ periodo: value })} />
      </div>

      {stopsLoading && (
        <p className="text-slate-600" role="status">
          Carregando pontos…
        </p>
      )}

      {stopsError && <FeedbackMessage tone="error">Não foi possível carregar os pontos. {stopsError}</FeedbackMessage>}

      {!stopsLoading && !stopsError && !code && (
        <EmptyState title="Selecione um ponto" message="Escolha um ponto monitorado para ver o histórico de leituras." />
      )}

      {notFound && (
        <EmptyState
          title="Ponto não encontrado ou inativo"
          message={`Não há ponto visível com o código "${code.slice(0, 32)}${code.length > 32 ? '…' : ''}". Escolha outro ponto na lista.`}
        />
      )}

      {stop && error && (
        <div>
          <FeedbackMessage tone="error">{error.message}</FeedbackMessage>
          <Button variant="secondary" onClick={retry}>
            Tentar novamente
          </Button>
        </div>
      )}

      {showResults && isLoading && readings.length === 0 && (
        <Skeleton shape="chart" label="Carregando leituras…" />
      )}

      {showResults && !isLoading && readings.length === 0 && (
        <EmptyState
          title="Nenhuma leitura no período"
          message={`${stop.name} não tem leituras visíveis em: ${period.label.toLowerCase()}.`}
        />
      )}

      {showResults && truncated && (
        <FeedbackMessage tone="info">
          Exibindo as {HISTORY_LIMIT} leituras mais recentes do período; leituras mais antigas foram omitidas.
        </FeedbackMessage>
      )}

      {showResults && discardedCount > 0 && (
        <FeedbackMessage tone="info">
          {discardedCount === 1
            ? '1 leitura recebida foi descartada por estar inválida.'
            : `${discardedCount} leituras recebidas foram descartadas por estarem inválidas.`}
        </FeedbackMessage>
      )}

      {showResults && readings.length > 0 && (
        <div className="space-y-8">
          <section aria-labelledby="evolution-heading">
            <h2 id="evolution-heading" className="mb-3 text-xl font-semibold text-slate-900">
              Evolução
            </h2>
            <ReadingsEvolution readings={readings} periodId={periodId} headingLevel={3} />
          </section>
          <section aria-labelledby="table-heading">
            <h2 id="table-heading" className="mb-3 text-xl font-semibold text-slate-900">
              Leituras
            </h2>
            <ReadingsTable readings={readings} caption={`Leituras de ${stop.name} (${stop.code}) — ${period.label.toLowerCase()}`} />
          </section>
        </div>
      )}
    </>
  )
}
