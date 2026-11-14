import { useMemo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import ConnectivityRuleNote from '../components/dashboard/ConnectivityRuleNote.jsx'
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
import FeedbackMessage from '../components/ui/FeedbackMessage.jsx'
import Section from '../components/ui/Section.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useLatestReadings } from '../hooks/useLatestReadings.js'
import { useNow } from '../hooks/useNow.js'
import { useStops } from '../hooks/useStops.js'
import { summarizeDashboard } from '../utils/readings.js'

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

function ReadyContent({ stops, summary, now }) {
  return (
    <>
      <Section title="Resumo" eyebrow="Visão geral">
        <DashboardSummary summary={summary} />
      </Section>

      <Section title="Última medição" eyebrow="Em destaque">
        <LatestReadingHighlight latest={summary.latest} now={now} />
      </Section>

      <div className="mb-section">
        <ConnectivityRuleNote />
      </div>

      <Section title="Evolução recente" eyebrow="Últimas 24 horas">
        <RecentEvolutionPanel stops={stops} items={summary.items} latest={summary.latest} />
      </Section>

      <Section title="Pontos monitorados" eyebrow="Por ponto">
        <StopGrid items={summary.items} now={now} />
      </Section>
    </>
  )
}

export default function DashboardPage() {
  useDocumentTitle('Dashboard')
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
          {phase === 'ready' && <ReadyContent stops={stops} summary={summary} now={now} />}
        </motion.div>
      </AnimatePresence>
    </>
  )
}
