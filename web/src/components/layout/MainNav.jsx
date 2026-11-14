import { NavLink } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { useAuth } from '../../hooks/useAuth.js'
import { cn } from '../../utils/cn.js'
import { INDICATOR_SPRING } from '../ui/motion.js'

const PUBLIC_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/pontos', label: 'Pontos' },
  { to: '/historico', label: 'Histórico' },
]

const ADMIN_ITEM = { to: '/admin/pontos', label: 'Gerenciar' }

/** Navegação principal. O NavLink define aria-current="page" no item ativo; a pill ativa desliza entre itens. */
export default function MainNav({ className }) {
  const { isAdmin } = useAuth()
  const reducedMotion = useReducedMotion()
  const items = isAdmin ? [...PUBLIC_ITEMS, ADMIN_ITEM] : PUBLIC_ITEMS

  return (
    // Se faltar espaço, a rolagem fica DENTRO da navegação (nunca na página).
    <nav aria-label="Navegação principal" className={cn('max-w-full overflow-x-auto', className)}>
      <ul className="flex w-max gap-1 rounded-full bg-slate-900/5 p-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative inline-flex min-h-10 items-center rounded-full px-4 py-2 text-sm transition-colors duration-150',
                  isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-700 hover:text-slate-900',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="main-nav-pill"
                      transition={reducedMotion ? { duration: 0 } : INDICATOR_SPRING}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-white shadow-card ring-1 ring-slate-900/5"
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
