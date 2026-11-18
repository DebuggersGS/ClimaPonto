import { useCallback, useEffect, useRef, useState } from 'react'

/** Elementos em que o atalho não deve roubar o foco do usuário. */
function isEditable(element) {
  if (!element) return false
  const tag = element.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable
}

/**
 * Estado de abertura da Command Palette e atalho Ctrl+K / Meta+K.
 * O atalho é ignorado quando o foco está num campo editável e quando outro
 * diálogo (nativo ou Base UI, inclusive a própria paleta e o drawer) já está aberto.
 * Guarda o elemento focado ao abrir (`returnFocusRef`): ao fechar, o foco volta para ele.
 * @returns {{ isOpen: boolean, open: () => void, close: () => void, returnFocusRef: import('react').RefObject<HTMLElement|null> }}
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const returnFocusRef = useRef(null)
  const open = useCallback(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setIsOpen(true)
  }, [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key.toLowerCase() !== 'k' || !(event.ctrlKey || event.metaKey) || event.altKey) return
      if (isEditable(document.activeElement) || document.querySelector('dialog[open], [role="dialog"]')) return
      event.preventDefault()
      open()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return { isOpen, open, close, returnFocusRef }
}
