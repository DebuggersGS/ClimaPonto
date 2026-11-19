import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthContext } from '../../hooks/authContext.js'
import * as authService from '../../services/authService.js'

/**
 * Mantém a sessão administrativa (Supabase Auth ou autenticação demonstrativa do modo mock) em um estado React compartilhado.
 *
 * Sessão expirada: o supabase-js renova o token automaticamente; se a
 * renovação falhar, ele emite SIGNED_OUT. Quando isso acontece sem que o
 * usuário tenha clicado em "Sair", a interface informa que a sessão expirou.
 */
export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState(authService.isAuthAvailable ? 'loading' : 'unavailable')
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

  // authService.signIn já recusa (e desconecta) contas sem papel de administrador.
  // Essa desconexão é decisão da própria entrada, não expiração: o SIGNED_OUT dela
  // é tratado como manual para não exibir "Sua sessão expirou" depois da recusa.
  const signIn = useCallback(async (email, password) => {
    manualSignOut.current = true
    try {
      const user = await authService.signIn(email, password)
      manualSignOut.current = false
      return user
    } catch (error) {
      // Só a recusa por papel emite SIGNED_OUT (que zera o marcador); nos demais erros nada foi desconectado.
      if (error?.kind !== 'permission') manualSignOut.current = false
      throw error
    }
  }, [])

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
      isDemo: authService.isDemoAuth,
      demoAccounts: authService.getDemoAccounts(),
      signIn,
      signOut,
      handleSessionExpired,
    }
  }, [session, status, sessionExpired, signIn, signOut, handleSessionExpired])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
