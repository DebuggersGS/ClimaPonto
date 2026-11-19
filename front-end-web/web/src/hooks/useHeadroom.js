import { useEffect, useState } from 'react'
import { nextHeadroomState } from '../utils/headroom.js'

/**
 * Cabeçalho inteligente: `hidden` vira true ao rolar para baixo e false ao rolar para cima,
 * perto do topo ou enquanto `pinned` (foco no cabeçalho, menu aberto). A regra pura fica em
 * utils/headroom.js; aqui só o listener passivo, agrupado por requestAnimationFrame.
 * @param {{ pinned?: boolean }} [options]
 * @returns {boolean}
 */
export function useHeadroom({ pinned = false } = {}) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let state = { hidden: false, lastY: window.scrollY }
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        state = nextHeadroomState({ ...state, y: window.scrollY })
        setHidden(state.hidden)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return pinned ? false : hidden
}
