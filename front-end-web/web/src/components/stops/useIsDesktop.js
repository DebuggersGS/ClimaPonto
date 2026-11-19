import { useSyncExternalStore } from 'react'

/** Largura a partir da qual a ficha é painel lateral (abaixo, bottom sheet). */
const QUERY = '(min-width: 1024px)'

function subscribe(callback) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

/** true quando a janela tem 1024 px ou mais. */
export function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
