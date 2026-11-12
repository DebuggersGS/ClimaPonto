import { useCallback, useEffect, useState } from 'react'
import { dataMode } from '../services/dataSource.js'
import { toAppError } from '../services/errors.js'
import {
  countStopReadings,
  createStop,
  deleteStop,
  listStops,
  setStopActive,
  updateStop,
} from '../services/stopsService.js'
import { useAuth } from './useAuth.js'

const byCode = (a, b) => a.code.localeCompare(b.code)

/**
 * Estado e operações da gestão de pontos (área administrativa).
 *
 * Após cada operação, a lista local é atualizada com a linha devolvida pelo
 * banco (sem recarregar tudo). Erros de sessão expirada encerram a sessão e
 * levam o usuário de volta ao login. `source` é o modo efetivo de dados: no
 * modo mock as escritas rejeitam com erro de indisponibilidade.
 */
export function useAdminStops() {
  const { handleSessionExpired } = useAuth()
  const [stops, setStops] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isActive = true

    listStops({ includeInactive: true })
      .then((data) => {
        if (isActive) setStops(data)
      })
      .catch((err) => {
        if (!isActive) return
        const appError = toAppError(err)
        if (appError.kind === 'session') handleSessionExpired()
        setError(appError.message)
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [reloadKey, handleSessionExpired])

  const reload = useCallback(() => {
    setIsLoading(true)
    setError(null)
    setReloadKey((key) => key + 1)
  }, [])

  /** Executa uma operação e trata sessão expirada de forma centralizada. */
  const run = useCallback(
    async (operation) => {
      try {
        return await operation()
      } catch (err) {
        const appError = toAppError(err)
        if (appError.kind === 'session') handleSessionExpired()
        throw appError
      }
    },
    [handleSessionExpired],
  )

  const create = useCallback(
    async (input) => {
      const stop = await run(() => createStop(input))
      setStops((current) => [...current, stop].sort(byCode))
      return stop
    },
    [run],
  )

  const update = useCallback(
    async (id, input) => {
      const stop = await run(() => updateStop(id, input))
      setStops((current) => current.map((s) => (s.id === stop.id ? stop : s)).sort(byCode))
      return stop
    },
    [run],
  )

  const setActive = useCallback(
    async (id, active) => {
      const stop = await run(() => setStopActive(id, active))
      setStops((current) => current.map((s) => (s.id === stop.id ? stop : s)))
      return stop
    },
    [run],
  )

  const remove = useCallback(
    async (id) => {
      await run(() => deleteStop(id))
      setStops((current) => current.filter((s) => s.id !== id))
    },
    [run],
  )

  const readingsCount = useCallback((id) => run(() => countStopReadings(id)), [run])

  return { stops, isLoading, error, reload, create, update, setActive, remove, readingsCount, source: dataMode }
}
