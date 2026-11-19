import { useContext } from 'react'
import { AuthContext } from './authContext.js'

/**
 * Sessão administrativa atual.
 *
 * Retorna:
 *   status          'loading' | 'anonymous' | 'authenticated' | 'unavailable'
 *   user, isAdmin   usuário da sessão (Supabase Auth ou conta fictícia no mock) e se tem app_metadata.role = 'admin'
 *   sessionExpired  true quando a sessão terminou sem logout manual
 *   isDemo          true no modo mock (autenticação demonstrativa, só em memória)
 *   demoAccounts    contas fictícias { email, password, label } ou null fora do mock
 *   signIn, signOut, handleSessionExpired
 *
 * `isAdmin` controla apenas a INTERFACE; o RLS do banco é a autoridade.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.')
  }
  return context
}
