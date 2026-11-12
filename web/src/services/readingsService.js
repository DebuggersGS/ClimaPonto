import { fetchLatestReadings, fetchReadingHistory } from './readingsApi.js'
import { isSupabaseConfigured, supabase } from './supabaseClient.js'

// Fachada fina: a lógica fica em readingsApi.js (que recebe o cliente como
// parâmetro) para ser testável no Node, sem import.meta.env.

export { isAbortedError } from './readingsApi.js'

/** Origem dos dados usada pela camada de leituras. */
export const readingsDataSource = isSupabaseConfigured ? 'supabase' : 'local'

/** Última leitura de cada ponto. @see fetchLatestReadings */
export function listLatestReadings(options) {
  return fetchLatestReadings(supabase, options)
}

/** Histórico de leituras de um ponto. @see fetchReadingHistory */
export function listReadingHistory(options) {
  return fetchReadingHistory(supabase, options)
}
