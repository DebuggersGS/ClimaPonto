import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import Logo from './Logo.jsx'
import MainNav from './MainNav.jsx'

/**
 * Barra lateral do desktop (renderizada só a partir de 1280 px; abaixo disso vale o menu móvel do cabeçalho).
 * O botão de recolher mantém um rótulo fixo e expõe o estado em aria-expanded.
 * @param {{ collapsed: boolean, onToggle: () => void }} props
 */
export default function Sidebar({ collapsed, onToggle }) {
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose
  return (
    <div
      data-sidebar={collapsed ? 'collapsed' : 'expanded'}
      className={cn(
        'sticky top-0 flex h-screen shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-900/10 bg-surface p-3 transition-[width] duration-200 motion-reduce:transition-none',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      <div className={cn('flex items-center py-1', collapsed ? 'justify-center' : 'px-1')}>
        <Logo compact={collapsed} />
      </div>
      <MainNav id="navegacao-principal" collapsed={collapsed} />
      <button
        type="button"
        aria-label="Menu lateral"
        aria-expanded={!collapsed}
        aria-controls="navegacao-principal"
        title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        onClick={onToggle}
        className={cn(
          'mt-auto flex min-h-11 items-center justify-center gap-3 rounded-2xl px-3 text-sm font-medium text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        )}
      >
        <ToggleIcon aria-hidden="true" className="h-5 w-5 shrink-0" />
      </button>
    </div>
  )
}
