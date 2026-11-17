import { useId } from 'react'
import { NavLink } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { cn } from '../../utils/cn.js'
import { DURATION, EASING } from '../../utils/motionTokens.js'
import Tooltip from '../ui/Tooltip.jsx'
import { INDICATOR_SPRING } from '../ui/motion.js'
import { getNavGroups } from './navItems.js'

const LINK_BASE =
  'relative flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'

/** Link de uma seção. O indicador ativo desliza entre itens (layoutId) e também tem fundo, peso e barra: nunca só cor. */
function NavItem({ item, groupId, rail, indicatorId, onNavigate, onFocusItem }) {
  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      onFocus={() => onFocusItem?.(groupId)}
      className={({ isActive }) =>
        cn(LINK_BASE, rail && 'justify-center px-0', isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-700 hover:bg-slate-900/5 hover:text-slate-900')
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId={indicatorId}
              transition={INDICATOR_SPRING}
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl bg-surface shadow-card ring-1 ring-slate-900/5 before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-brand-600"
            />
          )}
          <item.icon aria-hidden="true" className="relative h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
          <span className={cn('relative whitespace-nowrap', rail && 'sr-only')}>{item.label}</span>
        </>
      )}
    </NavLink>
  )
  return <li>{rail ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link}</li>
}

function ItemList({ group, ...props }) {
  return (
    <ul className="flex flex-col gap-1">
      {group.items.map((item) => (
        <NavItem key={item.to} item={item} groupId={group.id} {...props} />
      ))}
    </ul>
  )
}

/** Grupo com cabeçalho-botão (aria-expanded) e conteúdo que abre e fecha com animação de altura. */
function DisclosureGroup({ group, open, onToggle, ...props }) {
  const panelId = useId()
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex min-h-9 w-full items-center justify-between gap-2 rounded-xl px-3 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {group.label}
        <ChevronDown aria-hidden="true" className={cn('h-4 w-4 transition-transform duration-150 motion-reduce:transition-none', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="painel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.state, ease: EASING.standard }}
            className="overflow-hidden"
          >
            <div className="pt-1">
              <ItemList group={group} {...props} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

/**
 * Navegação principal em grupos, a mesma na barra lateral e no drawer do toque.
 * - `rail`: só ícones (nome no DOM como sr-only e em tooltip), grupos separados por filete.
 * - `tree`: grupos recolhíveis (um aberto por vez, controlado por quem usa).
 * - `static`: todos os grupos abertos, com títulos (drawer).
 * O NavLink define aria-current="page" no item ativo.
 * @param {{ id?: string, mode?: 'rail'|'tree'|'static', openGroup?: string|null, onOpenGroupChange?: (id: string|null) => void, onNavigate?: () => void, className?: string, listRef?: import('react').Ref<HTMLUListElement> }} props
 */
export default function MainNav({ id, mode = 'static', openGroup = null, onOpenGroupChange, onNavigate, className, listRef }) {
  const { isAdmin } = useAuth()
  const groups = getNavGroups(isAdmin)
  const indicatorId = `${useId()}-ativo`
  const rail = mode === 'rail'
  const itemProps = { rail, indicatorId, onNavigate }

  return (
    <nav id={id} aria-label="Navegação principal" className={cn('max-w-full', className)}>
      <ul ref={listRef} className="flex w-full flex-col gap-1">
        {groups.map((group, index) => {
          if (mode === 'tree') {
            const open = openGroup === group.id
            // Foco em um link garante que o grupo dele esteja aberto, para o foco nunca sumir ao expandir.
            return (
              <DisclosureGroup
                key={group.id}
                group={group}
                open={open}
                onToggle={() => onOpenGroupChange?.(open ? null : group.id)}
                onFocusItem={(groupId) => groupId !== openGroup && onOpenGroupChange?.(groupId)}
                {...itemProps}
              />
            )
          }
          return (
            <li key={group.id} className={cn(rail && index > 0 && 'mt-1 border-t border-slate-900/10 pt-2')}>
              {!rail && <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{group.label}</p>}
              <ItemList group={group} {...itemProps} onFocusItem={rail ? (groupId) => groupId !== openGroup && onOpenGroupChange?.(groupId) : undefined} />
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
