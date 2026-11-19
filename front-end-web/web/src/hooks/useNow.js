import { useEffect, useState } from 'react'

/**
 * Data/hora atual, atualizada a cada `intervalMs` (padrão 30 s).
 * Serve para recalcular conectividade e idade das leituras sem nova consulta.
 *
 * Regras: não atualiza enquanto a aba está oculta (document.hidden) e
 * atualiza imediatamente ao voltar a ficar visível; o intervalo e o listener
 * são removidos no cleanup.
 *
 * @param {number} [intervalMs=30000]
 * @returns {Date}
 */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => {
      if (!document.hidden) setNow(new Date())
    }
    const handleVisibility = () => {
      if (!document.hidden) setNow(new Date())
    }

    const intervalId = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [intervalMs])

  return now
}
