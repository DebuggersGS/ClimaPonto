import { useCallback, useEffect, useState } from 'react'

/** Elementos em que o atalho não deve roubar o foco do usuário. */
function isEditable(element) {
  if (!element) return false
  const tag = element.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable
}

/**
 * Estado de abertura da Command Palette e atalho Ctrl+K / Meta+K.
 * O atalho é ignorado quando o foco está num campo editável e quando outro
 * diálogo modal já está aberto.
 * @returns {{ isOpen: boolean, open: () => void, close: () => void }}
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key.toLowerCase() !== 'k' || !(event.ctrlKey || event.metaKey) || event.altKey) return
      if (isEditable(document.activeElement) || document.querySelector('dialog[open]')) return
      event.preventDefault()
      setIsOpen(true)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { isOpen, open, close }
}
