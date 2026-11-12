import { useMemo } from 'react'
import ConnectivityRuleNote from '../components/dashboard/ConnectivityRuleNote.jsx'
import DashboardSummary from '../components/dashboard/DashboardSummary.jsx'
import LatestReadingHighlight from '../components/dashboard/LatestReadingHighlight.jsx'
import RecentEvolutionPanel from '../components/dashboard/RecentEvolutionPanel.jsx'
import RefreshControl from '../components/dashboard/RefreshControl.jsx'
import StopStatusCard from '../components/dashboard/StopStatusCard.jsx'
import Button from '../components/ui/Button.jsx'
import DataSourceBadge from '../components/ui/DataSourceBadge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import FeedbackMessage from '../components/ui/FeedbackMessage.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useLatestReadings } from '../hooks/useLatestReadings.js'
import { useNow } from '../hooks/useNow.js'
import { useStops } from '../hooks/useStops.js'
import { summarizeDashboard } from '../utils/readings.js'

export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { stops, isLoading, error, source } = useStops()
  const {
    readings,
    discardedCount,
    isLoading: readingsLoading,
    isRefreshing,
    error: readingsError,
    lastUpdatedAt,
    isStale,
    refresh,
  } = useLatestReadings()
  const now = useNow()

  const summary = useMemo(() => summarizeDashboard(stops, readings, now), [stops, readings, now])

  const hasStops = !isLoading && !error && stops.length > 0
  // Sem leituras confirmadas pelo banco o estado é desconhecido, não "sem dados".
  const readingsFailed = !readingsLoading && readingsError !== null && lastUpdatedAt === null
  const readingsReady = !readingsLoading && !readingsFailed

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral das condições ambientais nos pontos de ônibus monitorados."
      />

      <DataSourceBadge source={source} />

      <div className="mb-6">
        <RefreshControl
          lastUpdatedAt={lastUpdatedAt}
          isRefreshing={readingsLoading || isRefreshing}
          isStale={isStale}
          error={readingsFailed ? null : readingsError}
          onRefresh={refresh}
          source={source}
        />
      </div>

      {isLoading && (
        <p className="text-slate-600" role="status">
          Carregando pontos…
        </p>
      )}

      {error && (
        <div>
          <FeedbackMessage tone="error">Não foi possível carregar os pontos. {error}</FeedbackMessage>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!isLoading && !error && stops.length === 0 && (
        <EmptyState
          title="Nenhum ponto monitorado"
          message="Não há pontos ativos visíveis. Cadastre ou ative um ponto na área administrativa para acompanhá-lo aqui."
        />
      )}

      {hasStops && readingsLoading && (
        <p className="text-slate-600" role="status">
          Carregando leituras…
        </p>
      )}

      {hasStops && readingsFailed && (
        <div>
          <FeedbackMessage tone="error">
            Não foi possível consultar as leituras. {readingsError.message}
          </FeedbackMessage>
          <Button variant="secondary" onClick={refresh}>
            Tentar novamente
          </Button>
        </div>
      )}

      {discardedCount > 0 && (
        <FeedbackMessage tone="info">
          {discardedCount === 1
            ? '1 leitura recebida foi descartada por estar inválida.'
            : `${discardedCount} leituras recebidas foram descartadas por estarem inválidas.`}
        </FeedbackMessage>
      )}

      {hasStops && readingsReady && (
        <div className="space-y-8">
          <section aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="mb-3 text-xl font-semibold text-slate-900">
              Resumo
            </h2>
            <DashboardSummary summary={summary} />
          </section>

          <section aria-labelledby="latest-heading">
            <h2 id="latest-heading" className="mb-3 text-xl font-semibold text-slate-900">
              Última medição
            </h2>
            <LatestReadingHighlight latest={summary.latest} now={now} />
          </section>

          <ConnectivityRuleNote />

          <section aria-labelledby="evolution-heading">
            <h2 id="evolution-heading" className="mb-3 text-xl font-semibold text-slate-900">
              Evolução recente
            </h2>
            <RecentEvolutionPanel stops={stops} items={summary.items} latest={summary.latest} />
          </section>

          <section aria-labelledby="stops-heading">
            <h2 id="stops-heading" className="mb-3 text-xl font-semibold text-slate-900">
              Pontos monitorados
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {summary.items.map((item) => (
                <li key={item.stop.id}>
                  <StopStatusCard item={item} now={now} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  )
}
