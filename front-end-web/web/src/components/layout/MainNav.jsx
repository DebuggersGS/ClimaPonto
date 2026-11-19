import { useId } from 'react'
import { NavLink } from 'react-router'
import { motion } from 'motion/react'
import { useAuth } from '../../hooks/useAuth.js'
import { cn } from '../../utils/cn.js'
import Tooltip from '../ui/Tooltip.jsx'
import { INDICATOR_SPRING } from '../ui/motion.js'
import { getNavGroups } from './navItems.js'

/** Coluna fixa do ícone (48 px): o ícone fica no mesmo lugar com a barra compacta ou expandida. */
const ICON_COLUMN = 'flex h-11 w-12 shrink-0 items-center justify-center'

const LINK_BASE =
  'relative flex min-h-11 items-center overflow-hidden rounded-xl text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'

/**
 * Link de uma seção. O ativo tem fundo, barra lateral, peso e ícone mais forte (nunca só cor) e o
 * indicador desliza entre os itens (layoutId). O rótulo existe sempre no DOM (nome acessível estável);
 * com a barra compacta ele só fica transparente e recortado, e o nome aparece em tooltip.
 */
function NavItem({ item, compact, indicatorId, onNavigate }) {
  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(LINK_BASE, isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-700 hover:bg-slate-900/5 hover:text-slate-900')
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId={indicatorId}
              transition={INDICATOR_SPRING}
              aria-hidden="true"
              className="absolute inset-0 rounded-xl bg-brand-50 ring-1 ring-brand-600/15 before:absolute before:inset-y-2.5 before:left-0 before:w-1 before:rounded-r-full before:bg-brand-600 dark:bg-brand-900/45 dark:ring-brand-500/25 dark:before:bg-brand-500"
            />
          )}
          <span className={cn(ICON_COLUMN, 'relative')}>
            <item.icon
              aria-hidden="true"
              className={cn('h-5 w-5', isActive && 'text-brand-700 dark:text-brand-200')}
              strokeWidth={isActive ? 2.4 : 2}
            />
          </span>
          <span
            className={cn(
              'relative min-w-0 truncate pr-3 transition-opacity duration-150',
              compact ? 'opacity-0' : 'opacity-100 delay-75',
            )}
          >
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  )
  return (
    <li>
      {compact === undefined ? (
        link
      ) : (
        <Tooltip content={item.label} side="right" disabled={!compact}>
          {link}
        </Tooltip>
      )}
    </li>
  )
}

/**
 * Navegação principal: todas as seções sempre visíveis, separadas por rótulos de grupo discretos
 * (sem acordeões: nenhuma página fica escondida atrás de um clique extra).
 * - Na barra lateral (`compact` booleano), a mesma estrutura serve aos dois estados: na compacta o
 *   rótulo do grupo vira um filete na mesma altura (sem salto vertical ao expandir).
 * - No drawer (`compact` indefinido), rótulos de grupo sempre visíveis.
 * O NavLink define aria-current="page" no item ativo.
 * @param {{ id?: string, compact?: boolean, onNavigate?: () => void, className?: string }} props
 */
export default function MainNav({ id, compact, onNavigate, className }) {
  const { isAdmin } = useAuth()
  const groups = getNavGroups(isAdmin)
  const indicatorId = `${useId()}-ativo`
  const inSidebar = compact !== undefined

  return (
    <nav id={id} aria-label="Navegação principal" className={cn('w-full', className)}>
      <ul className="flex w-full flex-col gap-1">
        {groups.map((group, index) => (
          <li key={group.id}>
            {inSidebar ? (
              <div aria-hidden={compact || undefined} className={cn('relative flex items-center', index === 0 ? 'h-6' : 'h-8')}>
                {index > 0 && (
                  <span
                    className={cn(
                      'absolute inset-x-3 top-1/2 h-px bg-slate-900/10 transition-opacity duration-150',
                      compact ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                )}
                <span
                  className={cn(
                    'whitespace-nowrap px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-600 transition-opacity duration-150',
                    compact ? 'opacity-0' : 'opacity-100 delay-75',
                  )}
                >
                  {group.label}
                </span>
              </div>
            ) : (
              <p className="px-3 pb-1 pt-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-600">{group.label}</p>
            )}
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => (
                <NavItem key={item.to} item={item} compact={compact} indicatorId={indicatorId} onNavigate={onNavigate} />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  )
}
