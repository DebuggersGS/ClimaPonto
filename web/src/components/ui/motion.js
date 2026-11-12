/** Variantes de animação reutilizáveis (usadas com `motion` e respeitando MotionConfig reducedMotion="user"). */

export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1]

export const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT_SOFT } },
}

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
}

/** Transição de mola discreta do indicador ativo (layoutId). */
export const INDICATOR_SPRING = { type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }
