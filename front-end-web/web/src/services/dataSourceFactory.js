import { createMockReadingsApi } from './mockReadingsApi.js'
import { createSupabaseStopsApi } from './stopsApi.js'
import { fetchLatestReadings, fetchReadingHistory } from './readingsApi.js'
import { AppError } from './errors.js'
import { createMockAuthApi } from './mockAuthApi.js'
import { createSupabaseAuthApi } from './supabaseAuthApi.js'
import { resolveDataMode } from '../utils/dataMode.js'
import { resolveDataScenario } from '../utils/dataScenario.js'

/**
 * Montagem da fonte de dados a partir do modo pedido. Sem import.meta.env,
 * para ser testável no Node; quem lê o ambiente é dataSource.js.
 *
 * Regras de separação: no modo 'supabase' nenhum dado mock é usado e um erro
 * do Supabase nunca cai para o mock; no modo 'mock' o Supabase não é
 * consultado; em 'unconfigured' toda operação rejeita com erro explícito. A autenticação
 * segue a mesma regra (demonstrativa só no mock).
 *
 * Conjunto de dados (utils/dataScenario): no build 'supabase' o usuário pode
 * escolher os cenários demonstrativos. Eles vêm do mock local em modo SOMENTE
 * LEITURA, nunca misturados aos dados observados (uma ou outra fonte, jamais
 * as duas), e a autenticação continua sendo sempre a do Supabase.
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

/** Mensagem das escritas recusadas nos cenários demonstrativos do build Supabase. */
export const DEMO_READ_ONLY_MESSAGE =
  'Os cenários demonstrativos são somente leitura: nada é gravado. Volte para "Dados observados" para gerir os pontos.'

/** Operações de escrita da interface de pontos. */
const WRITE_OPERATIONS = ['createStop', 'updateStop', 'setStopActive', 'deleteStop']

/**
 * Envolve a API mock tornando as escritas de pontos erros explícitos: no build
 * Supabase um cenário demonstrativo não pode parecer persistir nada nem
 * confundir o administrador sobre o que foi gravado no banco.
 */
function createReadOnlyApi(api) {
  const readOnly = { ...api }
  for (const name of WRITE_OPERATIONS) {
    readOnly[name] = () => Promise.reject(new AppError(DEMO_READ_ONLY_MESSAGE, { kind: 'permission' }))
  }
  return readOnly
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

/** Autenticação indisponível: entrar e sair rejeitam com erro de configuração. */
function createUnconfiguredAuthApi() {
  const reject = () => Promise.reject(new AppError(UNCONFIGURED_MESSAGE, { kind: 'unavailable' }))
  return {
    isDemo: false,
    available: false,
    demoAccounts: null,
    signIn: reject,
    signOut: reject,
    getSession: () => Promise.resolve(null),
    onAuthChange: () => () => {},
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
 * @param {() => string} [options.getSearch] devolve a query string da URL; chamada só quando o conteúdo é mock (?mock=)
 * @param {() => { search?: string, stored?: unknown }} [options.getScenarioInput] URL e preferência
 *   local para escolher o conjunto de dados; chamada só no build 'supabase'
 * @param {() => Date} [options.now] relógio do mock
 * @returns {{ dataMode: 'mock'|'supabase'|'unconfigured', buildMode: 'mock'|'supabase'|'unconfigured',
 *   dataScenario: object, resolution: object, readingsApi: object, stopsApi: object, authApi: object }}
 *   buildMode é o modo de build; dataMode é o modo do CONTEÚDO exibido ('mock' quando o
 *   conjunto é demonstrativo, mesmo no build supabase), para a sinalização ficar honesta.
 *   dataScenario: resultado de resolveDataScenario.
 *   readingsApi (fetchLatestReadings, fetchReadingHistory), stopsApi (listStops,
 *   createStop, updateStop, setStopActive, deleteStop, countStopReadings) e
 *   authApi (signIn, signOut, getSession, onAuthChange, isDemo, available,
 *   demoAccounts). No build mock a authApi é demonstrativa e em memória; no build
 *   supabase é sempre a do Supabase, em qualquer conjunto. ?mock=erro e ?mock=lento
 *   não afetam a autenticação.
 */
export function createDataSource({
  requestedMode,
  supabaseConfigured,
  client,
  getSearch = () => '',
  getScenarioInput = () => ({}),
  now,
}) {
  const resolution = resolveDataMode(requestedMode, { supabaseConfigured })
  const buildMode = resolution.mode
  const scenarioInput = buildMode === 'supabase' ? getScenarioInput() ?? {} : {}
  const dataScenario = resolveDataScenario({ buildMode, ...scenarioInput })
  const showsMock = dataScenario.scenario === 'demonstrativo'

  const mockApi = () => createMockReadingsApi({ ...parseMockOptions(getSearch()), now })
  let api
  let authApi
  if (buildMode === 'mock') {
    api = mockApi()
    authApi = createMockAuthApi()
  } else if (buildMode === 'supabase') {
    api = showsMock ? createReadOnlyApi(mockApi()) : createSupabaseApi(client)
    authApi = createSupabaseAuthApi(client)
  } else {
    api = createUnconfiguredApi()
    authApi = createUnconfiguredAuthApi()
  }

  const dataMode = showsMock ? 'mock' : buildMode
  return { dataMode, buildMode, dataScenario, resolution, readingsApi: api, stopsApi: api, authApi }
}
