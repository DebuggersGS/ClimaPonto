import { useMemo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { getDashboardPhase } from '../components/dashboard/dashboardPhase.js'
import DashboardHero from '../components/dashboard/DashboardHero.jsx'
import {
  DashboardError,
  DashboardSkeleton,
  NoStopsState,
  UnconfiguredState,
} from '../components/dashboard/DashboardStates.jsx'
import DashboardSummary from '../components/dashboard/DashboardSummary.jsx'
import LatestReadingHighlight from '../components/dashboard/LatestReadingHighlight.jsx'
import RecentEvolutionPanel from '../components/dashboard/RecentEvolutionPanel.jsx'
import RefreshControl from '../components/dashboard/RefreshControl.jsx'
import StopGrid from '../components/dashboard/StopGrid.jsx'
import AlertsPanel from '../components/dashboard/AlertsPanel.jsx'
import InsightsPanel from '../components/dashboard/InsightsPanel.jsx'
import StopComparison from '../components/dashboard/StopComparison.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs.jsx'
import MethodologyNote from '../components/ui/MethodologyNote.jsx'
import DataSourceBadge from '../components/ui/DataSourceBadge.jsx'
import NoResultsState from '../components/ui/NoResultsState.jsx'
import StopFilterBar from '../components/ui/StopFilterBar.jsx'
import FeedbackMessage from '../components/ui/FeedbackMessage.jsx'
import Section from '../components/ui/Section.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useLatestReadings } from '../hooks/useLatestReadings.js'
import { useStopFilters } from '../hooks/useStopFilters.js'
import { useNow } from '../hooks/useNow.js'
import { useStops } from '../hooks/useStops.js'
import { summarizeDashboard } from '../utils/readings.js'
import { deriveStopAlerts } from '../utils/stopAlerts.js'
import { buildDashboardInsights } from '../utils/dashboardInsights.js'

const PHASE_TRANSITION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
}

function discardedMessage(count) {
  return count === 1
    ? '1 leitura recebida foi descartada por estar inválida.'
    : `${count} leituras recebidas foram descartadas por estarem inválidas.`
}

function ReadyContent({ stops, summary, now, source }) {
  // Os filtros só afetam a lista "Pontos monitorados"; Resumo, Última medição,
  // Insights e Evolução continuam calculados sobre todos os pontos.
  const filter = useStopFilters(summary.items, { now })
  const insights = useMemo(() => buildDashboardInsights(summary, now), [summary, now])
  const alerts = useMemo(() => deriveStopAlerts(summary.items, { now }), [summary, now])
  return (
    <>
      <AlertsPanel alerts={alerts} />
      <div className="mb-section grid grid-cols-1 gap-x-5 gap-y-8 lg:grid-cols-12">
        <Section title="Resumo" eyebrow="Visão geral" className="mb-0 min-w-0 lg:col-span-7">
          <DashboardSummary summary={summary} />
        </Section>

        <Section title="Última medição" eyebrow="Em destaque" className="mb-0 min-w-0 lg:col-span-5">
          <LatestReadingHighlight latest={summary.latest} now={now} />
        </Section>

        <MethodologyNote className="col-span-full" />
      </div>

      {/* Detalhes sob demanda: evolução, insights e comparação ficam em abas para reduzir a poluição visual. */}
      <Section title="Detalhes" eyebrow="Sob demanda" description="Séries, comparações e insights calculados a partir das leituras exibidas.">
        <Tabs defaultValue="evolucao">
          <TabsList aria-label="Detalhes da visão geral">
            <TabsTrigger value="evolucao">Evolução (24 h)</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="comparar">Comparar pontos</TabsTrigger>
          </TabsList>
          <TabsContent value="evolucao">
            <RecentEvolutionPanel stops={stops} items={summary.items} latest={summary.latest} />
          </TabsContent>
          <TabsContent value="insights">
            <div className="max-w-3xl space-y-4">
              <DataSourceBadge source={source} />
              <InsightsPanel insights={insights} />
            </div>
          </TabsContent>
          <TabsContent value="comparar">
            <StopComparison stops={stops} />
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Pontos monitorados" eyebrow="Por ponto">
        <StopFilterBar filter={filter} dimensions={['environmental', 'connectivity']} />
        {filter.results.length === 0 ? (
          <NoResultsState onClear={filter.clear} />
        ) : (
          <StopGrid items={filter.results} now={now} />
        )}
      </Section>
    </>
  )
}

export default function DashboardPage() {
  useDocumentTitle('Visão geral')
  const { stops, isLoading, error, source } = useStops()
  const reducedMotion = useReducedMotion()
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

  // Sem leituras confirmadas pelo banco o estado é desconhecido, não "sem dados".
  const readingsFailed = !readingsLoading && readingsError !== null && lastUpdatedAt === null
  const phase = getDashboardPhase({
    source,
    stopsLoading: isLoading,
    stopsError: error,
    stopCount: stops.length,
    readingsLoading,
    readingsFailed,
  })

  return (
    <>
      <DashboardHero source={source}>
        <RefreshControl
          lastUpdatedAt={lastUpdatedAt}
          isRefreshing={readingsLoading || isRefreshing}
          isStale={isStale}
          error={readingsFailed ? null : readingsError}
          onRefresh={refresh}
          source={source}
        />
      </DashboardHero>

      {discardedCount > 0 && (
        <FeedbackMessage tone="info">{discardedMessage(discardedCount)}</FeedbackMessage>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={phase} {...(reducedMotion ? {} : PHASE_TRANSITION)}>
          {phase === 'loading' && <DashboardSkeleton />}
          {phase === 'unconfigured' && <UnconfiguredState />}
          {phase === 'empty' && <NoStopsState />}
          {phase === 'stops-error' && (
            <DashboardError
              title="Não foi possível carregar os pontos"
              message={error}
              onRetry={() => window.location.reload()}
            />
          )}
          {phase === 'readings-error' && (
            <DashboardError
              title="Não foi possível consultar as leituras"
              message={readingsError?.message}
              onRetry={refresh}
            />
          )}
          {phase === 'ready' && <ReadyContent stops={stops} summary={summary} now={now} source={source} />}
        </motion.div>
      </AnimatePresence>
    </>
  )
}
