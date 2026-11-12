import { CONNECTIVITY_LABELS } from './connectivity.js'
import { ENVIRONMENTAL_STATUS_LABELS, getReadingSourceInfo, normalizeEnvironmentalStatus } from './readings.js'

/**
 * Apresentação de estados: { label, tone, icon }. Função pura, sem React:
 * `icon` é o NOME do ícone (ex.: 'Flame') e o componente resolve o desenho.
 * Todo estado tem texto e ícone — a cor nunca é o único sinal.
 *
 * Tons do design system: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'demo'.
 * Rótulos vêm de readings.js e connectivity.js para não divergir.
 */

/** Estado ambiental gravado no banco (dimensão separada da conectividade). */
export const ENVIRONMENTAL_PRESENTATION = {
  normal: { label: ENVIRONMENTAL_STATUS_LABELS.normal, tone: 'success', icon: 'CheckCircle2' },
  attention: { label: ENVIRONMENTAL_STATUS_LABELS.attention, tone: 'warning', icon: 'AlertTriangle' },
  critical: { label: ENVIRONMENTAL_STATUS_LABELS.critical, tone: 'danger', icon: 'Flame' },
  unclassified: { label: ENVIRONMENTAL_STATUS_LABELS.unclassified, tone: 'neutral', icon: 'CircleHelp' },
}

/** Conectividade derivada da idade da última leitura. */
export const CONNECTIVITY_PRESENTATION = {
  online: { label: CONNECTIVITY_LABELS.online, tone: 'success', icon: 'Wifi' },
  delayed: { label: CONNECTIVITY_LABELS.delayed, tone: 'warning', icon: 'Clock' },
  offline: { label: CONNECTIVITY_LABELS.offline, tone: 'danger', icon: 'WifiOff' },
  no_data: { label: CONNECTIVITY_LABELS.no_data, tone: 'neutral', icon: 'Database' },
  unknown: { label: CONNECTIVITY_LABELS.unknown, tone: 'neutral', icon: 'CircleHelp' },
}

/** Origem da leitura; só 'sensor' é medição real. */
export const SOURCE_PRESENTATION = {
  sensor: { label: getReadingSourceInfo('sensor').label, tone: 'success', icon: 'Radio' },
  simulation: { label: getReadingSourceInfo('simulation').label, tone: 'demo', icon: 'Sparkles' },
  test: { label: getReadingSourceInfo('test').label, tone: 'info', icon: 'FlaskConical' },
  unknown: { label: getReadingSourceInfo(null).label, tone: 'neutral', icon: 'CircleHelp' },
}

/** Modo de dados do front (provisório: a T10 alinha com dataMode quando existir). */
export const DATA_MODE_PRESENTATION = {
  mock: { label: 'Dados de demonstração', tone: 'demo', icon: 'Sparkles' },
  supabase: { label: 'Dados do Supabase', tone: 'success', icon: 'Database' },
  unconfigured: { label: 'Supabase não configurado', tone: 'warning', icon: 'AlertTriangle' },
}

const UNKNOWN_DATA_MODE = { label: 'Modo de dados desconhecido', tone: 'neutral', icon: 'CircleHelp' }

function lookup(map, key, fallback) {
  return typeof key === 'string' && Object.hasOwn(map, key) ? map[key] : fallback
}

/** @param {unknown} status estado gravado; null/desconhecido → "Não classificado" (neutro) */
export function getEnvironmentalTone(status) {
  return ENVIRONMENTAL_PRESENTATION[normalizeEnvironmentalStatus(status)]
}

/** @param {unknown} status online|delayed|offline|no_data; null/desconhecido → "Indeterminado" */
export function getConnectivityTone(status) {
  return lookup(CONNECTIVITY_PRESENTATION, status, CONNECTIVITY_PRESENTATION.unknown)
}

/** @param {unknown} source sensor|simulation|test; null/desconhecido → "Origem desconhecida" */
export function getSourceTone(source) {
  return SOURCE_PRESENTATION[getReadingSourceInfo(source).key]
}

/** @param {unknown} mode mock|supabase|unconfigured; null/desconhecido → neutro */
export function getDataModeTone(mode) {
  return lookup(DATA_MODE_PRESENTATION, mode, UNKNOWN_DATA_MODE)
}
