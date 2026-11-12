import { useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '../../utils/cn.js'
import { INDICATOR_SPRING } from './motion.js'

/**
 * Controle segmentado: grupo rotulado de botões com aria-pressed e indicador
 * ativo animado (layoutId). O estado ativo também tem negrito + indicador,
 * nunca só cor.
 * @param {{ label: string, options: { value: string, label: string }[], value: string, onChange: (value: string) => void, className?: string }} props
 */
export default function SegmentedControl({ label, options, value, onChange, className }) {
  const groupId = useId()
  return (
    <div role="group" aria-label={label} className={cn('inline-flex max-w-full flex-wrap gap-1 rounded-full bg-slate-900/5 p-1', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative min-h-10 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150',
              active ? 'font-semibold text-slate-900' : 'text-slate-700 hover:text-slate-900',
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${groupId}`}
                transition={INDICATOR_SPRING}
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-white shadow-card ring-1 ring-slate-900/5"
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
