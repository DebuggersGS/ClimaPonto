/**
 * Tokens de movimento da interface (valores puros; a biblioteca de animação
 * os consome). Durações em segundos, como esperado pelo Motion; `*Ms` em ms.
 *
 * Faixas: hover/foco 120-180 ms, mudança de estado 160-240 ms, painéis 200-300 ms.
 * Movimento reduzido: só opacidade, sem deslocamento nem escala.
 */

export const DURATION_MS = Object.freeze({ hover: 150, focus: 120, state: 200, panel: 260 })

/** Durações em segundos. */
export const DURATION = Object.freeze({
  hover: DURATION_MS.hover / 1000,
  focus: DURATION_MS.focus / 1000,
  state: DURATION_MS.state / 1000,
  panel: DURATION_MS.panel / 1000,
})

/** Curvas cubic-bezier [x1, y1, x2, y2]. */
export const EASING = Object.freeze({
  standard: Object.freeze([0.2, 0, 0, 1]),
  enter: Object.freeze([0, 0, 0.2, 1]),
  exit: Object.freeze([0.4, 0, 1, 1]),
})

/** Distâncias em px (deslocamentos curtos; nada chamativo). */
export const DISTANCE = Object.freeze({ hover: 2, state: 4, panel: 16 })

/** Escala máxima de feedback de clique/hover. */
export const SCALE = Object.freeze({ press: 0.98, hover: 1.02 })

/**
 * Variantes de movimento normal: opacidade + deslocamento curto.
 * @type {Record<'hover'|'state'|'panel', { initial: object, animate: object, exit: object, transition: object }>}
 */
export const MOTION_VARIANTS = Object.freeze({
  hover: variant('hover', 'standard'),
  state: variant('state', 'standard'),
  panel: variant('panel', 'enter'),
})

/** Variantes reduzidas: SÓ opacidade (sem x, y nem scale). */
export const REDUCED_MOTION_VARIANTS = Object.freeze({
  hover: reduced('hover'),
  state: reduced('state'),
  panel: reduced('panel'),
})

function variant(kind, easing) {
  return Object.freeze({
    initial: { opacity: 0, y: DISTANCE[kind] },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: DISTANCE[kind] },
    transition: { duration: DURATION[kind], ease: EASING[easing] },
  })
}

function reduced(kind) {
  return Object.freeze({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: DURATION[kind], ease: EASING.standard },
  })
}

/**
 * Escolhe as variantes conforme a preferência do usuário.
 * @param {boolean} prefersReducedMotion
 * @returns {typeof MOTION_VARIANTS}
 */
export function getMotionVariants(prefersReducedMotion) {
  return prefersReducedMotion ? REDUCED_MOTION_VARIANTS : MOTION_VARIANTS
}
