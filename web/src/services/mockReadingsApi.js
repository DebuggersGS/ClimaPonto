import { createMockDataset } from '../data/mock/mockDataset.js'
import { applyHistoryLimit, getPeriodStart, HISTORY_LIMIT, parsePeriodId } from '../utils/historyPeriods.js'
import { normalizeReadings, sortReadingsDesc } from '../utils/readings.js'
import { AppError, toAppError } from './errors.js'
import { toStop } from './stopsApi.js'

/**
 * Adaptador MOCK de pontos e leituras (VITE_DATA_MODE=mock).
 *
 * Tem a mesma interface da fonte Supabase (readingsApi.js + stopsApi.js) e
 * devolve o mesmo formato normalizado, reaproveitando normalizeReadings,
 * applyHistoryLimit e getPeriodStart. Não importa supabaseClient.js nem
 * import.meta.env: nunca consulta o Supabase. Escritas de pontos ficam
 * indisponíveis e nada é alterado.
 */

const UNAVAILABLE_MESSAGE =
  'O cadastro de pontos está indisponível no modo demonstração: os dados são fictícios e não podem ser alterados.'

/** Rejeita com o erro de cancelamento reconhecido por isAbortedError. */
function abortedError() {
  return new AppError('Consulta cancelada.', { kind: 'aborted' })
}

/** Espera `ms` respeitando o AbortSignal (já abortado ou abortado durante a espera). */
function wait(ms, signal) {
  if (signal?.aborted) return Promise.reject(abortedError())
  if (!(ms > 0)) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      reject(abortedError())
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * @param {object} [options]
 * @param {() => Date} [options.now] relógio injetável (padrão: relógio do navegador)
 * @param {number} [options.latencyMs] latência simulada das consultas (padrão 0)
 * @param {boolean} [options.failure] true: toda consulta falha como erro de rede traduzido
 *   (para conferir visualmente o estado de erro)
 * @param {number} [options.historyLimit] máximo de linhas do histórico (padrão HISTORY_LIMIT);
 *   um valor menor permite exercitar o aviso de truncamento
 */
export function createMockReadingsApi({
  now = () => new Date(),
  latencyMs = 0,
  failure = false,
  historyLimit = HISTORY_LIMIT,
} = {}) {
  /** Latência, cancelamento e falha simulada, nessa ordem de precedência. */
  async function simulateRequest(signal) {
    await wait(latencyMs, signal)
    if (failure) throw toAppError(new TypeError('Failed to fetch (falha simulada do modo demonstração)'))
  }

  function unavailable() {
    return Promise.reject(new AppError(UNAVAILABLE_MESSAGE, { kind: 'unavailable' }))
  }

  return {
    /** Pontos ordenados pelo código (mesmo formato de stopsApi). */
    async listStops({ includeInactive = false, signal } = {}) {
      await simulateRequest(signal)
      const { stops } = createMockDataset({ now: now() })
      return stops
        .map(toStop)
        .filter((stop) => includeInactive || stop.active)
        .sort((a, b) => a.code.localeCompare(b.code))
    },

    /** Última leitura de cada ponto com dados (mesmo formato de fetchLatestReadings). */
    async fetchLatestReadings({ signal } = {}) {
      await simulateRequest(signal)
      const { latestReadings } = createMockDataset({ now: now() })
      return { ...normalizeReadings(latestReadings), source: 'mock' }
    },

    /** Histórico de um ponto e período (mesmo formato de fetchReadingHistory). */
    async fetchReadingHistory({ stopId, periodId, now: at, signal } = {}) {
      if (!stopId) {
        throw new AppError('Selecione um ponto para consultar o histórico.', { kind: 'validation' })
      }
      const instant = at ?? now()
      const period = parsePeriodId(periodId)
      const from = getPeriodStart(period, instant)
      await simulateRequest(signal)

      const { readingsByStopId } = createMockDataset({ now: instant })
      const rows = readingsByStopId[stopId]
      if (!rows) throw new AppError('Ponto não encontrado no modo demonstração.', { kind: 'validation' })

      const fromMs = Date.parse(from)
      const inPeriod = rows.filter((row) => Date.parse(row.measured_at) >= fromMs)
      const { readings, discardedCount } = normalizeReadings(inPeriod)
      const { rows: limited, truncated } = applyHistoryLimit(sortReadingsDesc(readings), historyLimit)
      return { readings: limited, truncated, discardedCount, from, periodId: period, source: 'mock' }
    },

    createStop: unavailable,
    updateStop: unavailable,
    setStopActive: unavailable,
    deleteStop: unavailable,
    /** Quantidade de leituras do ponto (consulta, não escrita). */
    async countStopReadings(stopId, { signal } = {}) {
      await simulateRequest(signal)
      const { readingsByStopId } = createMockDataset({ now: now() })
      return readingsByStopId[stopId]?.length ?? 0
    },
  }
}
