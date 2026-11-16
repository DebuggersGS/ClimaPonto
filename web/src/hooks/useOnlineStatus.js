import { useEffect, useState } from 'react'

const PROBE_INTERVAL_MS = 2000
const PROBE_TIMEOUT_MS = 3000

/**
 * Sonda leve à PRÓPRIA origem (sem chamadas externas). Só falha quando o navegador realmente não
 * consegue alcançar o servidor; um erro HTTP ainda prova que há conexão.
 * @param {AbortSignal} signal
 * @returns {Promise<boolean>} true quando a origem respondeu
 */
async function probeOrigin(signal) {
  try {
    await fetch(import.meta.env.BASE_URL || '/', { method: 'HEAD', cache: 'no-store', signal })
    return true
  } catch {
    return false
  }
}

/**
 * Estado de conexão. navigator.onLine é pouco confiável (falso em ambientes sem interface de rede
 * e sem eventos em alguns Chromium headless), então ele NÃO decide sozinho: a conexão é confirmada
 * por uma sonda à própria origem, repetida num intervalo curto e nos eventos online/offline/foco.
 * Parte de online para não gerar aviso falso. É só um indicativo: online=true não garante que a
 * API responda.
 * @returns {boolean} true quando a origem está acessível
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    let active = true
    let running = false
    let controller = null

    const check = async () => {
      if (running) return
      running = true
      controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
      const ok = await probeOrigin(controller.signal)
      window.clearTimeout(timeout)
      running = false
      if (active) setOnline(ok)
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    window.addEventListener('online', check)
    window.addEventListener('offline', check)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(check, PROBE_INTERVAL_MS)
    return () => {
      active = false
      controller?.abort()
      window.removeEventListener('online', check)
      window.removeEventListener('offline', check)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [])

  return online
}
