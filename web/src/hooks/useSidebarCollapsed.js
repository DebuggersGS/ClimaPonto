import { useCallback, useState } from 'react'

const STORAGE_KEY = 'climaponto:sidebar-recolhida'

function readStored() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // Armazenamento bloqueado (modo privado, política do navegador): usa o padrão expandido.
    return false
  }
}

/** Estado recolhido/expandido da barra lateral, lembrado entre visitas (preferência de interface, sem dados pessoais). */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readStored)
  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // Sem persistência: a preferência vale só nesta visita.
      }
      return next
    })
  }, [])
  return { collapsed, toggle }
}
