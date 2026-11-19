import { applyHistoryLimit, getPeriodStart, HISTORY_LIMIT, parsePeriodId } from '../utils/historyPeriods.js'
import { normalizeReadings, sortReadingsDesc } from '../utils/readings.js'
import { AppError, toAppError } from './errors.js'

/**
 * Consultas SOMENTE LEITURA de leituras ambientais.
 *
 * O cliente é sempre parâmetro (este módulo não importa supabaseClient.js, que
 * depende de import.meta.env), o que permite testar com um cliente falso no
 * Node. Nenhum método de escrita é usado aqui: leituras só entram pelo endpoint
 * de ingestão no servidor.
 *
 * @typedef {object} Reading
 * @property {string} id
 * @property {string} stopId
 * @property {number|null} temperatureC       null quando ausente ou implausível
 * @property {number|null} humidityPct        null quando ausente ou implausível
 * @property {'normal'|'attention'|'critical'|'unclassified'} environmentalStatus  estado GRAVADO no banco
 * @property {string} source                  sensor, simulation, test ou unknown
 * @property {string} measuredAt              ISO 8601
 * @property {number} measuredAtMs
 * @property {string|null} receivedAt
 */

/** Colunas da view stop_latest_readings (a chave da leitura chega como reading_id). */
export const LATEST_READING_COLUMNS =
  'stop_id, reading_id, temperature_c, humidity_pct, environmental_status, source, measured_at, received_at'

/** Colunas da tabela readings. */
export const READING_COLUMNS =
  'id, stop_id, temperature_c, humidity_pct, environmental_status, source, measured_at, received_at'

/** true se o erro representa uma consulta cancelada (não deve ser mostrado como falha). */
export function isAbortedError(err) {
  return err?.kind === 'aborted'
}

function abortedError(cause) {
  return new AppError('Consulta cancelada.', { kind: 'aborted', cause })
}

/** Repassa o AbortSignal ao PostgREST quando há signal e o método existe. */
function withSignal(query, signal) {
  return signal && typeof query.abortSignal === 'function' ? query.abortSignal(signal) : query
}

/**
 * Executa a consulta e traduz qualquer falha para AppError. O postgrest-js
 * normalmente devolve { error } (inclusive em falha de rede), mas o cliente
 * também pode lançar; os dois caminhos passam por toAppError. O cancelamento
 * tem precedência sobre qualquer outro erro.
 */
async function execute(buildQuery, signal, fallbackMessage) {
  let result
  try {
    result = await buildQuery()
  } catch (err) {
    if (signal?.aborted) throw abortedError(err)
    throw toAppError(err, fallbackMessage)
  }
  if (signal?.aborted) throw abortedError(result?.error)
  if (result.error) throw toAppError(result.error, fallbackMessage)
  return result.data
}

/**
 * Última leitura de cada ponto (view stop_latest_readings).
 * @param {object|null} client cliente Supabase (null = sem Supabase configurado)
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ readings: Reading[], discardedCount: number, source: 'supabase'|'local' }>}
 */
export async function fetchLatestReadings(client, { signal } = {}) {
  if (!client) return { readings: [], discardedCount: 0, source: 'local' }

  const data = await execute(
    () => withSignal(client.from('stop_latest_readings').select(LATEST_READING_COLUMNS), signal),
    signal,
    'Não foi possível consultar as leituras.',
  )
  return { ...normalizeReadings(data), source: 'supabase' }
}

/**
 * Histórico de leituras de um ponto em um período, da mais recente à mais antiga.
 * Pede HISTORY_LIMIT + 1 linhas para detectar truncamento.
 * @param {object|null} client cliente Supabase (null = sem Supabase configurado)
 * @param {{ stopId?: string, periodId?: string, now?: Date|number, signal?: AbortSignal }} [options]
 * @returns {Promise<{ readings: Reading[], truncated: boolean, discardedCount: number,
 *   from: string, periodId: string, source: 'supabase'|'local' }>}
 */
export async function fetchReadingHistory(client, { stopId, periodId, now = new Date(), signal } = {}) {
  if (!stopId) {
    throw new AppError('Selecione um ponto para consultar o histórico.', { kind: 'validation' })
  }
  const period = parsePeriodId(periodId)
  const from = getPeriodStart(period, now)
  if (!client) return { readings: [], truncated: false, discardedCount: 0, from, periodId: period, source: 'local' }

  const data = await execute(
    () =>
      withSignal(
        client
          .from('readings')
          .select(READING_COLUMNS)
          .eq('stop_id', stopId)
          .gte('measured_at', from)
          .order('measured_at', { ascending: false })
          .limit(HISTORY_LIMIT + 1),
        signal,
      ),
    signal,
    'Não foi possível consultar o histórico de leituras.',
  )
  const { readings, discardedCount } = normalizeReadings(data)
  const { rows, truncated } = applyHistoryLimit(sortReadingsDesc(readings))
  return { readings: rows, truncated, discardedCount, from, periodId: period, source: 'supabase' }
}
