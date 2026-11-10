import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthContext } from '../../hooks/authContext.js'
import * as authService from '../../services/authService.js'
import { AppError } from '../../services/errors.js'
import { isSupabaseConfigured } from '../../services/supabaseClient.js'

/**
 * Mantém a sessão do Supabase Auth em um estado React compartilhado.
 *
 * Sessão expirada: o supabase-js renova o token automaticamente; se a
 * renovação falhar, ele emite SIGNED_OUT. Quando isso acontece sem que o
 * usuário tenha clicado em "Sair", a interface informa que a sessão expirou.
 */
export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState(isSupabaseConfigured ? 'loading' : 'unavailable')
  const [sessionExpired, setSessionExpired] = useState(false)
  const manualSignOut = useRef(false)
  const hadSession = useRef(false)

  useEffect(() => {
    // INITIAL_SESSION é emitido logo após a inscrição, com a sessão salva (ou null).
    return authService.onAuthChange((event, nextSession) => {
      if (event === 'SIGNED_OUT' && hadSession.current && !manualSignOut.current) {
        setSessionExpired(true)
      }
      if (event === 'SIGNED_IN') {
        setSessionExpired(false)
      }
      if (event === 'SIGNED_OUT') {
        manualSignOut.current = false
      }
      hadSession.current = Boolean(nextSession)
      setSession(nextSession)
      setStatus(nextSession ? 'authenticated' : 'anonymous')
    })
  }, [])

  const signOut = useCallback(async () => {
    manualSignOut.current = true
    try {
      await authService.signOut()
    } catch {
      // A sessão local é descartada mesmo se o servidor não responder.
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const user = await authService.signIn(email, password)
    if (!authService.isAdminUser(user)) {
      await signOut()
      throw new AppError('Esta conta não tem acesso administrativo.', { kind: 'permission' })
    }
    return user
  }, [signOut])

  /** Chamado quando uma operação no banco indica sessão expirada. */
  const handleSessionExpired = useCallback(async () => {
    setSessionExpired(true)
    manualSignOut.current = true
    try {
      await authService.signOut()
    } catch {
      // ignora: o objetivo é apenas limpar a sessão local
    }
  }, [])

  const value = useMemo(() => {
    const user = session?.user ?? null
    return {
      status,
      user,
      isAdmin: authService.isAdminUser(user),
      sessionExpired,
      signIn,
      signOut,
      handleSessionExpired,
    }
  }, [session, status, sessionExpired, signIn, signOut, handleSessionExpired])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
