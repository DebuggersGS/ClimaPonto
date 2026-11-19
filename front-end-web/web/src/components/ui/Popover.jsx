import { Popover as BasePopover } from '@base-ui/react/popover'
import { cn } from '../../utils/cn.js'

export const Popover = BasePopover.Root
export const PopoverTrigger = BasePopover.Trigger
export const PopoverClose = BasePopover.Close
export const PopoverTitle = BasePopover.Title

/**
 * Conteúdo flutuante ancorado ao gatilho (foco, Esc e clique fora vêm do Base UI).
 * Use `PopoverTitle` para dar nome ao conteúdo.
 * @param {{ side?: 'top'|'bottom'|'left'|'right', align?: 'start'|'center'|'end', className?: string, children: import('react').ReactNode }} props
 */
export function PopoverContent({ side = 'bottom', align = 'center', className, children, ...props }) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner side={side} align={align} sideOffset={8} collisionPadding={8} className="z-50">
        <BasePopover.Popup
          className={cn(
            'overlay-motion w-72 max-w-[calc(100vw-1rem)] rounded-card bg-surface p-4 text-sm text-slate-800 shadow-elevated ring-1 ring-slate-900/10',
            className,
          )}
          {...props}
        >
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  )
}
