import { useCallback, useEffect, useRef, useState } from 'react'
import { dataMode } from '../services/dataSource.js'
import { isAbortedError, listLatestReadings } from '../services/readingsService.js'
import { SEND_INTERVAL_MS } from '../utils/connectivity.js'

/**
 * Última leitura de cada ponto, com atualização periódica (polling).
 *
 * Retorno:
 * - readings: leituras normalizadas (sem junção com pontos nem resumo);
 * - discardedCount: linhas descartadas na normalização;
 * - isLoading: true apenas até a primeira consulta terminar;
 * - isRefreshing: consulta em curso depois da primeira carga;
 * - error: AppError da última tentativa (ou null); cancelamento nunca vira erro;
 * - lastUpdatedAt: Date da última consulta bem-sucedida (ou null);
 * - isStale: a última tentativa falhou, mas há dados anteriores (mantidos);
 * - refresh: consulta manual (estável); ignorada se já houver consulta em curso;
 * - source: modo efetivo de dados ('mock' | 'supabase' | 'unconfigured').
 *
 * Regras: um AbortController por requisição, abortado no desmonte; nunca há
 * requisições sobrepostas; o polling só roda com a aba visível (ao voltar,
 * consulta de imediato se os dados forem mais antigos que `intervalMs`).
 * No modo mock o polling continua com o mesmo intervalo: não há custo de rede
 * e as leituras fictícias são geradas relativas ao relógio, então sem nova
 * consulta um ponto "online" envelheceria até aparecer offline. No modo
 * 'unconfigured' faz uma única carga (que já resulta em erro) e não faz polling.
 *
 * @param {{ intervalMs?: number }} [options]
 */
export function useLatestReadings({ intervalMs = SEND_INTERVAL_MS } = {}) {
  const [readings, setReadings] = useState([])
  const [discardedCount, setDiscardedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [isStale, setIsStale] = useState(false)

  // Refs lidas dentro de timers/listeners para evitar closures antigas.
  const inFlightRef = useRef(null)
  const lastUpdatedRef = useRef(null)
  const hasFinishedFirstRef = useRef(false)

  const load = useCallback(async () => {
    if (inFlightRef.current) return
    const controller = new AbortController()
    inFlightRef.current = controller
    if (hasFinishedFirstRef.current) setIsRefreshing(true)

    try {
      const result = await listLatestReadings({ signal: controller.signal })
      if (controller.signal.aborted) return
      const updatedAt = new Date()
      lastUpdatedRef.current = updatedAt
      setReadings(result.readings)
      setDiscardedCount(result.discardedCount)
      setLastUpdatedAt(updatedAt)
      setError(null)
      setIsStale(false)
    } catch (err) {
      if (controller.signal.aborted || isAbortedError(err)) return
      setError(err)
      // Mantém as leituras anteriores; só é "desatualizado" se havia dados.
      setIsStale(lastUpdatedRef.current !== null)
    } finally {
      if (inFlightRef.current === controller) inFlightRef.current = null
      if (!controller.signal.aborted) {
        hasFinishedFirstRef.current = true
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    load()
    if (dataMode === 'unconfigured') {
      return () => {
        inFlightRef.current?.abort()
        inFlightRef.current = null
      }
    }

    let intervalId = null
    const startPolling = () => {
      if (intervalId === null) intervalId = setInterval(load, intervalMs)
    }
    const stopPolling = () => {
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
    }
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling()
        return
      }
      const last = lastUpdatedRef.current
      if (last === null || Date.now() - last.getTime() > intervalMs) load()
      startPolling()
    }

    if (!document.hidden) startPolling()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
      inFlightRef.current?.abort()
      inFlightRef.current = null
    }
  }, [load, intervalMs])

  return {
    readings,
    discardedCount,
    isLoading,
    isRefreshing,
    error,
    lastUpdatedAt,
    isStale,
    refresh: load,
    source: dataMode,
  }
}
