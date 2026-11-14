import { MapPin } from 'lucide-react'
import { useState } from 'react'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import DataSourceBadge from '../components/ui/DataSourceBadge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import NoResultsState from '../components/ui/NoResultsState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { AnimatedItem, AnimatedList } from '../components/ui/Reveal.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import StopFilterBar from '../components/ui/StopFilterBar.jsx'
import StopHistoryLink from '../components/ui/StopHistoryLink.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useStopFilters } from '../hooks/useStopFilters.js'
import { useStops } from '../hooks/useStops.js'

function StopCard({ stop }) {
  return (
    <Card interactive className="h-full">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100"
        >
          <MapPin className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold break-words text-slate-900">{stop.name}</h2>
          <span className="mt-1 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
            {stop.code}
          </span>
        </div>
      </div>
      <p className="mt-3 font-medium text-slate-800">{stop.neighborhood}</p>
      {stop.description && <p className="mt-1 break-words text-slate-600">{stop.description}</p>}
      {(stop.isDemo || stop.active === false) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {stop.isDemo && (
            <Badge tone="demo" icon="Sparkles" size="sm">
              Demonstrativo
            </Badge>
          )}
          {stop.active === false && (
            <Badge tone="neutral" size="sm">
              Inativo
            </Badge>
          )}
        </div>
      )}
      <div className="mt-3 border-t border-slate-100 pt-2">
        <StopHistoryLink code={stop.code} />
      </div>
    </Card>
  )
}

function StopList({ stops }) {
  const filter = useStopFilters(stops)
  return (
    <>
      <StopFilterBar filter={filter} dimensions={['neighborhood']} />
      {filter.results.length === 0 ? (
        <NoResultsState onClear={filter.clear} />
      ) : (
        <AnimatedList as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filter.results.map((stop) => (
            <AnimatedItem as="li" key={stop.id}>
              <StopCard stop={stop} />
            </AnimatedItem>
          ))}
        </AnimatedList>
      )}
    </>
  )
}

function StopsContent({ onRetry }) {
  const { stops, isLoading, error, source } = useStops()

  return (
    <>
      <DataSourceBadge source={source} />

      {isLoading && <Skeleton shape="chart" label="Carregando pontos…" />}

      {error && (
        <EmptyState
          variant="error"
          title="Não foi possível carregar os pontos"
          message={error}
          action={<Button onClick={onRetry}>Tentar novamente</Button>}
        />
      )}

      {!isLoading && !error && stops.length === 0 && (
        <EmptyState title="Nenhum ponto cadastrado" message="Quando houver pontos ativos, eles aparecerão aqui." />
      )}

      {!isLoading && !error && stops.length > 0 && <StopList stops={stops} />}
    </>
  )
}

export default function StopsPage() {
  useDocumentTitle('Pontos')
  // Remontar o conteúdo refaz a consulta (useStops não expõe recarga).
  const [attempt, setAttempt] = useState(0)

  return (
    <>
      <PageHeader
        eyebrow="Monitoramento"
        title="Pontos"
        description="Pontos de ônibus acompanhados pelo ClimaPonto, com acesso direto ao histórico de cada um."
      />
      <StopsContent key={attempt} onRetry={() => setAttempt((n) => n + 1)} />
    </>
  )
}
