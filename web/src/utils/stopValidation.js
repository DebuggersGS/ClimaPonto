/**
 * Validação do formulário de pontos.
 *
 * Espelha as restrições do banco (supabase/migrations/…_create_core_schema.sql)
 * para dar retorno imediato ao usuário. O banco continua sendo a validação
 * final: qualquer divergência é recusada por ele.
 */

export const STOP_CODE_PATTERN = /^[A-Z0-9]+(-[A-Z0-9]+)*$/
export const STOP_LIMITS = {
  codeMax: 32,
  nameMin: 3,
  nameMax: 120,
  neighborhoodMin: 2,
  neighborhoodMax: 80,
  descriptionMax: 500,
}

/** Valores iniciais de um formulário vazio (strings, como nos inputs). */
export const EMPTY_STOP_FORM = {
  code: '',
  name: '',
  neighborhood: '',
  description: '',
  latitude: '',
  longitude: '',
  isDemo: false,
  active: true,
}

/** Converte um ponto existente em valores de formulário. */
export function stopToFormValues(stop) {
  return {
    code: stop.code,
    name: stop.name,
    neighborhood: stop.neighborhood,
    description: stop.description ?? '',
    latitude: stop.latitude === null ? '' : String(stop.latitude),
    longitude: stop.longitude === null ? '' : String(stop.longitude),
    isDemo: stop.isDemo,
    active: stop.active,
  }
}

function parseCoordinate(text) {
  const trimmed = text.trim()
  if (trimmed === '') return null
  // Aceita vírgula decimal (padrão brasileiro).
  const value = Number(trimmed.replace(',', '.'))
  return Number.isFinite(value) ? value : Number.NaN
}

/** Normaliza os valores digitados para o formato enviado ao banco. */
export function normalizeStopForm(values) {
  const description = values.description.trim()
  return {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    neighborhood: values.neighborhood.trim(),
    description: description === '' ? null : description,
    latitude: parseCoordinate(values.latitude),
    longitude: parseCoordinate(values.longitude),
    isDemo: Boolean(values.isDemo),
    active: Boolean(values.active),
  }
}

/**
 * Valida um ponto já normalizado.
 * @returns {Record<string, string>} mensagens por campo (vazio = válido)
 */
export function validateStop(stop) {
  const errors = {}
  const L = STOP_LIMITS

  if (!stop.code) errors.code = 'Informe o código.'
  else if (stop.code.length > L.codeMax) errors.code = `Use no máximo ${L.codeMax} caracteres.`
  else if (!STOP_CODE_PATTERN.test(stop.code))
    errors.code = 'Use letras maiúsculas, números e hífens entre blocos (ex.: SP-0001).'

  if (stop.name.length < L.nameMin || stop.name.length > L.nameMax)
    errors.name = `O nome deve ter entre ${L.nameMin} e ${L.nameMax} caracteres.`

  if (stop.neighborhood.length < L.neighborhoodMin || stop.neighborhood.length > L.neighborhoodMax)
    errors.neighborhood = `O bairro deve ter entre ${L.neighborhoodMin} e ${L.neighborhoodMax} caracteres.`

  if (stop.description && stop.description.length > L.descriptionMax)
    errors.description = `Use no máximo ${L.descriptionMax} caracteres.`

  const hasLat = stop.latitude !== null
  const hasLng = stop.longitude !== null
  if (Number.isNaN(stop.latitude)) errors.latitude = 'Informe um número válido.'
  else if (hasLat && (stop.latitude < -90 || stop.latitude > 90)) errors.latitude = 'A latitude vai de -90 a 90.'

  if (Number.isNaN(stop.longitude)) errors.longitude = 'Informe um número válido.'
  else if (hasLng && (stop.longitude < -180 || stop.longitude > 180)) errors.longitude = 'A longitude vai de -180 a 180.'

  if (hasLat !== hasLng && !errors.latitude && !errors.longitude) {
    const message = 'Informe latitude e longitude juntas, ou deixe ambas em branco.'
    if (hasLat) errors.longitude = message
    else errors.latitude = message
  }

  return errors
}
