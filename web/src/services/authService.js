import { AppError, toAuthError } from './errors.js'
import { supabase } from './supabaseClient.js'

/**
 * Autenticação administrativa com Supabase Auth (e-mail e senha).
 * Não existe cadastro público: contas são criadas manualmente no painel.
 *
 * O papel exibido aqui serve apenas para a INTERFACE. Quem garante as
 * permissões é o RLS do banco.
 */

function requireClient() {
  if (!supabase) {
    throw new AppError('O Supabase não está configurado nesta instalação. Consulte o README.', { kind: 'unknown' })
  }
  return supabase
}

/** true quando o usuário tem app_metadata.role === 'admin'. */
export function isAdminUser(user) {
  return user?.app_metadata?.role === 'admin'
}

export async function signIn(email, password) {
  const client = requireClient()
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw toAuthError(error)
  return data.user
}

export async function signOut() {
  const client = requireClient()
  const { error } = await client.auth.signOut()
  // Mesmo se o servidor falhar, a sessão local é descartada pelo supabase-js.
  if (error) throw toAuthError(error)
}

/** Sessão atual (lida do armazenamento local e renovada se necessário). */
export async function getCurrentSession() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw toAuthError(error)
  return data.session
}

/**
 * Observa mudanças de sessão. Retorna a função para cancelar a inscrição.
 * @param {(event: string, session: object|null) => void} callback
 */
export function onAuthChange(callback) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session))
  return () => data.subscription.unsubscribe()
}
