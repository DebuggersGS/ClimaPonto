import { useCallback, useEffect, useState } from 'react'
import { dataMode } from '../services/dataSource.js'
import { listStops } from '../services/stopsService.js'

/**
 * Carrega a lista de pontos a partir da camada de serviços,
 * expondo estados de carregamento e erro e o modo efetivo de dados
 * ('mock' | 'supabase' | 'unconfigured') em `source`, para a interface.
 */
export function useStops() {
  const [stops, setStops] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isActive = true
    setIsLoading(true)
    setError(null)

    listStops()
      .then((data) => {
        if (isActive) setStops(data)
      })
      .catch((err) => {
        if (isActive) setError(err instanceof Error ? err.message : 'Erro desconhecido')
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((n) => n + 1), [])

  return { stops, isLoading, error, reload, source: dataMode }
}
