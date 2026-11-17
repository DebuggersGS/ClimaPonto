import { Dialog } from '@base-ui/react/dialog'
import { cva } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn.js'

export const Sheet = Dialog.Root
export const SheetTrigger = Dialog.Trigger
export const SheetClose = Dialog.Close
export const SheetDescription = Dialog.Description

/** Título obrigatório: dá o nome acessível ao diálogo (aria-labelledby). */
export function SheetTitle({ className, ...props }) {
  return <Dialog.Title className={cn('text-lg font-semibold text-slate-900', className)} {...props} />
}

const panel = cva(
  'sheet-panel fixed z-50 flex flex-col gap-4 overflow-y-auto bg-surface p-5 text-slate-800 shadow-elevated outline-none',
  {
    variants: {
      side: {
        right: 'inset-y-0 right-0 w-[min(26rem,100vw)] rounded-l-sheet data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
        left: 'inset-y-0 left-0 w-[min(26rem,100vw)] rounded-r-sheet data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
        bottom: 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-sheet data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full',
      },
    },
    defaultVariants: { side: 'right' },
  },
)

/**
 * Painel modal lateral ou inferior. Traz botão "Fechar" com nome acessível;
 * foco preso, Esc e clique no fundo fecham (Base UI).
 * @param {{ side?: 'right'|'left'|'bottom', className?: string, children: import('react').ReactNode }} props
 */
export function SheetContent({ side, className, children, ...props }) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="overlay-backdrop fixed inset-0 z-50 bg-ink/60" />
      <Dialog.Popup className={cn(panel({ side }), className)} {...props}>
        {children}
        <Dialog.Close
          aria-label="Fechar"
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-900/5"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </Dialog.Close>
      </Dialog.Popup>
    </Dialog.Portal>
  )
}
