import { createMockReadingsApi } from './mockReadingsApi.js'
import { createSupabaseStopsApi } from './stopsApi.js'
import { fetchLatestReadings, fetchReadingHistory } from './readingsApi.js'
import { AppError } from './errors.js'
import { resolveDataMode } from '../utils/dataMode.js'

/**
 * Montagem da fonte de dados a partir do modo pedido. Sem import.meta.env,
 * para ser testável no Node; quem lê o ambiente é dataSource.js.
 *
 * Regras de separação: no modo 'supabase' nenhum dado mock é usado e um erro
 * do Supabase nunca cai para o mock; no modo 'mock' o Supabase não é
 * consultado; em 'unconfigured' toda operação rejeita com erro explícito.
 */

export const UNCONFIGURED_MESSAGE =
  'Supabase não configurado: defina web/.env.local ou use VITE_DATA_MODE=mock.'

/** Latência padrão do mock: perceptível, mas sem atrapalhar a navegação. */
export const MOCK_DEFAULT_LATENCY_MS = 250

/** Latência do parâmetro ?mock=lento, longa o bastante para conferir o carregamento. */
export const MOCK_SLOW_LATENCY_MS = 3000

/**
 * Parâmetros de URL do modo mock para conferência visual de estados.
 * `?mock=erro` faz toda consulta falhar; `?mock=lento` aumenta a latência;
 * podem ser combinados (`?mock=lento,erro`). Só são lidos no modo mock.
 * @param {string} search query string (ex.: window.location.search)
 * @returns {{ failure: boolean, latencyMs: number }}
 */
export function parseMockOptions(search) {
  const flags = new Set(
    (new URLSearchParams(search ?? '').get('mock') ?? '')
      .split(',')
      .map((flag) => flag.trim().toLowerCase()),
  )
  return {
    failure: flags.has('erro'),
    latencyMs: flags.has('lento') ? MOCK_SLOW_LATENCY_MS : MOCK_DEFAULT_LATENCY_MS,
  }
}

/** Todas as operações rejeitam com o erro de Supabase não configurado. */
function createUnconfiguredApi() {
  const reject = () => Promise.reject(new AppError(UNCONFIGURED_MESSAGE, { kind: 'unavailable' }))
  return {
    fetchLatestReadings: reject,
    fetchReadingHistory: reject,
    listStops: reject,
    createStop: reject,
    updateStop: reject,
    setStopActive: reject,
    deleteStop: reject,
    countStopReadings: reject,
  }
}

function createSupabaseApi(client) {
  return {
    fetchLatestReadings: (options) => fetchLatestReadings(client, options),
    fetchReadingHistory: (options) => fetchReadingHistory(client, options),
    ...createSupabaseStopsApi(client),
  }
}

/**
 * @param {object} options
 * @param {unknown} options.requestedMode valor de VITE_DATA_MODE
 * @param {boolean} options.supabaseConfigured
 * @param {object|null} options.client cliente Supabase (null sem configuração)
 * @param {() => string} [options.getSearch] devolve a query string da URL; chamada só no modo mock
 * @param {() => Date} [options.now] relógio do mock
 * @returns {{ dataMode: 'mock'|'supabase'|'unconfigured', resolution: object,
 *   readingsApi: object, stopsApi: object }}
 *   readingsApi (fetchLatestReadings, fetchReadingHistory) e stopsApi (listStops,
 *   createStop, updateStop, setStopActive, deleteStop, countStopReadings)
 */
export function createDataSource({ requestedMode, supabaseConfigured, client, getSearch = () => '', now }) {
  const resolution = resolveDataMode(requestedMode, { supabaseConfigured })
  const { mode } = resolution

  let api
  if (mode === 'mock') api = createMockReadingsApi({ ...parseMockOptions(getSearch()), now })
  else if (mode === 'supabase') api = createSupabaseApi(client)
  else api = createUnconfiguredApi()

  return { dataMode: mode, resolution, readingsApi: api, stopsApi: api }
}
