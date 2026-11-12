import { cva } from 'class-variance-authority'
import { cn } from '../../utils/cn.js'
import { getIconByName, getToneClasses } from './tones.js'

const badge = cva('inline-flex items-center gap-1.5 whitespace-nowrap font-medium ring-1 ring-inset', {
  variants: {
    size: {
      sm: 'rounded-full px-2 py-0.5 text-xs',
      md: 'rounded-full px-2.5 py-1 text-sm',
    },
  },
  defaultVariants: { size: 'md' },
})

/**
 * Selo de estado: tom + ícone (por nome, vindo de utils/statusTones) + texto.
 * Com `dot`, troca o ícone por um ponto; o texto continua obrigatório.
 * @param {{ tone?: string, icon?: string, size?: 'sm'|'md', dot?: boolean, className?: string, children: import('react').ReactNode }} props
 */
export default function Badge({ tone = 'neutral', icon, size, dot = false, className, children }) {
  const classes = getToneClasses(tone)
  const Icon = icon ? getIconByName(icon) : null
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'
  return (
    <span className={cn(badge({ size }), classes.soft, className)}>
      {dot && <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', classes.dot)} />}
      {!dot && Icon && <Icon aria-hidden="true" focusable="false" className={cn('shrink-0', iconSize)} />}
      {children}
    </span>
  )
}

/**
 * Selo a partir de um resultado de utils/statusTones ({ label, tone, icon }).
 * @param {{ info: { label: string, tone: string, icon: string }, prefix?: string, size?: 'sm'|'md', dot?: boolean, className?: string }} props
 */
export function StatusBadge({ info, prefix, size, dot, className }) {
  return (
    <Badge tone={info.tone} icon={info.icon} size={size} dot={dot} className={className}>
      {prefix && <span className="sr-only">{prefix}: </span>}
      {info.label}
    </Badge>
  )
}
