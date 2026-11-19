/**
 * Estado persistido da barra lateral: preferência fixar/soltar (pin) e grupo
 * aberto. O storage é INJETADO (ex.: window.localStorage) e pode estar
 * indisponível ou lançar exceção (modo privado, cota): nunca propaga erro.
 */

export const SIDEBAR_PIN_KEY = 'climaponto.sidebar.pinned'
export const SIDEBAR_GROUP_KEY = 'climaponto.sidebar.group'

/** Tamanho máximo aceito para o id do grupo guardado. */
const MAX_GROUP_LENGTH = 40

function read(storage, key) {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function write(storage, key, value) {
  try {
    if (!storage) return false
    if (value === null) storage.removeItem(key)
    else storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/**
 * @param {Pick<Storage, 'getItem'>|null|undefined} storage
 * @param {boolean} [fallback] valor quando não houver preferência válida
 * @returns {boolean} true quando a barra está fixada (expandida)
 */
export function readSidebarPinned(storage, fallback = false) {
  const raw = read(storage, SIDEBAR_PIN_KEY)
  if (raw === '1') return true
  if (raw === '0') return false
  return fallback
}

/**
 * @param {Pick<Storage, 'setItem'>|null|undefined} storage
 * @param {boolean} pinned
 * @returns {boolean} false se não foi possível gravar
 */
export function writeSidebarPinned(storage, pinned) {
  return write(storage, SIDEBAR_PIN_KEY, pinned ? '1' : '0')
}

/**
 * Lê o grupo aberto, aceitando só ids conhecidos quando `validIds` é informado.
 * @param {Pick<Storage, 'getItem'>|null|undefined} storage
 * @param {string[]} [validIds]
 * @returns {string|null}
 */
export function readSidebarOpenGroup(storage, validIds) {
  const raw = read(storage, SIDEBAR_GROUP_KEY)
  if (typeof raw !== 'string' || raw === '' || raw.length > MAX_GROUP_LENGTH) return null
  if (Array.isArray(validIds) && !validIds.includes(raw)) return null
  return raw
}

/**
 * @param {Pick<Storage, 'setItem'|'removeItem'>|null|undefined} storage
 * @param {string|null} groupId null limpa a preferência
 * @returns {boolean} false se não foi possível gravar
 */
export function writeSidebarOpenGroup(storage, groupId) {
  if (groupId !== null && (typeof groupId !== 'string' || groupId === '' || groupId.length > MAX_GROUP_LENGTH)) return false
  return write(storage, SIDEBAR_GROUP_KEY, groupId)
}
