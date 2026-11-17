import { cva } from 'class-variance-authority'
import { cn } from '../../utils/cn.js'

const shape = cva('skeleton-shimmer rounded-lg', {
  variants: {
    shape: {
      text: 'h-4 w-full',
      metric: 'h-9 w-24',
      chart: 'h-56 w-full rounded-card',
      table: 'h-10 w-full',
      circle: 'h-10 w-10 rounded-full',
      block: 'h-24 w-full rounded-card',
    },
  },
  defaultVariants: { shape: 'text' },
})

const DEFAULT_ROWS = { text: 3, metric: 1, chart: 1, table: 5, circle: 1, block: 1 }

/**
 * Carregamento com shimmer. O contêiner é role="status" com texto só para
 * leitores de tela; as formas são decorativas. Com movimento reduzido o
 * shimmer é desligado via CSS.
 * @param {{ shape?: 'text'|'metric'|'chart'|'table'|'circle'|'block', rows?: number, label?: string, className?: string }} props
 */
export default function Skeleton({ shape: kind = 'text', rows, label = 'Carregando…', className }) {
  const count = rows ?? DEFAULT_ROWS[kind] ?? 1
  return (
    <div role="status" className={cn('flex flex-col gap-2', className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          // A última linha de texto é mais curta, como em um parágrafo real.
          className={cn(shape({ shape: kind }), kind === 'text' && index === count - 1 && count > 1 && 'w-2/3')}
        />
      ))}
    </div>
  )
}
