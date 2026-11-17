import { useCallback, useState } from 'react'
import {
  readSidebarOpenGroup,
  readSidebarPinned,
  writeSidebarOpenGroup,
  writeSidebarPinned,
} from '../utils/sidebarState.js'

function getStorage() {
  try {
    return window.localStorage
  } catch {
    // Armazenamento bloqueado (modo privado, política do navegador): a preferência vale só nesta visita.
    return null
  }
}

/**
 * Preferências persistidas da barra lateral: fixada (pin) e grupo aberto.
 * A leitura e a escrita seguras ficam em utils/sidebarState.js.
 * @returns {{ pinned: boolean, togglePinned: () => void, openGroup: string|null, setOpenGroup: (id: string|null) => void }}
 */
export function useSidebarCollapsed() {
  const [pinned, setPinned] = useState(() => readSidebarPinned(getStorage(), false))
  const [openGroup, setOpenGroupState] = useState(() => readSidebarOpenGroup(getStorage()))

  const togglePinned = useCallback(() => {
    setPinned((current) => {
      writeSidebarPinned(getStorage(), !current)
      return !current
    })
  }, [])

  const setOpenGroup = useCallback((id) => {
    setOpenGroupState(id)
    writeSidebarOpenGroup(getStorage(), id)
  }, [])

  return { pinned, togglePinned, openGroup, setOpenGroup }
}
