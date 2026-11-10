import { useContext } from 'react'
import { AuthContext } from './authContext.js'

/**
 * Sessão administrativa atual.
 *
 * Retorna:
 *   status          'loading' | 'anonymous' | 'authenticated' | 'unavailable'
 *   user, isAdmin   usuário do Supabase Auth e se tem app_metadata.role = 'admin'
 *   sessionExpired  true quando a sessão terminou sem logout manual
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
