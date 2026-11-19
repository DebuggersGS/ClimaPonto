import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import { cn } from '../../utils/cn.js'

/** Provedor opcional: agrupa tooltips para que o atraso só valha na primeira abertura. */
export const TooltipProvider = BaseTooltip.Provider

/**
 * Dica curta ao passar o mouse ou focar o controle. Nunca guarde informação
 * essencial aqui: em toque ela não aparece, então o controle precisa de nome acessível próprio.
 * @param {{ content: import('react').ReactNode, children: import('react').ReactElement, side?: 'top'|'bottom'|'left'|'right', className?: string, disabled?: boolean }} props
 */
export default function Tooltip({ content, children, side = 'top', className, disabled = false }) {
  return (
    <BaseTooltip.Root disabled={disabled}>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={8} className="z-50">
          <BaseTooltip.Popup
            className={cn(
              'overlay-motion max-w-64 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-on-ink shadow-elevated',
              className,
            )}
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}
