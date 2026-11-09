import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useStops } from '../hooks/useStops.js'

export default function StopsPage() {
  useDocumentTitle('Pontos')
  const { stops, isLoading, error } = useStops()

  return (
    <>
      <PageHeader
        title="Pontos"
        description="Pontos de ônibus acompanhados pelo ClimaPonto. O cadastro e a edição serão adicionados em etapa futura."
      />

      {isLoading && <p className="text-slate-600" role="status">Carregando pontos…</p>}

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          Não foi possível carregar os pontos: {error}
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
                <p>{stop.address}</p>
                <p className="mt-1 text-slate-500">Região: {stop.region}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Sem sensor vinculado
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
