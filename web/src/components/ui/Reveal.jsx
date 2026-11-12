import { motion } from 'motion/react'
import { fadeUp, staggerContainer } from './motion.js'

/** Entrada suave (fade + subida de 8 px) ao montar. */
export function Reveal({ as = 'div', className, children, ...props }) {
  const Component = motion[as] ?? motion.div
  return (
    <Component variants={fadeUp} initial="hidden" animate="visible" className={className} {...props}>
      {children}
    </Component>
  )
}

/** Lista cujos filhos <AnimatedItem> entram em sequência. */
export function AnimatedList({ as = 'div', className, children, ...props }) {
  const Component = motion[as] ?? motion.div
  return (
    <Component variants={staggerContainer} initial="hidden" animate="visible" className={className} {...props}>
      {children}
    </Component>
  )
}

export function AnimatedItem({ as = 'div', className, children, ...props }) {
  const Component = motion[as] ?? motion.div
  return (
    <Component variants={fadeUp} className={className} {...props}>
      {children}
    </Component>
  )
}
