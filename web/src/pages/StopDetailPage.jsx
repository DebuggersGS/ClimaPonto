import { useEffect } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router'
import ComparisonTab from '../components/point360/ComparisonTab.jsx'
import MeasurementsTab from '../components/point360/MeasurementsTab.jsx'
import OverviewTab from '../components/point360/OverviewTab.jsx'
import PointHeader from '../components/point360/PointHeader.jsx'
import QualityTab from '../components/point360/QualityTab.jsx'
import PeriodFilter from '../components/history/PeriodFilter.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useFavoriteStops } from '../hooks/useFavoriteStops.js'
import { useNow } from '../hooks/useNow.js'
import { useStopInsights } from '../hooks/useStopInsights.js'
import { useStops } from '../hooks/useStops.js'
import { HISTORY_PERIODS, parsePeriodId } from '../utils/historyPeriods.js'

/** Mesma chave da barra lateral (SidebarQuickLinks): só o código do último ponto aberto. */
const LAST_STOP_KEY = 'climaponto:ultimo-ponto'

const TABS = [
  { value: 'visao', label: 'Visão' },
  { value: 'medicoes', label: 'Medições' },
  { value: 'comparacao', label: 'Comparação' },
  { value: 'qualidade', label: 'Qualidade' },
]
const DEFAULT_TAB = TABS[0].value
const DEFAULT_VARIABLE = 'temperatureC'
// URL em português; o valor interno é o campo da leitura.
const VARIABLE_PARAMS = { temperatura: 'temperatureC', umidade: 'humidityPct' }
const VARIABLE_TO_PARAM = Object.fromEntries(Object.entries(VARIABLE_PARAMS).map(([param, field]) => [field, param]))

const parseTab = (value) => (TABS.some((tab) => tab.value === value) ? value : DEFAULT_TAB)
const parseVariable = (value) => (Object.hasOwn(VARIABLE_PARAMS, value) ? VARIABLE_PARAMS[value] : DEFAULT_VARIABLE)

function BackToMap() {
  return (
    <Link
      to="/pontos"
      className="inline-flex min-h-10 items-center rounded-full bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      Voltar ao mapa
    </Link>
  )
}

function rememberLastStop(code) {
  try {
    window.localStorage.setItem(LAST_STOP_KEY, code)
  } catch {
    // Sem persistência: o atalho "último ponto" só não será lembrado.
  }
}

function StopContent({ stop, stops }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isFavorite, toggle } = useFavoriteStops()
  const now = useNow(60000)
  const tab = parseTab(searchParams.get('aba'))
  const periodId = parsePeriodId(searchParams.get('periodo'))
  const period = HISTORY_PERIODS.find((item) => item.id === periodId)
  const variable = parseVariable(searchParams.get('variavel'))
  const otherCode = searchParams.get('comparar') ?? ''
  const insights = useStopInsights({ stop, periodId, now })

  useDocumentTitle(stop.name)
  useEffect(() => rememberLastStop(stop.code), [stop.code])

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setSearchParams(next, { replace: true })
  }

  const hasData = insights.readings.length > 0
  let body
  if (insights.isLoading && !hasData) {
    body = <Skeleton shape="chart" label="Carregando leituras…" />
  } else if (insights.error) {
    body = (
      <EmptyState
        variant="error"
        title="Não foi possível carregar as leituras"
        message={insights.error.message}
        action={<Button variant="secondary" onClick={insights.retry}>Tentar novamente</Button>}
      />
    )
  }

  const common = { stop, insights, periodId, periodLabel: period.label, now }
  const variableProps = { variable, onVariableChange: (field) => updateParams({ variavel: VARIABLE_TO_PARAM[field] }) }

  return (
    <>
      <PointHeader stop={stop} isFavorite={isFavorite(stop.code)} onToggleFavorite={() => toggle(stop.code)} />
      <div className="mb-4">
        <PeriodFilter value={periodId} onChange={(value) => updateParams({ periodo: value })} />
      </div>
      <Tabs value={tab} onValueChange={(value) => updateParams({ aba: value === DEFAULT_TAB ? '' : value })}>
        <TabsList aria-label="Seções do ponto">
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="visao">{body ?? <OverviewTab {...common} />}</TabsContent>
        <TabsContent value="medicoes">{body ?? <MeasurementsTab {...common} {...variableProps} />}</TabsContent>
        <TabsContent value="comparacao">
          {body ?? (
            <ComparisonTab
              {...common}
              stops={stops}
              {...variableProps}
              otherCode={otherCode}
              onOtherChange={(code) => updateParams({ comparar: code })}
            />
          )}
        </TabsContent>
        <TabsContent value="qualidade">{body ?? <QualityTab {...common} />}</TabsContent>
      </Tabs>
    </>
  )
}

/**
 * Ponto 360°: página de um ponto, por id ou código (/pontos/:id).
 * Período, aba, variável e ponto comparado ficam na URL (?periodo, ?aba, ?variavel, ?comparar).
 */
export default function StopDetailPage() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { stops, isLoading, error, reload, source } = useStops()
  const stop = stops.find((item) => item.id === id || item.code === id)
  useDocumentTitle(stop?.name ?? 'Ponto')

  if (isLoading) return <Skeleton shape="chart" label="Carregando ponto…" />
  if (source === 'unconfigured' || error) {
    return (
      <EmptyState
        variant="error"
        title="Não foi possível carregar os pontos"
        message={error ?? 'Não há fonte de dados configurada.'}
        action={<Button variant="secondary" onClick={reload}>Tentar novamente</Button>}
      />
    )
  }
  if (!stop) {
    return (
      <EmptyState
        variant="warning"
        title="Ponto não encontrado"
        message="Não há ponto ativo com este identificador. Ele pode ter sido removido ou o endereço pode estar incorreto."
        action={<BackToMap />}
      />
    )
  }
  // Endereço canônico por código: o atalho "último ponto" e os links compartilhados usam sempre o mesmo formato.
  if (id !== stop.code) {
    const search = searchParams.toString()
    return <Navigate to={`/pontos/${encodeURIComponent(stop.code)}${search ? `?${search}` : ''}`} replace />
  }
  return <StopContent stop={stop} stops={stops} />
}
