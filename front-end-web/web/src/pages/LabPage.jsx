import { useMemo } from 'react'
import SensorLab from '../components/stops/SensorLab.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useLatestReadings } from '../hooks/useLatestReadings.js'
import { useNow } from '../hooks/useNow.js'
import { useStops } from '../hooks/useStops.js'
import { getSensorLabScenarios } from '../services/sensorLab.js'
import { summarizeDashboard } from '../utils/readings.js'

/**
 * Laboratório de sensores: área isolada de demonstração. Só existe conteúdo no modo mock;
 * nos demais modos a página explica por que está vazia, sem inventar cenários.
 */
export default function LabPage() {
  useDocumentTitle('Laboratório')
  const { stops, isLoading, error } = useStops()
  const { readings, isLoading: readingsLoading, error: readingsError, lastUpdatedAt } = useLatestReadings()
  const now = useNow()
  const scenarios = useMemo(() => getSensorLabScenarios(), [])
  const items = useMemo(() => summarizeDashboard(stops, readings, now).items, [stops, readings, now])
  const loading = isLoading || readingsLoading
  // Sem leituras confirmadas a conectividade dos cenários seria inventada: mostra o erro em vez do laboratório.
  const readingsFailed = !readingsLoading && readingsError !== null && lastUpdatedAt === null

  return (
    <>
      <PageHeader
        eyebrow="Demonstração"
        title="Laboratório"
        description="Cenários simulados para conferir como a interface reage a cada estado de sensor. Fica separado do monitoramento: nada aqui é medição real."
      />
      {scenarios === null ? (
        <EmptyState
          variant="info"
          title="Disponível só no modo demonstração"
          message="O laboratório usa cenários simulados e não aparece com dados reais. Ative o modo demonstração para usá-lo."
        />
      ) : error || readingsFailed ? (
        <EmptyState
          variant="error"
          title={error ? 'Não foi possível carregar os pontos' : 'Não foi possível consultar as leituras'}
          message={error ?? readingsError?.message}
        />
      ) : loading ? (
        <Skeleton shape="chart" label="Carregando cenários…" />
      ) : (
        <SensorLab scenarios={scenarios} items={items} />
      )}
    </>
  )
}
