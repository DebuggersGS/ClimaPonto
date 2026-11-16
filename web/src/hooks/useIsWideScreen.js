import { useSyncExternalStore } from 'react'

/** Mesmo ponto de corte do breakpoint `xl` do Tailwind: barra lateral a partir daqui, menu móvel abaixo. */
const QUERY = '(min-width: 1280px)'

function subscribe(callback) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

/**
 * true quando a janela tem 1280 px ou mais. Serve para NÃO renderizar a navegação que não se aplica
 * ao tamanho atual (em vez de escondê-la por CSS), assim não há controles invisíveis no DOM.
 */
export function useIsWideScreen() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
