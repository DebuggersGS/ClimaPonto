import { useEffect, useState } from 'react'

/**
 * Estado de conexão do navegador (navigator.onLine + eventos online/offline).
 * É só um indicativo: online=true não garante que a API responda.
 * @returns {boolean} true quando o navegador acredita estar online
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}
