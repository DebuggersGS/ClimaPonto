/**
 * Rascunho de um campo de busca cujo valor oficial vive na URL (funções puras).
 *
 * Problema que resolve: a URL é atualizada com atraso em relação à digitação. Se o campo mostrasse o
 * valor da URL sempre que ela muda, digitar rápido "mock" voltava a mostrar "m", "mo"... no meio da
 * digitação e letras se perdiam. Aqui o campo mostra sempre o rascunho; a URL só substitui o rascunho
 * quando muda por um motivo EXTERNO (Limpar filtros, busca rápida, voltar do navegador), ou seja,
 * quando o novo valor da URL não é um dos valores que o próprio campo enviou.
 */

const MAX_PENDING = 50

/** Estado inicial a partir do texto atual da URL. */
export function createSearchDraft(urlText) {
  return { seen: urlText, pending: [], draft: urlText }
}

/**
 * Registra uma digitação: o rascunho vira `value` e o valor normalizado (como a URL vai guardá-lo) fica pendente.
 * @param {{ seen: string, pending: string[], draft: string }} state
 * @param {string} value
 * @param {(value: string) => string} normalize mesma normalização usada na URL
 */
export function recordTyping(state, value, normalize) {
  return { ...state, draft: value, pending: [...state.pending, normalize(value)].slice(-MAX_PENDING) }
}

/**
 * Concilia com o texto atual da URL. Devolve null se nada mudou; senão, o novo estado.
 * Eco de algo que o campo enviou: só descarta os pendentes até ele. Mudança externa: adota o valor da URL.
 */
export function reconcileSearchDraft(state, urlText) {
  if (urlText === state.seen) return null
  const index = state.pending.lastIndexOf(urlText)
  if (index >= 0) return { ...state, seen: urlText, pending: state.pending.slice(index + 1) }
  return { seen: urlText, pending: [], draft: urlText }
}
