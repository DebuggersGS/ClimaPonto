import { useId } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSearchParams } from 'react-router'
import HistoryHeader from '../components/history/HistoryHeader.jsx'
import PeriodFilter from '../components/history/PeriodFilter.jsx'
import ReadingsEvolution from '../components/history/ReadingsEvolution.jsx'
import ReadingsTable from '../components/history/ReadingsTable.jsx'
import StopSelect from '../components/history/StopSelect.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import FeedbackMessage from '../components/ui/FeedbackMessage.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useReadingsHistory } from '../hooks/useReadingsHistory.js'
import { useStops } from '../hooks/useStops.js'
import { HISTORY_LIMIT, HISTORY_PERIODS, parsePeriodId } from '../utils/historyPeriods.js'

const FADE = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.2 } }

function SectionTitle({ id, children }) {
  return (
    <h2 id={id} className="mb-3 text-xl font-semibold text-slate-900">
      {children}
    </h2>
  )
}

function LoadingState() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton shape="chart" label="Carregando leituras…" />
      <Skeleton shape="table" rows={6} label="Carregando tabela de leituras…" />
    </div>
  )
}

function ResultsContent({ stop, period, periodId, readings, truncated, discardedCount }) {
  return (
    <div className="space-y-6">
      {truncated && (
        <FeedbackMessage tone="info" className="mb-0">
          Exibindo as {HISTORY_LIMIT} leituras mais recentes do período; leituras mais antigas foram omitidas.
        </FeedbackMessage>
      )}
      {discardedCount > 0 && (
        <FeedbackMessage tone="info" className="mb-0">
          {discardedCount === 1
            ? '1 leitura recebida foi descartada por estar inválida.'
            : `${discardedCount} leituras recebidas foram descartadas por estarem inválidas.`}
        </FeedbackMessage>
      )}
      <section aria-labelledby="evolution-heading">
        <SectionTitle id="evolution-heading">Evolução</SectionTitle>
        <ReadingsEvolution readings={readings} periodId={periodId} headingLevel={3} />
      </section>
      <section aria-labelledby="table-heading">
        <SectionTitle id="table-heading">Leituras</SectionTitle>
        <ReadingsTable readings={readings} caption={`Leituras de ${stop.name} (${stop.code}) — ${period.label.toLowerCase()}`} />
      </section>
    </div>
  )
}

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

  const unconfigured = source === 'unconfigured'
  const notFound = !stopsLoading && !stopsError && !unconfigured && code !== '' && !stop
  const showResults = Boolean(stop) && !error
  const loading = showResults && isLoading && readings.length === 0
  const empty = showResults && !isLoading && readings.length === 0

  let content = null
  let contentKey = 'none'
  if (stopsLoading) {
    contentKey = 'stops-loading'
    content = <LoadingState />
  } else if (unconfigured) {
    contentKey = 'unconfigured'
    content = (
      <EmptyState
        variant="warning"
        title="Supabase não configurado"
        message="Não há fonte de dados configurada, então o histórico não pode ser exibido. Configure o Supabase ou use o modo de demonstração."
      />
    )
  } else if (stopsError) {
    contentKey = 'stops-error'
    content = <EmptyState variant="error" title="Não foi possível carregar os pontos" message={stopsError} />
  } else if (!code) {
    contentKey = 'no-stop'
    content = <EmptyState variant="info" title="Selecione um ponto" message="Escolha um ponto monitorado para ver o histórico de leituras." />
  } else if (notFound) {
    contentKey = 'not-found'
    content = (
      <EmptyState
        variant="warning"
        title="Ponto não encontrado ou inativo"
        message={`Não há ponto visível com o código "${code.slice(0, 32)}${code.length > 32 ? '…' : ''}". Escolha outro ponto na lista.`}
      />
    )
  } else if (stop && error) {
    contentKey = 'error'
    content = (
      <EmptyState
        variant="error"
        title="Não foi possível carregar as leituras"
        message={error.message}
        action={<Button variant="secondary" onClick={retry}>Tentar novamente</Button>}
      />
    )
  } else if (loading) {
    contentKey = 'loading'
    content = <LoadingState />
  } else if (empty) {
    contentKey = `empty-${stop.code}-${periodId}`
    const others = HISTORY_PERIODS.filter((item) => item.id !== periodId)
    content = (
      <EmptyState
        title="Nenhuma leitura no período"
        message={`${stop.name} não tem leituras visíveis em: ${period.label.toLowerCase()}. Tente outro período.`}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {others.map((item) => (
              <Button key={item.id} variant="secondary" onClick={() => updateParams({ periodo: item.id })}>
                {item.label}
              </Button>
            ))}
          </div>
        }
      />
    )
  } else if (showResults) {
    contentKey = `results-${stop.code}-${periodId}`
    content = (
      <ResultsContent
        stop={stop}
        period={period}
        periodId={periodId}
        readings={readings}
        truncated={truncated}
        discardedCount={discardedCount}
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Histórico"
        description="Registro das leituras de temperatura e umidade ao longo do tempo."
      />

      <HistoryHeader stop={stop} period={period} source={source} />

      {/* Fixa só a partir de sm: no celular a topbar quebra em várias linhas e cobriria o filtro. */}
      <Card variant="glass" className="z-30 mb-6 sm:sticky sm:top-20" aria-label="Filtros do histórico">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="sm:w-80">
            <StopSelect stops={stops} value={stop?.code ?? ''} onChange={(value) => updateParams({ ponto: value })} id={selectId} />
          </div>
          <PeriodFilter value={periodId} onChange={(value) => updateParams({ periodo: value })} />
        </div>
      </Card>

      <div className="min-h-64">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={contentKey} {...FADE}>
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
