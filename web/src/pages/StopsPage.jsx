import { useMemo, useState } from 'react'
import StopsExplorer from '../components/stops/StopsExplorer.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useFavoriteStops } from '../hooks/useFavoriteStops.js'
import { useLatestReadings } from '../hooks/useLatestReadings.js'
import { useNow } from '../hooks/useNow.js'
import { useStops } from '../hooks/useStops.js'
import { summarizeDashboard } from '../utils/readings.js'

function StopsContent({ onRetry }) {
  const { stops, isLoading, error, source } = useStops()
  // Mesma consulta e mesmo polling do Dashboard: estado e conectividade vêm das últimas leituras.
  const { readings, isLoading: readingsLoading, error: readingsError, lastUpdatedAt, refresh } = useLatestReadings()
  const now = useNow()
  const favorites = useFavoriteStops()
  const items = useMemo(() => summarizeDashboard(stops, readings, now).items, [stops, readings, now])

  const readingsFailed = !readingsLoading && readingsError !== null && lastUpdatedAt === null
  const loading = isLoading || readingsLoading
  const ready = !loading && !error && !readingsFailed && stops.length > 0

  return (
    <>

      {loading && !error && <Skeleton shape="chart" label="Carregando pontos…" />}

      {error && (
        <EmptyState
          variant="error"
          title="Não foi possível carregar os pontos"
          message={error}
          action={<Button onClick={onRetry}>Tentar novamente</Button>}
        />
      )}

      {!error && readingsFailed && (
        <EmptyState
          variant="error"
          title="Não foi possível consultar as leituras"
          message={readingsError?.message}
          action={<Button onClick={refresh}>Tentar novamente</Button>}
        />
      )}

      {!loading && !error && !readingsFailed && stops.length === 0 && (
        <EmptyState title="Nenhum ponto cadastrado" message="Quando houver pontos ativos, eles aparecerão aqui." />
      )}

      {ready && <StopsExplorer items={items} now={now} source={source} favorites={favorites} />}
    </>
  )
}

export default function StopsPage() {
  useDocumentTitle('Explorar')
  // Remontar o conteúdo refaz as consultas (useStops não expõe recarga aqui).
  const [attempt, setAttempt] = useState(0)

  return (
    <>
      <PageHeader
        eyebrow="Monitoramento"
        title="Explorar pontos"
        description="Mapa e lista dos pontos de ônibus acompanhados pelo ClimaPonto, com ficha, favoritos e acesso ao histórico de cada um."
      />
      <StopsContent key={attempt} onRetry={() => setAttempt((n) => n + 1)} />
    </>
  )
}
