import { useCallback, useEffect, useState } from 'react'
import { dataMode } from '../services/dataSource.js'
import { isAbortedError, listReadingHistory } from '../services/readingsService.js'

const EMPTY_READINGS = []

/**
 * Histórico de leituras de um ponto em um período (da mais recente à mais antiga).
 *
 * Retorno: { readings, truncated, discardedCount, from, isLoading, error, retry, source },
 * onde source é o modo efetivo de dados ('mock' | 'supabase' | 'unconfigured').
 *
 * Regras:
 * - sem stopId: estado ocioso (readings [], isLoading false, nenhuma consulta);
 * - ao mudar stopId ou periodId os dados do ponto/período anterior NÃO são
 *   devolvidos: ficam vazios (isLoading true) até a nova resposta;
 * - ao mudar só reloadKey (mesmo ponto/período, ex.: id da última leitura do
 *   ponto) os dados atuais continuam visíveis enquanto recarrega, sem piscar;
 *   isLoading fica true durante a recarga;
 * - a requisição anterior é abortada e respostas atrasadas são ignoradas;
 * - cancelamento nunca vira erro; não há polling próprio;
 * - retry (estável) refaz a consulta atual.
 *
 * @param {{ stopId?: string, periodId?: string, reloadKey?: string|number }} [options]
 */
export function useReadingsHistory({ stopId, periodId, reloadKey } = {}) {
  // Resultado/erro guardam a chave (ponto+período) a que pertencem.
  const [state, setState] = useState({ key: null, result: null, error: null })
  const [isFetching, setIsFetching] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const key = stopId ? `${stopId}|${periodId ?? ''}` : null

  useEffect(() => {
    if (!key) return undefined
    const controller = new AbortController()
    setIsFetching(true)
    // Mesma chave: mantém dados, limpa só o erro anterior.
    setState((prev) => (prev.key === key && prev.error ? { ...prev, error: null } : prev))

    listReadingHistory({ stopId, periodId, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return
        setState({ key, result, error: null })
        setIsFetching(false)
      })
      .catch((err) => {
        if (controller.signal.aborted || isAbortedError(err)) return
        setState((prev) => ({ key, result: prev.key === key ? prev.result : null, error: err }))
        setIsFetching(false)
      })

    return () => controller.abort()
  }, [key, stopId, periodId, reloadKey, retryCount])

  const retry = useCallback(() => setRetryCount((count) => count + 1), [])

  const isCurrent = key !== null && state.key === key
  const result = isCurrent ? state.result : null

  return {
    readings: result?.readings ?? EMPTY_READINGS,
    truncated: result?.truncated ?? false,
    discardedCount: result?.discardedCount ?? 0,
    from: result?.from ?? null,
    isLoading: key !== null && (isFetching || !isCurrent),
    error: isCurrent ? state.error : null,
    retry,
    source: dataMode,
  }
}
