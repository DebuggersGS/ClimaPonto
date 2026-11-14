import { toAuthError } from './errors.js'

/**
 * Autenticação DEMONSTRATIVA do modo mock (VITE_DATA_MODE=mock).
 *
 * Mesma interface de supabaseAuthApi.js. As contas são fictícias e só valem
 * aqui; a sessão fica na memória da instância (sem localStorage), então
 * recarregar a página encerra a sessão. Não importa supabaseClient.js.
 */

/** Contas fictícias exibidas na tela de login do modo demonstração. */
export const MOCK_AUTH_ACCOUNTS = [
  {
    id: 'mock-user-admin',
    email: 'admin.demo@climaponto.example',
    password: 'demo-admin-2026',
    role: 'admin',
    label: 'Administrador (demonstração)',
  },
  {
    id: 'mock-user-leitor',
    email: 'leitor.demo@climaponto.example',
    password: 'demo-leitor-2026',
    role: null,
    label: 'Leitor sem acesso administrativo (demonstração)',
  },
]

const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase()

function toSession(account) {
  const appMetadata = account.role ? { role: account.role } : {}
  return { user: { id: account.id, email: account.email, app_metadata: appMetadata } }
}

/**
 * @param {object} [options]
 * @param {typeof MOCK_AUTH_ACCOUNTS} [options.accounts]
 */
export function createMockAuthApi({ accounts = MOCK_AUTH_ACCOUNTS } = {}) {
  let session = null
  const listeners = new Set()

  const emit = (event) => {
    for (const listener of [...listeners]) listener(event, session)
  }

  return {
    isDemo: true,
    available: true,
    demoAccounts: accounts.map(({ email, password, label }) => ({ email, password, label })),

    async signIn(email, password) {
      const key = normalizeEmail(email)
      const account = accounts.find((item) => item.email.toLowerCase() === key)
      if (!account || account.password !== password) {
        throw toAuthError({ code: 'invalid_credentials', status: 400, message: 'Invalid login credentials' })
      }
      session = toSession(account)
      emit('SIGNED_IN')
      return session.user
    },

    async signOut() {
      session = null
      emit('SIGNED_OUT')
    },

    async getSession() {
      return session
    },

    onAuthChange(callback) {
      listeners.add(callback)
      // Como o supabase-js: o estado inicial chega de forma assíncrona após a inscrição.
      queueMicrotask(() => {
        if (listeners.has(callback)) callback('INITIAL_SESSION', session)
      })
      return () => {
        listeners.delete(callback)
      }
    },
  }
}
