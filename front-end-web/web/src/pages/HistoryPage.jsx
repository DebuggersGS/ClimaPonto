import { useId } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link, useSearchParams } from 'react-router'
import HistoryHeader from '../components/history/HistoryHeader.jsx'
import PeriodFilter from '../components/history/PeriodFilter.jsx'
import ReadingsEvolution from '../components/history/ReadingsEvolution.jsx'
import ReadingsTable from '../components/history/ReadingsTable.jsx'
import DailySummary from '../components/history/DailySummary.jsx'
import CollapsibleSection from '../components/history/CollapsibleSection.jsx'
import ExportReportButton from '../components/history/ExportReportButton.jsx'
import ReadingQuality from '../components/history/ReadingQuality.jsx'
import ReadingsTimeline from '../components/history/ReadingsTimeline.jsx'
import TemporalProfile from '../components/history/TemporalProfile.jsx'
import ExportCsvButton from '../components/history/ExportCsvButton.jsx'
import OriginSelect from '../components/history/OriginSelect.jsx'
import StopSelect from '../components/history/StopSelect.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import FeedbackMessage from '../components/ui/FeedbackMessage.jsx'
import MethodologyNote from '../components/ui/MethodologyNote.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useReadingsHistory } from '../hooks/useReadingsHistory.js'
import { useStops } from '../hooks/useStops.js'
import { ALL_ORIGINS, buildOriginOptions, filterByOrigin, parseOriginId } from '../utils/historyExploration.js'
import { getReadingSourceInfo } from '../utils/readings.js'
import { HISTORY_LIMIT, HISTORY_PERIODS, parsePeriodId } from '../utils/historyPeriods.js'

/**
 * Três visões sobre as mesmas leituras (mesmos filtros e parâmetros de URL):
 * Histórico (leituras e evolução), Análises (perfis, linha do tempo e qualidade) e Relatórios (exportações).
 */
const VIEWS = {
  historico: {
    title: 'Histórico',
    description: 'Registro das leituras de temperatura e umidade ao longo do tempo.',
    emptyHint: 'Escolha um ponto monitorado para ver o histórico de leituras.',
  },
  analises: {
    title: 'Análises',
    description: 'Perfis por horário e dia da semana, linha do tempo e qualidade das medições de um ponto.',
    emptyHint: 'Escolha um ponto monitorado para analisar o período.',
  },
  relatorios: {
    title: 'Relatórios',
    description: 'Exporte as leituras de um ponto em CSV ou gere o relatório-resumo do período.',
    emptyHint: 'Escolha um ponto monitorado para exportar leituras e relatórios.',
  },
}

const FADE = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.2 } }

function SectionTitle({ id, children }) {
  return (
    <h2 id={id} className="mb-3 text-2xl font-semibold tracking-tight text-slate-900">
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

function ExportActions({ readings, stop, periodId, originId }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ExportCsvButton readings={readings} stop={stop} periodId={periodId} originId={originId} />
      <ExportReportButton readings={readings} stop={stop} periodId={periodId} />
    </div>
  )
}

function Notices({ truncated, discardedCount }) {
  return (
    <>
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
    </>
  )
}

function AnalysisContent({ readings, periodId, truncated, discardedCount }) {
  return (
    <section aria-labelledby="analysis-heading" className="space-y-3">
      <SectionTitle id="analysis-heading">Análises do período</SectionTitle>
      <CollapsibleSection title="Por horário do dia">
        <TemporalProfile readings={readings} kind="hour" periodId={periodId} />
      </CollapsibleSection>
      <CollapsibleSection title="Por dia da semana">
        <TemporalProfile readings={readings} kind="weekday" periodId={periodId} />
      </CollapsibleSection>
      <CollapsibleSection title="Linha do tempo">
        <ReadingsTimeline readings={readings} />
      </CollapsibleSection>
      <CollapsibleSection title="Qualidade das medições">
        <ReadingQuality readings={readings} periodId={periodId} discardedCount={discardedCount} truncated={truncated} />
      </CollapsibleSection>
      <MethodologyNote />
    </section>
  )
}

function ReadingsContent({ stop, period, periodId, originId, readings }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DailySummary readings={readings} />
        <ExportActions readings={readings} stop={stop} periodId={periodId} originId={originId} />
      </div>
      <section aria-labelledby="evolution-heading">
        <SectionTitle id="evolution-heading">Evolução</SectionTitle>
        <ReadingsEvolution readings={readings} periodId={periodId} headingLevel={3} />
      </section>
      <section aria-labelledby="table-heading">
        <SectionTitle id="table-heading">Leituras</SectionTitle>
        <ReadingsTable readings={readings} caption={`Leituras de ${stop.name} (${stop.code}) — ${period.label.toLowerCase()}`} />
      </section>
    </>
  )
}

function ReportsContent({ stop, periodId, originId, readings }) {
  return (
    <>
      <DailySummary readings={readings} />
      <section aria-labelledby="export-heading" className="space-y-3">
        <SectionTitle id="export-heading">Exportar</SectionTitle>
        <p className="max-w-2xl text-sm text-slate-700">
          O CSV de leituras traz cada leitura do período e da origem escolhidos; o relatório-resumo traz as estatísticas
          do período. Ambos usam só as leituras carregadas para {stop.name} ({stop.code}).
        </p>
        <ExportActions readings={readings} stop={stop} periodId={periodId} originId={originId} />
      </section>
      <MethodologyNote />
    </>
  )
}

function ResultsContent({ view, ...props }) {
  const { readings, truncated, discardedCount, periodId } = props
  return (
    <div className="space-y-6">
      <Notices truncated={truncated} discardedCount={discardedCount} />
      {view === 'analises' && (
        <>
          <DailySummary readings={readings} />
          <AnalysisContent readings={readings} periodId={periodId} truncated={truncated} discardedCount={discardedCount} />
        </>
      )}
      {view === 'relatorios' && <ReportsContent {...props} />}
      {view === 'historico' && <ReadingsContent {...props} />}
    </div>
  )
}

/** Atalhos entre as visões, preservando ponto, período e origem escolhidos. */
function ViewLinks({ view, search }) {
  const links = [
    ['historico', '/historico', 'Ver leituras'],
    ['analises', '/analises', 'Ver análises'],
    ['relatorios', '/relatorios', 'Ver relatórios'],
  ].filter(([id]) => id !== view)
  return (
    <>
      {links.map(([id, to, label]) => (
        <Link
          key={id}
          to={`${to}${search}`}
          className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-200"
        >
          {label}
        </Link>
      ))}
    </>
  )
}

/**
 * @param {{ view?: 'historico'|'analises'|'relatorios' }} props
 */
export default function HistoryPage({ view = 'historico' }) {
  const config = VIEWS[view]
  useDocumentTitle(config.title)
  const selectId = useId()
  const reducedMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const { stops, isLoading: stopsLoading, error: stopsError, reload: reloadStops, source } = useStops()

  const code = searchParams.get('ponto') ?? ''
  const periodId = parsePeriodId(searchParams.get('periodo'))
  const period = HISTORY_PERIODS.find((item) => item.id === periodId)
  const stop = stops.find((item) => item.code === code)

  const originId = parseOriginId(searchParams.get('origem'))
  const { readings: allReadings, truncated, discardedCount, isLoading, error, retry } = useReadingsHistory({
    stopId: stop?.id,
    periodId,
  })
  const originOptions = buildOriginOptions(allReadings)
  const readings = filterByOrigin(allReadings, originId)

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
  const empty = showResults && !isLoading && allReadings.length === 0
  const emptyByOrigin = showResults && !isLoading && allReadings.length > 0 && readings.length === 0

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
    content = (
      <EmptyState
        variant="error"
        title="Não foi possível carregar os pontos"
        message={stopsError}
        action={<Button variant="secondary" onClick={reloadStops}>Tentar novamente</Button>}
      />
    )
  } else if (!code) {
    contentKey = 'no-stop'
    content = <EmptyState variant="info" title="Selecione um ponto" message={config.emptyHint} />
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
  } else if (emptyByOrigin) {
    contentKey = `empty-origin-${stop.code}-${periodId}-${originId}`
    content = (
      <EmptyState
        title="Nenhuma leitura com esta origem"
        message={`Não há leituras de origem "${getReadingSourceInfo(originId).label}" para ${stop.name} em: ${period.label.toLowerCase()}.`}
        action={<Button variant="secondary" onClick={() => updateParams({ origem: '' })}>Mostrar todas as origens</Button>}
      />
    )
  } else if (showResults) {
    contentKey = `results-${stop.code}-${periodId}-${originId}`
    content = (
      <ResultsContent
        view={view}
        stop={stop}
        period={period}
        periodId={periodId}
        originId={originId}
        readings={readings}
        truncated={truncated}
        discardedCount={discardedCount}
      />
    )
  }

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={<ViewLinks view={view} search={searchParams.toString() ? `?${searchParams.toString()}` : ''} />}
      />

      <HistoryHeader stop={stop} period={period} source={source} />

      {/* Fixa só a partir de sm: no celular a topbar quebra em várias linhas e cobriria o filtro. */}
      <Card variant="glass" className="z-30 mb-6 sm:sticky sm:top-20" aria-label="Filtros do histórico">
        <div role="group" aria-label="Ponto, origem e período" className="flex flex-col gap-x-6 gap-y-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="sm:w-md sm:max-w-full">
            <StopSelect stops={stops} value={stop?.code ?? ''} onChange={(value) => updateParams({ ponto: value })} id={selectId} />
          </div>
          <OriginSelect
            options={originOptions}
            value={originId}
            onChange={(value) => updateParams({ origem: value === ALL_ORIGINS ? '' : value })}
            id={`${selectId}-origem`}
          />
          <PeriodFilter value={periodId} onChange={(value) => updateParams({ periodo: value })} />
          {(originId !== ALL_ORIGINS || searchParams.get('periodo')) && (
            <Button variant="secondary" onClick={() => updateParams({ origem: '', periodo: '' })}>
              Limpar filtros
            </Button>
          )}
        </div>
      </Card>

      <div className="min-h-64">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={contentKey} {...(reducedMotion ? {} : FADE)}>
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
