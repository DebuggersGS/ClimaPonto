import { useEffect, useState } from 'react'
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

  useEffect(() => {
    let isActive = true

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
  }, [])

  return { stops, isLoading, error, source: dataMode }
}
