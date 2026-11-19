import { toAuthError } from './errors.js'

/**
 * Autenticação administrativa com Supabase Auth (e-mail e senha).
 * Não existe cadastro público: contas são criadas manualmente no painel.
 * O cliente é parâmetro (este módulo não importa supabaseClient.js).
 *
 * O papel serve apenas para a INTERFACE. Quem garante as permissões é o RLS.
 * @param {object} client cliente Supabase (nunca null)
 */
export function createSupabaseAuthApi(client) {
  return {
    isDemo: false,
    available: true,
    demoAccounts: null,

    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw toAuthError(error)
      return data.user
    },

    async signOut() {
      const { error } = await client.auth.signOut()
      // Mesmo se o servidor falhar, a sessão local é descartada pelo supabase-js.
      if (error) throw toAuthError(error)
    },

    /** Sessão atual (lida do armazenamento local e renovada se necessário). */
    async getSession() {
      const { data, error } = await client.auth.getSession()
      if (error) throw toAuthError(error)
      return data.session
    },

    /** @returns {() => void} função que cancela a inscrição */
    onAuthChange(callback) {
      const { data } = client.auth.onAuthStateChange((event, session) => callback(event, session))
      return () => data.subscription.unsubscribe()
    },
  }
}
