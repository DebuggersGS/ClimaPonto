import { useId, useState } from 'react'
import { useReadingsHistory } from '../../hooks/useReadingsHistory.js'
import EmptyState from '../ui/EmptyState.jsx'
import FeedbackMessage from '../ui/FeedbackMessage.jsx'
import Button from '../ui/Button.jsx'
import StopHistoryLink from '../ui/StopHistoryLink.jsx'
import ReadingsEvolution from '../history/ReadingsEvolution.jsx'
import StopSelect from '../history/StopSelect.jsx'

const PERIOD_ID = '24h'

/**
 * Evolução das últimas 24 horas de UM ponto por vez. Enquanto o usuário não
 * escolhe outro ponto, acompanha o ponto da leitura mais recente. A consulta é
 * refeita quando chega uma leitura nova (reloadKey), sem polling próprio.
 * @param {{ stops: object[], items: Array<{ stop: object, reading: object|null }>, latest: { stop: object }|null }} props
 */
export default function RecentEvolutionPanel({ stops, items, latest }) {
  const selectId = useId()
  const [chosenCode, setChosenCode] = useState(null)

  const defaultCode = latest?.stop.code ?? stops[0]?.code ?? ''
  const chosenStop = stops.find((stop) => stop.code === chosenCode)
  const selectedStop = chosenStop ?? stops.find((stop) => stop.code === defaultCode)
  const latestReadingId = items.find((item) => item.stop.id === selectedStop?.id)?.reading?.id

  const { readings, isLoading, error, retry } = useReadingsHistory({
    stopId: selectedStop?.id,
    periodId: PERIOD_ID,
    reloadKey: latestReadingId,
  })

  if (stops.length === 0) {
    return (
      <EmptyState
        title="Nenhum ponto para exibir"
        message="Quando houver pontos ativos cadastrados, a evolução das últimas 24 horas aparecerá aqui."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:w-80">
          <StopSelect stops={stops} value={selectedStop?.code ?? ''} onChange={setChosenCode} id={selectId} />
        </div>
        {selectedStop && (
          <StopHistoryLink code={selectedStop.code} period={PERIOD_ID}>
            Ver histórico completo
          </StopHistoryLink>
        )}
      </div>

      {!selectedStop && <EmptyState title="Selecione um ponto" message="Escolha um ponto para ver as últimas 24 horas." />}

      {selectedStop && error && (
        <div>
          <FeedbackMessage tone="error">{error.message}</FeedbackMessage>
          <Button variant="secondary" onClick={retry}>
            Tentar novamente
          </Button>
        </div>
      )}

      {selectedStop && !error && isLoading && readings.length === 0 && (
        <p className="text-sm text-slate-600" role="status">
          Carregando leituras…
        </p>
      )}

      {selectedStop && !error && !isLoading && readings.length === 0 && (
        <EmptyState
          title="Sem leituras nas últimas 24 horas"
          message="Este ponto não recebeu leituras visíveis nas últimas 24 horas."
        />
      )}

      {selectedStop && !error && readings.length > 0 && <ReadingsEvolution readings={readings} headingLevel={3} />}
    </div>
  )
}
