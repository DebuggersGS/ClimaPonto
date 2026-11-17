import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Pin, PinOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { cn } from '../../utils/cn.js'
import { DURATION_MS } from '../../utils/motionTokens.js'
import DataScenarioSelector from '../data/DataScenarioSelector.jsx'
import DemonstrativeBadge from '../data/DemonstrativeBadge.jsx'
import Tooltip from '../ui/Tooltip.jsx'
import Logo from './Logo.jsx'
import MainNav from './MainNav.jsx'
import { findActiveGroupId, getNavGroups } from './navItems.js'
import SidebarQuickLinks from './SidebarQuickLinks.jsx'

/** Atrasos de intenção: evitam abrir ao passar de raspão e fechar ao sair por um instante (zona de saída). */
const ENTER_DELAY_MS = 200
const LEAVE_DELAY_MS = DURATION_MS.state + 100

/** Largura reservada no fluxo: o painel expandido se sobrepõe ao conteúdo, sem repaginá-lo. */
export const SIDEBAR_RAIL_CLASS = 'w-20'
export const SIDEBAR_PINNED_CLASS = 'w-64'

/**
 * Barra lateral do desktop (a partir de 1280 px). Compacta por padrão (símbolo da marca e tooltips);
 * ao passar o mouse expande em sobreposição, e o pin a fixa expandida (ocupando espaço no fluxo).
 * A expansão por hover só vale para mouse; teclado usa o rail com tooltips e o botão de fixar.
 * @param {{ pinned: boolean, onTogglePinned: () => void, openGroup: string|null, onOpenGroupChange: (id: string|null) => void }} props
 */
export default function Sidebar({ pinned, onTogglePinned, openGroup, onOpenGroupChange }) {
  const [hovering, setHovering] = useState(false)
  const timer = useRef(null)
  const asideRef = useRef(null)
  const { isAdmin } = useAuth()
  const { pathname } = useLocation()
  const activeGroupId = findActiveGroupId(getNavGroups(isAdmin), pathname)
  const expanded = pinned || hovering

  useEffect(() => () => clearTimeout(timer.current), [])
  // A rota atual sempre mostra o grupo dela aberto.
  useEffect(() => {
    if (activeGroupId) onOpenGroupChange(activeGroupId)
  }, [activeGroupId, onOpenGroupChange])

  function schedule(next, delay) {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      // Quem navega por teclado não perde o foco: a troca rail/árvore recria os itens.
      if (next && asideRef.current?.querySelector(':focus-visible')) return
      setHovering(next)
    }, delay)
  }

  function handlePointerEnter(event) {
    if (event.pointerType === 'mouse') schedule(true, ENTER_DELAY_MS)
  }

  function handleKeyDown(event) {
    if (event.key !== 'Escape' || !hovering) return
    clearTimeout(timer.current)
    // O foco passa ao próprio painel antes de recolher, para nunca se perder.
    if (asideRef.current?.contains(document.activeElement)) asideRef.current.focus({ preventScroll: true })
    setHovering(false)
  }

  const PinIcon = pinned ? PinOff : Pin
  const pinButton = (
    <button
      type="button"
      aria-label="Fixar menu lateral"
      aria-pressed={pinned}
      onClick={onTogglePinned}
      className={cn(
        'flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        !expanded && 'justify-center px-0',
      )}
    >
      <PinIcon aria-hidden="true" className="h-5 w-5 shrink-0" />
      {expanded && <span aria-hidden="true">{pinned ? 'Fixado' : 'Fixar menu'}</span>}
    </button>
  )

  return (
    // O espaçador mantém a largura no fluxo; o painel (fixed) cresce por cima do conteúdo.
    <div className={cn('relative shrink-0 transition-[width] duration-200 motion-reduce:transition-none', pinned ? SIDEBAR_PINNED_CLASS : SIDEBAR_RAIL_CLASS)}>
      <aside
        ref={asideRef}
        tabIndex={-1}
        data-sidebar={expanded ? 'expanded' : 'compact'}
        aria-label="Barra lateral"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={() => schedule(false, LEAVE_DELAY_MS)}
        onKeyDown={handleKeyDown}
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col gap-4 outline-none overflow-y-auto overflow-x-hidden border-r border-slate-900/10 bg-surface p-3 transition-[width,box-shadow] duration-200 motion-reduce:transition-none',
          expanded ? 'w-64' : 'w-20',
          hovering && !pinned && 'shadow-elevated',
        )}
      >
        <div className={cn('flex items-center py-1', expanded ? 'px-1' : 'justify-center')}>
          <Logo compact={!expanded} />
        </div>
        <MainNav
          id="navegacao-principal"
          mode={expanded ? 'tree' : 'rail'}
          openGroup={openGroup}
          onOpenGroupChange={onOpenGroupChange}
        />
        {expanded && <SidebarQuickLinks />}
        <div className="mt-auto flex flex-col gap-2 border-t border-slate-900/10 pt-3">
          {expanded && (
            <>
              <DemonstrativeBadge />
              <DataScenarioSelector />
              <Link
                to="/relatorios"
                className="flex min-h-11 items-center rounded-2xl px-3 text-sm font-medium text-slate-700 underline-offset-2 hover:bg-slate-900/5 hover:text-slate-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Fontes e metodologia
              </Link>
            </>
          )}
          {/* Sempre dentro do Tooltip: a estrutura estável preserva o foco ao fixar pelo teclado. */}
          <Tooltip content={pinned ? 'Soltar menu lateral' : 'Fixar menu lateral'} side="right">
            {pinButton}
          </Tooltip>
        </div>
      </aside>
    </div>
  )
}
