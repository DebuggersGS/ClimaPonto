import { NavLink } from 'react-router'
import { LayoutDashboard, MapPin, History, Settings } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useAuth } from '../../hooks/useAuth.js'
import { cn } from '../../utils/cn.js'
import { INDICATOR_SPRING } from '../ui/motion.js'

const PUBLIC_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pontos', label: 'Pontos', icon: MapPin },
  { to: '/historico', label: 'Histórico', icon: History },
]

const ADMIN_ITEM = { to: '/admin/pontos', label: 'Gerenciar', icon: Settings }

/**
 * Navegação principal. O NavLink define aria-current="page" no item ativo; a pill ativa desliza entre itens.
 * Em telas estreitas os itens dividem a largura e quebram de linha se preciso: nada fica escondido
 * por rolagem interna, e cada alvo tem ao menos 44 px de altura.
 */
export default function MainNav({ className }) {
  const { isAdmin } = useAuth()
  const reducedMotion = useReducedMotion()
  const items = isAdmin ? [...PUBLIC_ITEMS, ADMIN_ITEM] : PUBLIC_ITEMS

  return (
    <nav aria-label="Navegação principal" className={cn('max-w-full', className)}>
      <ul className="flex w-full flex-wrap gap-1 glass-control rounded-3xl p-1 sm:w-max sm:rounded-full">
        {items.map((item) => (
          <li key={item.to} className="min-w-0 flex-1 sm:flex-none">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-11 items-center justify-center rounded-full px-2 py-2 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:inline-flex sm:px-4',
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
                      className="absolute inset-0 rounded-full bg-surface shadow-card ring-1 ring-slate-900/5"
                    />
                  )}
                  <span className="relative inline-flex items-center gap-2">
                    <item.icon aria-hidden="true" className="hidden h-4 w-4 shrink-0 sm:block" strokeWidth={isActive ? 2.5 : 2} />
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
