import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { cn } from '../../utils/cn.js'

export const Tabs = BaseTabs.Root

/** Lista de abas: o estado ativo usa fundo e sublinhado, além da cor. */
export function TabsList({ className, ...props }) {
  return (
    <BaseTabs.List
      className={cn('glass-control relative inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }) {
  return (
    <BaseTabs.Tab
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-900/5 data-[active]:bg-brand-700 data-[active]:text-white data-[active]:underline data-[active]:underline-offset-4',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }) {
  return <BaseTabs.Panel className={cn('mt-4 outline-none focus-visible:outline-2', className)} {...props} />
}
