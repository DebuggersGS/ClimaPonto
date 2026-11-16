import { NavLink } from 'react-router'
import { useAuth } from '../../hooks/useAuth.js'
import { cn } from '../../utils/cn.js'
import { getNavItems } from './navItems.js'

/**
 * Navegação principal, a mesma lista na barra lateral (desktop) e no menu móvel.
 * O NavLink define aria-current="page" no item ativo; o ativo também ganha fundo, peso e uma marca à esquerda,
 * então o estado nunca depende só de cor. Com `collapsed` só o ícone aparece; o nome fica no DOM (sr-only) e no title.
 * @param {{ id?: string, collapsed?: boolean, onNavigate?: () => void, className?: string, listRef?: import('react').Ref<HTMLUListElement> }} props
 */
export default function MainNav({ id, collapsed = false, onNavigate, className, listRef }) {
  const { isAdmin } = useAuth()
  const items = getNavItems(isAdmin)

  return (
    <nav id={id} aria-label="Navegação principal" className={cn('max-w-full', className)}>
      <ul ref={listRef} className="glass-control flex w-full flex-col gap-1 rounded-3xl p-1.5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-surface font-semibold text-slate-900 shadow-card ring-1 ring-slate-900/5 before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-brand-600'
                    : 'font-medium text-slate-700 hover:bg-slate-900/5 hover:text-slate-900',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  <span className={collapsed ? 'sr-only' : undefined}>{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
