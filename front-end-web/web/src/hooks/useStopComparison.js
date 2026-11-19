import { useCallback, useEffect, useMemo, useState } from 'react'
import { isAbortedError, listReadingHistory } from '../services/readingsService.js'
import { compareStops } from '../utils/stopComparison.js'

/**
 * Busca o histórico de 2 pontos no mesmo período e os compara.
 * Sem os dois pontos (ou com o mesmo ponto nos dois) não há consulta.
 * Ao mudar ponto/período os dados anteriores não são devolvidos; a requisição
 * anterior é abortada e cancelamento nunca vira erro.
 *
 * @param {{ stopAId?: string, stopBId?: string, periodId?: string }} [options]
 * @returns {{ comparison: object|null, truncated: boolean, isLoading: boolean, error: Error|null, retry: () => void }}
 */
export function useStopComparison({ stopAId, stopBId, periodId } = {}) {
  const [state, setState] = useState({ key: null, results: null, error: null })
  const [retryCount, setRetryCount] = useState(0)

  const key = stopAId && stopBId && stopAId !== stopBId ? `${stopAId}|${stopBId}|${periodId ?? ''}` : null

  useEffect(() => {
    if (!key) return undefined
    const controller = new AbortController()
    const { signal } = controller
    Promise.all([stopAId, stopBId].map((stopId) => listReadingHistory({ stopId, periodId, signal })))
      .then((results) => {
        if (!signal.aborted) setState({ key, results, error: null })
      })
      .catch((err) => {
        if (signal.aborted || isAbortedError(err)) return
        setState({ key, results: null, error: err })
      })
    return () => controller.abort()
  }, [key, stopAId, stopBId, periodId, retryCount])

  const retry = useCallback(() => {
    setState({ key: null, results: null, error: null })
    setRetryCount((count) => count + 1)
  }, [])

  const isCurrent = key !== null && state.key === key
  const results = isCurrent ? state.results : null
  const comparison = useMemo(
    () => (results ? compareStops({ stopId: stopAId, readings: results[0].readings }, { stopId: stopBId, readings: results[1].readings }) : null),
    [results, stopAId, stopBId],
  )

  return {
    comparison,
    truncated: Boolean(results?.some((r) => r.truncated)),
    isLoading: key !== null && !isCurrent,
    error: isCurrent ? state.error : null,
    retry,
  }
}
