import { useEffect, useState } from 'react'

const POLL_INTERVAL_MS = 2000

/**
 * Estado de conexão do navegador. Parte de online: navigator.onLine é pouco confiável (falso em
 * ambientes sem interface de rede) e gera aviso falso, então só reagimos a MUDANÇAS dele.
 * Alguns navegadores (Chromium headless) mudam navigator.onLine sem disparar 'offline', por isso
 * ele também é relido em online/offline, foco, visibilidade e num intervalo leve (sem rede).
 * É só um indicativo: online=true não garante que a API responda.
 * @returns {boolean} true quando o navegador acredita estar online
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    let last = navigator.onLine
    const sync = () => {
      const current = navigator.onLine
      if (current === last) return
      last = current
      setOnline(current)
    }
    const goOnline = () => {
      last = true
      setOnline(true)
    }
    const goOffline = () => {
      last = false
      setOnline(false)
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync()
    }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(sync, POLL_INTERVAL_MS)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [])

  return online
}
