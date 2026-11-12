import Card from '../components/ui/Card.jsx'
import DataSourceBadge from '../components/ui/DataSourceBadge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import StopHistoryLink from '../components/ui/StopHistoryLink.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useStops } from '../hooks/useStops.js'

export default function StopsPage() {
  useDocumentTitle('Pontos')
  const { stops, isLoading, error, source } = useStops()

  return (
    <>
      <PageHeader
        title="Pontos"
        description="Pontos de ônibus acompanhados pelo ClimaPonto. O cadastro e a edição serão adicionados em etapa futura."
      />

      <DataSourceBadge source={source} />

      {isLoading && <p className="text-slate-600" role="status">Carregando pontos…</p>}

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          Não foi possível carregar os pontos. {error}
        </p>
      )}

      {!isLoading && !error && stops.length === 0 && (
        <EmptyState title="Nenhum ponto cadastrado" />
      )}

      {!isLoading && !error && stops.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stops.map((stop) => (
            <li key={stop.id}>
              <Card title={stop.name} className="h-full">
                <p className="font-mono text-xs text-slate-500">{stop.code}</p>
                <p className="mt-2">{stop.neighborhood}</p>
                {stop.description && <p className="mt-1 text-slate-500">{stop.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                  {stop.isDemo && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">Demonstrativo</span>
                  )}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Sem sensor vinculado</span>
                </div>
                <div className="mt-3 border-t border-slate-100 pt-2">
                  <StopHistoryLink code={stop.code} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
