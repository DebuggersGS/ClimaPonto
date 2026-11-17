import { normalizeSearchText } from './stopFilters.js'

/**
 * Resultados da Command Palette: páginas existentes e pontos carregados.
 * Funções puras; a navegação fica no componente.
 *
 * @typedef {object} CommandPage
 * @property {string} to rota da página
 * @property {string} label nome exibido
 *
 * @typedef {object} CommandAction
 * @property {string} id identificador estável da ação (ex.: 'limpar-filtros')
 * @property {string} label nome exibido
 * @property {string} [to] destino padrão; o componente pode sobrepô-lo (ex.: preservar parâmetros)
 *
 * @typedef {object} CommandResult
 * @property {'page'|'action'|'stop'} kind
 * @property {string} id identificador estável (rota, id da ação ou código do ponto)
 * @property {string} label
 * @property {string} description texto de apoio (código e bairro, no caso de ponto)
 * @property {string} to destino da navegação
 */

/** Máximo de resultados exibidos quando o chamador não informa `limit`. */
export const COMMAND_RESULTS_LIMIT = 8

function pageResult(page) {
  return { kind: 'page', id: page.to, label: page.label, description: 'Página', to: page.to }
}

function actionResult(action) {
  return { kind: 'action', id: action.id, label: action.label, description: 'Ação', to: action.to ?? '' }
}

function stopResult(stop) {
  const description = [stop.code, stop.neighborhood].filter(Boolean).join(' · ')
  return { kind: 'stop', id: stop.code, label: stop.name ?? stop.code, description, to: `/pontos/${encodeURIComponent(stop.code)}` }
}

/** Pontuação (menor = melhor) ou null se não casa. Código exato vem antes de tudo. */
function scoreStop(stop, query) {
  const code = normalizeSearchText(stop.code)
  const name = normalizeSearchText(stop.name)
  if (code === query) return 0
  if (code.startsWith(query)) return 1
  if (name.startsWith(query)) return 2
  if (name.includes(query) || code.includes(query)) return 3
  if (normalizeSearchText(stop.neighborhood).includes(query)) return 4
  return null
}

/**
 * Monta e ordena os resultados. Consulta vazia lista as páginas, as ações e depois os
 * pontos, na ordem recebida. Com consulta: páginas cujo nome casa vêm primeiro
 * (a navegação é o uso mais comum), depois pontos por relevância (código exato,
 * prefixo de código, prefixo de nome, trecho de nome/código, bairro), com
 * desempate pelo nome (pt-BR) e pelo código — ordem determinística.
 * @param {string} query texto digitado (acentos e caixa são ignorados)
 * @param {{ pages?: CommandPage[], actions?: CommandAction[], stops?: object[], limit?: number }} [sources]
 * @returns {CommandResult[]}
 */
export function buildCommandResults(query, { pages = [], actions = [], stops = [], limit = COMMAND_RESULTS_LIMIT } = {}) {
  const text = normalizeSearchText(query)
  const max = Number.isInteger(limit) && limit > 0 ? limit : COMMAND_RESULTS_LIMIT
  const validStops = (Array.isArray(stops) ? stops : []).filter((stop) => stop && typeof stop.code === 'string' && stop.code)
  const validPages = (Array.isArray(pages) ? pages : []).filter((page) => page && page.to && page.label)

  const validActions = (Array.isArray(actions) ? actions : []).filter((action) => action && action.id && action.label)

  if (!text) return [...validPages.map(pageResult), ...validActions.map(actionResult), ...validStops.map(stopResult)].slice(0, max)

  const pageHits = validPages.filter((page) => normalizeSearchText(page.label).includes(text)).map(pageResult)
  const actionHits = validActions.filter((action) => normalizeSearchText(action.label).includes(text)).map(actionResult)
  const stopHits = validStops
    .map((stop) => ({ stop, score: scoreStop(stop, text) }))
    .filter(({ score }) => score !== null)
    .sort(
      (a, b) =>
        a.score - b.score ||
        String(a.stop.name).localeCompare(String(b.stop.name), 'pt-BR') ||
        a.stop.code.localeCompare(b.stop.code, 'pt-BR'),
    )
    .map(({ stop }) => stopResult(stop))
  // Código exato de ponto precede até as páginas.
  const exact = stopHits.filter((r) => normalizeSearchText(r.id) === text)
  return [...exact, ...pageHits, ...actionHits, ...stopHits.filter((r) => !exact.includes(r))].slice(0, max)
}
