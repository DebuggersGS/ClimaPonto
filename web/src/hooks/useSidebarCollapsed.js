import { useCallback, useState } from 'react'
import { readSidebarPinned, writeSidebarPinned } from '../utils/sidebarState.js'

function getStorage() {
  try {
    return window.localStorage
  } catch {
    // Armazenamento bloqueado (modo privado, política do navegador): a preferência vale só nesta visita.
    return null
  }
}

/**
 * Preferência persistida da barra lateral: fixada expandida (pin) ou compacta.
 * A leitura e a escrita seguras ficam em utils/sidebarState.js.
 * @returns {{ pinned: boolean, togglePinned: () => void }}
 */
export function useSidebarCollapsed() {
  const [pinned, setPinned] = useState(() => readSidebarPinned(getStorage(), false))

  const togglePinned = useCallback(() => {
    setPinned((current) => {
      writeSidebarPinned(getStorage(), !current)
      return !current
    })
  }, [])

  return { pinned, togglePinned }
}
