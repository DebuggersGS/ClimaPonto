import { authApi } from './dataSource.js'
import { isAdminUser, signInAdmin } from './adminAuth.js'

/**
 * Autenticação administrativa: fachada sobre `authApi` de dataSource.js.
 * No modo mock é a autenticação demonstrativa em memória; no modo supabase,
 * o Supabase Auth; sem configuração, indisponível.
 *
 * O papel exibido aqui serve apenas para a INTERFACE. Quem garante as
 * permissões é o RLS do banco.
 */

export { isAdminUser }

/** Entra e exige papel de administrador (recusa e desconecta quem não for). */
export function signIn(email, password) {
  return signInAdmin(authApi, email, password)
}

export function signOut() {
  return authApi.signOut()
}

/** Sessão atual ou null. */
export function getCurrentSession() {
  return authApi.getSession()
}

/**
 * Observa mudanças de sessão. Retorna a função para cancelar a inscrição.
 * @param {(event: string, session: object|null) => void} callback
 */
export function onAuthChange(callback) {
  return authApi.onAuthChange(callback)
}

/** false quando a autenticação não está configurada. */
export const isAuthAvailable = authApi.available

/** true só no modo mock (contas fictícias). */
export const isDemoAuth = authApi.isDemo

/** Contas fictícias para exibir no login, ou null fora do mock. */
export function getDemoAccounts() {
  return authApi.demoAccounts
}
