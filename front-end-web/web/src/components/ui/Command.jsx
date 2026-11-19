import { Dialog } from '@base-ui/react/dialog'
import { Search } from 'lucide-react'
import { cn } from '../../utils/cn.js'

/**
 * Primitives de paleta de comandos (padrão combobox + listbox). Sem estado de
 * busca próprio: quem usa controla o texto, o item ativo e a seleção, de modo
 * que a lógica de resultados continue em funções puras (`utils/commandSearch.js`).
 */

/**
 * Diálogo modal da paleta.
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, title: string, returnFocusRef?: import('react').RefObject<HTMLElement|null>, children: import('react').ReactNode }} props
 */
export function Command({ open, onOpenChange, title, returnFocusRef, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="overlay-backdrop fixed inset-0 z-50 bg-ink/60" />
        {/* finalFocus: aberto por código (sem Dialog.Trigger), o foco precisa voltar a quem abriu. */}
        <Dialog.Popup
          finalFocus={() => (returnFocusRef?.current?.isConnected ? returnFocusRef.current : true)}
          className="overlay-motion fixed left-1/2 top-[10vh] z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 rounded-card bg-surface p-4 text-slate-900 shadow-elevated outline-none">
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/**
 * Campo de busca da paleta. `listId` e `activeId` ligam o campo à lista e à opção ativa.
 * @param {{ label: string, listId: string, activeId?: string, className?: string }} props
 */
export function CommandInput({ label, listId, activeId, className, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-800">{label}</span>
      <span className="relative block">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
        <input
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          autoComplete="off"
          className={cn(
            'h-field w-full rounded-field border border-slate-300 bg-surface pl-10 pr-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            className,
          )}
          {...props}
        />
      </span>
    </label>
  )
}

export function CommandList({ id, label = 'Resultados', className, ...props }) {
  return <ul id={id} role="listbox" aria-label={label} className={cn('mt-3 max-h-80 space-y-1 overflow-y-auto', className)} {...props} />
}

/** Opção da lista; o item ativo usa fundo e anel (não só cor). */
export function CommandItem({ active = false, className, children, ...props }) {
  return (
    <li
      role="option"
      aria-selected={active}
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3 rounded-field px-3 py-2',
        active ? 'bg-brand-50 text-brand-900 ring-2 ring-brand-600 dark:bg-brand-900/40 dark:text-brand-100' : 'hover:bg-slate-900/5',
        className,
      )}
      {...props}
    >
      {children}
    </li>
  )
}

/** Mensagem de situação (contagem ou vazio), anunciada por leitores de tela. */
export function CommandStatus({ className, ...props }) {
  return <p role="status" className={cn('mt-2 text-sm text-slate-600', className)} {...props} />
}
