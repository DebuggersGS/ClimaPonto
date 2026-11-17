/**
 * Filtros de pontos na URL (?q=...&bairro=...). Funções puras sobre URLSearchParams:
 * preservam parâmetros alheios (ex.: `dados`) e ignoram valores desconhecidos.
 *
 * @typedef {import('./stopFilters.js').StopFilters} StopFilters
 */

/** Nomes dos parâmetros na URL. */
export const FILTER_PARAM_KEYS = Object.freeze({
  text: 'q',
  neighborhood: 'bairro',
  environmental: 'ambiente',
  connectivity: 'conexao',
  favoritesOnly: 'favoritos',
})

const ENVIRONMENTAL_VALUES = ['normal', 'attention', 'critical', 'unclassified']
const CONNECTIVITY_VALUES = ['online', 'delayed', 'offline', 'no_data', 'unknown']
const MAX_TEXT_LENGTH = 100

/** Filtros vazios (nenhum ativo). */
export const EMPTY_STOP_FILTERS = Object.freeze({
  text: '',
  neighborhood: '',
  environmental: '',
  connectivity: '',
  favoritesOnly: false,
})

function clean(value) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_TEXT_LENGTH) : ''
}

function oneOf(value, allowed) {
  return allowed.includes(value) ? value : ''
}

/**
 * Lê os filtros da URL; valores desconhecidos de estado/conectividade são ignorados.
 * @param {URLSearchParams|string|null|undefined} params
 * @returns {StopFilters} sempre com todas as chaves
 */
export function parseStopFilterParams(params) {
  const search = params instanceof URLSearchParams ? params : new URLSearchParams(params ?? '')
  const keys = FILTER_PARAM_KEYS
  return {
    text: clean(search.get(keys.text)),
    neighborhood: clean(search.get(keys.neighborhood)),
    environmental: oneOf(search.get(keys.environmental), ENVIRONMENTAL_VALUES),
    connectivity: oneOf(search.get(keys.connectivity), CONNECTIVITY_VALUES),
    favoritesOnly: search.get(keys.favoritesOnly) === '1',
  }
}

/**
 * Grava os filtros em uma CÓPIA dos parâmetros: filtros vazios removem a chave
 * e os demais parâmetros ficam intactos.
 * @param {URLSearchParams|string|null|undefined} params parâmetros atuais
 * @param {StopFilters} filters
 * @returns {URLSearchParams}
 */
export function serializeStopFilterParams(params, filters = {}) {
  const next = new URLSearchParams(params instanceof URLSearchParams ? params.toString() : (params ?? ''))
  const keys = FILTER_PARAM_KEYS
  const values = {
    text: clean(filters?.text),
    neighborhood: clean(filters?.neighborhood),
    environmental: oneOf(filters?.environmental, ENVIRONMENTAL_VALUES),
    connectivity: oneOf(filters?.connectivity, CONNECTIVITY_VALUES),
    favoritesOnly: filters?.favoritesOnly === true ? '1' : '',
  }
  for (const name of Object.keys(keys)) {
    if (values[name]) next.set(keys[name], values[name])
    else next.delete(keys[name])
  }
  return next
}

/**
 * Quantidade de filtros ativos (para o contador do botão "Filtros").
 * @param {StopFilters} [filters]
 * @returns {number}
 */
export function countActiveFilters(filters = {}) {
  return Object.keys(FILTER_PARAM_KEYS).filter((name) => {
    const value = filters?.[name]
    return name === 'favoritesOnly' ? value === true : clean(value) !== ''
  }).length
}
