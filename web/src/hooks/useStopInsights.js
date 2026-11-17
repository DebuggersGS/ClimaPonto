import { useMemo } from 'react'
import { buildStopNarrative, sliceReadingsByWindow, summarizeCurrent, summarizeStopQuality } from '../utils/stopInsights.js'
import { useReadingsHistory } from './useReadingsHistory.js'

/**
 * Leituras de um ponto em um período e tudo o que o Ponto 360° deriva delas
 * (resumo atual, qualidade e narrativa), calculado uma única vez para que
 * gráfico, tabela, CSV e qualidade usem exatamente o mesmo recorte.
 *
 * @param {{ stop?: { id: string }|null, periodId: string, now: Date }} options `now` vem de useNow (nunca new Date() aqui)
 * @returns {{ slice: ReturnType<typeof sliceReadingsByWindow>, readings: object[], current: ReturnType<typeof summarizeCurrent>,
 *   quality: ReturnType<typeof summarizeStopQuality>, narrative: string[], truncated: boolean, discardedCount: number,
 *   isLoading: boolean, error: Error|null, retry: () => void }}
 */
export function useStopInsights({ stop, periodId, now }) {
  const history = useReadingsHistory({ stopId: stop?.id, periodId })
  const nowMs = now.getTime()
  const { readings: rawReadings } = history

  const derived = useMemo(() => {
    const slice = sliceReadingsByWindow(rawReadings, periodId, nowMs, { limit: Infinity })
    const quality = summarizeStopQuality(slice, nowMs)
    return {
      slice,
      readings: slice.readings,
      current: summarizeCurrent(slice.readings),
      quality,
      narrative: buildStopNarrative(slice, quality),
    }
  }, [rawReadings, periodId, nowMs])

  return {
    ...derived,
    truncated: history.truncated,
    discardedCount: history.discardedCount,
    isLoading: history.isLoading,
    error: history.error,
    retry: history.retry,
  }
}
