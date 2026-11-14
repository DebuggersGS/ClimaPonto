import { createMockDataset } from '../data/mock/mockDataset.js'
import { applyHistoryLimit, getPeriodStart, HISTORY_LIMIT, parsePeriodId } from '../utils/historyPeriods.js'
import { normalizeReadings, sortReadingsDesc } from '../utils/readings.js'
import { AppError, toAppError } from './errors.js'
import { noRowsAffected, toStop } from './stopsApi.js'
import { validateStop } from '../utils/stopValidation.js'

/**
 * Adaptador MOCK de pontos e leituras (VITE_DATA_MODE=mock).
 *
 * Tem a mesma interface da fonte Supabase (readingsApi.js + stopsApi.js) e
 * devolve o mesmo formato normalizado, reaproveitando normalizeReadings,
 * applyHistoryLimit e getPeriodStart. Não importa supabaseClient.js nem
 * import.meta.env: nunca consulta o Supabase. As escritas de pontos valem só
 * na memória da instância (estado preguiçoso copiado do dataset, que nunca é
 * mutado): recarregar a página restaura os dados e outra instância não as vê.
 */

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

  /** Linhas de pontos da instância, copiadas do dataset na primeira necessidade. */
  let stopRows = null
  let createdCount = 0
  const stopState = () => {
    stopRows ??= createMockDataset({ now: now() }).stops.map((row) => ({ ...row }))
    return stopRows
  }

  /** Mesmas recusas do banco: formato (23514) e código único (23505). */
  function checkInput(input, ignoreId) {
    if (Object.keys(validateStop(input)).length) throw toAppError({ code: '23514' })
    const duplicate = stopState().some((row) => row.code === input.code && row.id !== ignoreId)
    if (duplicate) {
      throw toAppError({ code: '23505', message: 'duplicate key value violates unique constraint "stops_code_unique"' })
    }
  }

  function findRow(id) {
    const row = stopState().find((item) => item.id === id)
    if (!row) throw noRowsAffected()
    return row
  }

  /** Pontos que ainda existem e estão ativos, para as últimas leituras. */
  const activeStopIds = () => new Set(stopState().filter((row) => row.active).map((row) => row.id))

  return {
    /** Pontos ordenados pelo código (mesmo formato de stopsApi). */
    async listStops({ includeInactive = false, signal } = {}) {
      await simulateRequest(signal)
      return stopState()
        .map(toStop)
        .filter((stop) => includeInactive || stop.active)
        .sort((a, b) => a.code.localeCompare(b.code))
    },

    /** Última leitura de cada ponto com dados (mesmo formato de fetchLatestReadings). */
    async fetchLatestReadings({ signal } = {}) {
      await simulateRequest(signal)
      const { latestReadings } = createMockDataset({ now: now() })
      const visible = activeStopIds()
      const rows = latestReadings.filter((row) => visible.has(row.stop_id))
      return { ...normalizeReadings(rows), source: 'mock' }
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
      // Ponto criado nesta instância não tem leituras: histórico vazio.
      const rows = readingsByStopId[stopId] ?? (stopState().some((row) => row.id === stopId) ? [] : null)
      if (!rows) throw new AppError('Ponto não encontrado no modo demonstração.', { kind: 'validation' })

      const fromMs = Date.parse(from)
      const inPeriod = rows.filter((row) => Date.parse(row.measured_at) >= fromMs)
      const { readings, discardedCount } = normalizeReadings(inPeriod)
      const { rows: limited, truncated } = applyHistoryLimit(sortReadingsDesc(readings), historyLimit)
      return { readings: limited, truncated, discardedCount, from, periodId: period, source: 'mock' }
    },

    /** Cria um ponto em memória. `input` já deve estar normalizado. */
    async createStop(input) {
      await simulateRequest()
      checkInput(input, null)
      createdCount += 1
      const stamp = now().toISOString()
      const row = {
        id: `mock-novo-${createdCount}`,
        code: input.code,
        name: input.name,
        neighborhood: input.neighborhood,
        description: input.description ?? null,
        latitude: input.latitude,
        longitude: input.longitude,
        is_demo: input.isDemo,
        active: input.active,
        created_at: stamp,
        updated_at: stamp,
      }
      stopState().push(row)
      return toStop(row)
    },

    async updateStop(id, input) {
      await simulateRequest()
      const row = findRow(id)
      checkInput(input, id)
      Object.assign(row, {
        code: input.code,
        name: input.name,
        neighborhood: input.neighborhood,
        description: input.description ?? null,
        latitude: input.latitude,
        longitude: input.longitude,
        is_demo: input.isDemo,
        active: input.active,
        updated_at: now().toISOString(),
      })
      return toStop(row)
    },

    async setStopActive(id, active) {
      await simulateRequest()
      const row = findRow(id)
      Object.assign(row, { active, updated_at: now().toISOString() })
      return toStop(row)
    },

    /** Recusa pontos com leituras, como a chave estrangeira do banco (23503). */
    async deleteStop(id) {
      await simulateRequest()
      const row = findRow(id)
      const { readingsByStopId } = createMockDataset({ now: now() })
      if (readingsByStopId[id]?.length) throw toAppError({ code: '23503' })
      stopRows = stopState().filter((item) => item !== row)
    },
    /** Quantidade de leituras do ponto (consulta, não escrita). */
    async countStopReadings(stopId, { signal } = {}) {
      await simulateRequest(signal)
      const { readingsByStopId } = createMockDataset({ now: now() })
      return readingsByStopId[stopId]?.length ?? 0
    },
  }
}
