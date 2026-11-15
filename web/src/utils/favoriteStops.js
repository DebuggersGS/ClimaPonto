/**
 * Favoritos locais: lista de CÓDIGOS de ponto (nunca leituras nem dados
 * pessoais). Funções puras; o acesso ao localStorage fica no hook.
 */

/** Máximo de favoritos guardados (protege contra valores gigantes no storage). */
export const FAVORITES_LIMIT = 50

/** Remove não-strings, vazios e duplicatas, e aplica o limite. */
function sanitize(list) {
  const result = []
  const seen = new Set()
  for (const value of Array.isArray(list) ? list : []) {
    if (typeof value !== 'string') continue
    const code = value.trim()
    if (!code || seen.has(code)) continue
    seen.add(code)
    result.push(code)
    if (result.length >= FAVORITES_LIMIT) break
  }
  return result
}

/**
 * Lê favoritos do texto bruto do storage, sem nunca lançar exceção.
 * @param {string|null|undefined} raw JSON esperado: array de strings
 * @returns {string[]} lista saneada (vazia se o valor for inválido)
 */
export function parseFavorites(raw) {
  if (typeof raw !== 'string' || raw === '') return []
  try {
    return sanitize(JSON.parse(raw))
  } catch {
    return []
  }
}

/**
 * Alterna um código na lista, sem mutar a entrada. Respeita o limite:
 * com a lista cheia, um novo favorito não é adicionado.
 * @param {string[]} list
 * @param {string} code
 * @returns {string[]}
 */
export function toggleFavorite(list, code) {
  const current = sanitize(list)
  if (typeof code !== 'string' || !code.trim()) return current
  const wanted = code.trim()
  if (current.includes(wanted)) return current.filter((item) => item !== wanted)
  return current.length >= FAVORITES_LIMIT ? current : [...current, wanted]
}

/**
 * Texto a gravar no storage (só códigos, saneados).
 * @param {string[]} list
 * @returns {string}
 */
export function serializeFavorites(list) {
  return JSON.stringify(sanitize(list))
}
