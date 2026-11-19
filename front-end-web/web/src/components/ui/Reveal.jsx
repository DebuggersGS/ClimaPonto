import { motion, useReducedMotion } from 'motion/react'
import { fadeUp, staggerContainer } from './motion.js'

/**
 * Entrada suave (fade + subida de 8 px) ao montar. Com movimento reduzido
 * renderiza direto no estado final: sem deslocamento, sem fade e sem atraso.
 */
export function Reveal({ as = 'div', className, children, ...props }) {
  const reduced = useReducedMotion()
  const Component = motion[as] ?? motion.div
  return (
    <Component variants={fadeUp} initial={reduced ? false : 'hidden'} animate="visible" className={className} {...props}>
      {children}
    </Component>
  )
}

/** Lista cujos filhos <AnimatedItem> entram em sequência. */
export function AnimatedList({ as = 'div', className, children, ...props }) {
  const reduced = useReducedMotion()
  const Component = motion[as] ?? motion.div
  return (
    <Component variants={staggerContainer} initial={reduced ? false : 'hidden'} animate="visible" className={className} {...props}>
      {children}
    </Component>
  )
}

/** Filho de <AnimatedList>: herda o estado do contêiner (já final com movimento reduzido). */
export function AnimatedItem({ as = 'div', className, children, ...props }) {
  const Component = motion[as] ?? motion.div
  return (
    <Component variants={fadeUp} className={className} {...props}>
      {children}
    </Component>
  )
}
