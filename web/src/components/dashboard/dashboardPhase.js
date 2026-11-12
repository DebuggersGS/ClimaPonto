/**
 * Fase de exibição do Dashboard, a partir dos estados dos hooks.
 * Fases: 'unconfigured' | 'loading' | 'stops-error' | 'empty' | 'readings-error' | 'ready'.
 * Atualizações em segundo plano (polling) não mudam a fase: só a primeira carga tem skeleton.
 * @param {{ source: string, stopsLoading: boolean, stopsError: unknown, stopCount: number,
 *   readingsLoading: boolean, readingsFailed: boolean }} state
 */
export function getDashboardPhase({ source, stopsLoading, stopsError, stopCount, readingsLoading, readingsFailed }) {
  if (source === 'unconfigured') return 'unconfigured'
  if (stopsLoading) return 'loading'
  if (stopsError) return 'stops-error'
  if (stopCount === 0) return 'empty'
  if (readingsLoading) return 'loading'
  if (readingsFailed) return 'readings-error'
  return 'ready'
}
