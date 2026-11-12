import { stopsApi } from './dataSource.js'

/**
 * Camada de acesso a dados dos pontos de ônibus.
 *
 * Fachada fina: a fonte é escolhida em dataSource.js (VITE_DATA_MODE).
 * - supabase: consulta e altera a tabela `stops` (stopsApi.js);
 * - mock: pontos fictícios locais; escritas ficam indisponíveis;
 * - unconfigured: toda operação rejeita com erro claro.
 *
 * Se o Supabase estiver configurado e falhar, o erro é propagado — a
 * aplicação nunca troca silenciosamente para dados mock.
 */

/** Lista os pontos ordenados pelo código. @see createSupabaseStopsApi */
export function listStops(options) {
  return stopsApi.listStops(options)
}

/** Cria um ponto. `input` já deve estar normalizado (utils/stopValidation). */
export function createStop(input) {
  return stopsApi.createStop(input)
}

/** Atualiza os campos editáveis de um ponto. */
export function updateStop(id, input) {
  return stopsApi.updateStop(id, input)
}

/** Ativa ou desativa um ponto (o histórico de leituras é preservado). */
export function setStopActive(id, active) {
  return stopsApi.setStopActive(id, active)
}

/** Exclui um ponto (o banco recusa se houver leituras). */
export function deleteStop(id) {
  return stopsApi.deleteStop(id)
}

/** Quantidade de leituras de um ponto visíveis para o usuário atual. */
export function countStopReadings(stopId) {
  return stopsApi.countStopReadings(stopId)
}
