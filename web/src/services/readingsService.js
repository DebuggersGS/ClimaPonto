import { readingsApi } from './dataSource.js'

// Fachada fina: a fonte (mock, Supabase ou não configurada) é escolhida em
// dataSource.js; a lógica de consulta fica em readingsApi.js / mockReadingsApi.js,
// testáveis no Node sem import.meta.env.

export { isAbortedError } from './readingsApi.js'

/** Última leitura de cada ponto. @see fetchLatestReadings */
export function listLatestReadings(options) {
  return readingsApi.fetchLatestReadings(options)
}

/** Histórico de leituras de um ponto. @see fetchReadingHistory */
export function listReadingHistory(options) {
  return readingsApi.fetchReadingHistory(options)
}
