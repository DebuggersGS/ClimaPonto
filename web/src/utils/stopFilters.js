import { CONNECTIVITY_LABELS, getConnectivity } from './connectivity.js'
import { ENVIRONMENTAL_STATUS_LABELS, normalizeEnvironmentalStatus } from './readings.js'

/**
 * Filtros de pontos (Dashboard e Pontos). Funções puras, sem React.
 *
 * Itens aceitos, de dois formatos:
 *  - ponto simples: { id, code, name, neighborhood, ... } (página Pontos);
 *  - item do summarizeDashboard: { stop, reading, connectivity } (Dashboard).
 * Ponto simples não tem leitura: nunca casa com estado ambiental e a
 * conectividade é "Sem dados".
 *
 * @typedef {object} StopFilters
 * @property {string} [text] busca por nome, código ou bairro (sem acentos/caixa; vazio não filtra)
 * @property {string} [neighborhood] bairro exato (sem acentos/caixa); vazio não filtra
 * @property {'normal'|'attention'|'critical'|'unclassified'|''} [environmental] estado GRAVADO
 * @property {'online'|'delayed'|'offline'|'no_data'|'unknown'|''} [connectivity]
 *
 * @typedef {object} FilterOption
 * @property {string} value valor a usar no filtro
 * @property {string} label rótulo em português
 * @property {number} count itens que possuem o valor
 */

const ENVIRONMENTAL_ORDER = ['normal', 'attention', 'critical', 'unclassified']
const CONNECTIVITY_ORDER = ['online', 'delayed', 'offline', 'no_data', 'unknown']

/** Remove acentos, ignora caixa e espaços nas pontas. */
export function normalizeSearchText(value) {
  if (value === null || value === undefined) return ''
  return String(value).normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase()
}

function isSummaryItem(item) {
  return item !== null && typeof item === 'object' && 'stop' in item
}

/** Ponto e leitura (ou null) de qualquer um dos dois formatos de item. */
function unwrap(item) {
  return isSummaryItem(item) ? { stop: item.stop ?? {}, reading: item.reading ?? null } : { stop: item ?? {}, reading: null }
}

/** Conectividade recalculada com o `now` recebido, para não depender do item. */
function connectivityOf(reading, now, options) {
  return getConnectivity(reading?.measuredAt ?? null, now, options).status
}

function matchesText(stop, text) {
  if (!text) return true
  return [stop.name, stop.code, stop.neighborhood].some((field) => normalizeSearchText(field).includes(text))
}

/**
 * Filtra por E lógico, sem mutar a entrada e preservando a ordem original.
 * @param {Array<object>|null|undefined} items pontos simples ou itens do summarizeDashboard
 * @param {StopFilters} [filters]
 * @param {{ now: Date|number, sendIntervalMs?: number }} options `now` é obrigatório para filtrar por conectividade
 * @returns {Array<object>} novo array com os mesmos objetos
 */
export function filterStops(items, filters = {}, { now, sendIntervalMs } = {}) {
  const list = Array.isArray(items) ? items : []
  const text = normalizeSearchText(filters?.text)
  const neighborhood = normalizeSearchText(filters?.neighborhood)
  const environmental = filters?.environmental || ''
  const connectivity = filters?.connectivity || ''

  return list.filter((item) => {
    const { stop, reading } = unwrap(item)
    if (!matchesText(stop, text)) return false
    if (neighborhood && normalizeSearchText(stop.neighborhood) !== neighborhood) return false
    if (environmental) {
      if (!reading || normalizeEnvironmentalStatus(reading.environmentalStatus) !== environmental) return false
    }
    if (connectivity && connectivityOf(reading, now, { sendIntervalMs }) !== connectivity) return false
    return true
  })
}

function countBy(values) {
  const counts = new Map()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return counts
}

function fixedOrderOptions(order, counts, labels) {
  return order.filter((key) => counts.has(key)).map((key) => ({ value: key, label: labels[key], count: counts.get(key) }))
}

function neighborhoodOptions(stops) {
  const groups = new Map()
  for (const stop of stops) {
    const label = typeof stop.neighborhood === 'string' ? stop.neighborhood.trim() : ''
    if (!label) continue
    const key = normalizeSearchText(label)
    const group = groups.get(key)
    if (group) group.count += 1
    else groups.set(key, { value: label, label, count: 1 })
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

/**
 * Opções de filtro presentes nos dados, com contagem (só valores existentes).
 * Bairros em ordem alfabética pt-BR; estados na ordem fixa da interface.
 * Ponto sem leitura não entra em estado ambiental (conta como "Sem dados" na conectividade).
 * @param {Array<object>|null|undefined} items pontos simples ou itens do summarizeDashboard
 * @param {{ now: Date|number, sendIntervalMs?: number }} options
 * @returns {{ neighborhoods: FilterOption[], environmental: FilterOption[], connectivity: FilterOption[] }}
 */
export function getStopFilterOptions(items, { now, sendIntervalMs } = {}) {
  const unwrapped = (Array.isArray(items) ? items : []).map(unwrap)
  const environmentalCounts = countBy(
    unwrapped.filter(({ reading }) => reading).map(({ reading }) => normalizeEnvironmentalStatus(reading.environmentalStatus)),
  )
  const connectivityCounts = countBy(unwrapped.map(({ reading }) => connectivityOf(reading, now, { sendIntervalMs })))
  return {
    neighborhoods: neighborhoodOptions(unwrapped.map(({ stop }) => stop)),
    environmental: fixedOrderOptions(ENVIRONMENTAL_ORDER, environmentalCounts, ENVIRONMENTAL_STATUS_LABELS),
    connectivity: fixedOrderOptions(CONNECTIVITY_ORDER, connectivityCounts, CONNECTIVITY_LABELS),
  }
}
