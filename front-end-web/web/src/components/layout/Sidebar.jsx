import { useEffect, useRef, useState } from 'react'
import { Pin, PinOff } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { DURATION_MS } from '../../utils/motionTokens.js'
import Tooltip from '../ui/Tooltip.jsx'
import Logo from './Logo.jsx'
import MainNav from './MainNav.jsx'
import SidebarQuickLinks from './SidebarQuickLinks.jsx'

/** Atrasos de intenção: evitam abrir ao passar de raspão e fechar ao sair por um instante (zona de saída). */
const ENTER_DELAY_MS = 200
const LEAVE_DELAY_MS = DURATION_MS.state + 100

/** Larguras: trilho compacto (48 px de coluna de ícones + 12 px de respiro por lado) e painel expandido. */
export const SIDEBAR_RAIL_CLASS = 'w-[4.5rem]'
export const SIDEBAR_PINNED_CLASS = 'w-64'

/**
 * Barra lateral do desktop (a partir de 1280 px).
 * - Compacta por padrão: só ícones, centralizados numa coluna fixa, com nome em tooltip.
 * - Ao passar o mouse (com atraso de intenção) expande POR CIMA do conteúdo, acima do cabeçalho
 *   (z-index da barra > cabeçalho), sem repaginar a página; ao sair, recolhe.
 * - O pin fixa a barra expandida e aí ela ocupa espaço no fluxo (o conteúdo se ajusta, nada é coberto).
 * - Teclado usa o trilho com tooltips (o foco nunca some por troca de estrutura) e Esc recolhe.
 * - Toque não tem hover: usa o trilho e o pin.
 * A estrutura do DOM é a mesma nos dois estados; só larguras e opacidades mudam (sem tremulação).
 * @param {{ pinned: boolean, onTogglePinned: () => void }} props
 */
export default function Sidebar({ pinned, onTogglePinned }) {
  const [hovering, setHovering] = useState(false)
  const timer = useRef(null)
  const pendingOpen = useRef(false)
  // Depois de escolher uma página, o painel por hover fecha e só reabre quando o ponteiro sair e voltar.
  const suppressed = useRef(false)
  const asideRef = useRef(null)
  const expanded = pinned || hovering
  const overlay = hovering && !pinned

  useEffect(() => () => clearTimeout(timer.current), [])

  function schedule(next, delay) {
    clearTimeout(timer.current)
    if (!next) pendingOpen.current = false
    timer.current = setTimeout(() => {
      timer.current = null
      pendingOpen.current = false
      // Quem navega por teclado não é surpreendido por expansão.
      if (next && asideRef.current?.querySelector(':focus-visible')) return
      setHovering(next)
    }, delay)
  }

  function collapseAfterNavigation() {
    if (pinned) return
    clearTimeout(timer.current)
    timer.current = null
    pendingOpen.current = false
    suppressed.current = true
    setHovering(false)
  }

  function handleKeyDown(event) {
    if (event.key !== 'Escape' || !hovering) return
    clearTimeout(timer.current)
    if (asideRef.current?.contains(document.activeElement)) asideRef.current.focus({ preventScroll: true })
    setHovering(false)
  }

  const PinIcon = pinned ? PinOff : Pin

  return (
    // O espaçador reserva a largura no fluxo; o painel (fixed) pode crescer por cima do conteúdo.
    <div
      className={cn(
        'relative shrink-0 transition-[width] duration-200 ease-out-soft motion-reduce:duration-0!',
        pinned ? SIDEBAR_PINNED_CLASS : SIDEBAR_RAIL_CLASS,
      )}
    >
      <div
        ref={asideRef}
        tabIndex={-1}
        data-sidebar={expanded ? 'expanded' : 'compact'}
        data-sidebar-mode={pinned ? 'pinned' : overlay ? 'overlay' : 'rail'}
        // Só movimento do mouse DENTRO da barra expande (pointermove, não pointerenter): o Chrome dispara
        // pointerenter sozinho quando o layout muda sob um cursor parado (ex.: cursor esquecido na borda
        // esquerda), e isso não pode abrir o painel por cima do conteúdo.
        onPointerMove={(event) => {
          if (event.pointerType !== 'mouse' || suppressed.current) return
          if (hovering) {
            // Voltou antes de recolher: cancela o fechamento agendado (zona de saída tolerante).
            if (timer.current && !pendingOpen.current) {
              clearTimeout(timer.current)
              timer.current = null
            }
            return
          }
          if (!pendingOpen.current) {
            pendingOpen.current = true
            schedule(true, ENTER_DELAY_MS)
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== 'mouse') return
          suppressed.current = false
          schedule(false, LEAVE_DELAY_MS)
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col overflow-x-hidden overflow-y-auto border-r border-slate-900/10 bg-surface px-3 pb-3 outline-none',
          'transition-[width,box-shadow] duration-200 ease-out-soft motion-reduce:duration-0! [scrollbar-width:thin]',
          expanded ? SIDEBAR_PINNED_CLASS : SIDEBAR_RAIL_CLASS,
          overlay && 'shadow-elevated',
        )}
      >
        {/* Mesma altura do cabeçalho (64 px): logo e cabeçalho ficam alinhados. */}
        <div className="flex h-16 shrink-0 items-center">
          <Logo rail expanded={expanded} />
        </div>
        <MainNav id="navegacao-principal" compact={!expanded} className="mt-2" onNavigate={collapseAfterNavigation} />
        {expanded && (
          <div className="mt-4 min-w-0">
            <SidebarQuickLinks />
          </div>
        )}
        <div className="mt-auto pt-3">
          <div className="border-t border-slate-900/10 pt-3">
            {/* Sempre dentro do Tooltip: a estrutura estável preserva o foco ao fixar pelo teclado. */}
            <Tooltip content={pinned ? 'Soltar menu lateral' : 'Fixar menu lateral'} side="right" disabled={expanded}>
              <button
                type="button"
                aria-pressed={pinned}
                onClick={onTogglePinned}
                className="relative flex min-h-11 w-full items-center overflow-hidden rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <span className="flex h-11 w-12 shrink-0 items-center justify-center">
                  <PinIcon aria-hidden="true" className="h-5 w-5" />
                </span>
                {/* Texto visível = nome acessível (WCAG 2.5.3); o estado vem de aria-pressed e do ícone. */}
                <span className={cn('truncate pr-3 transition-opacity duration-150', expanded ? 'opacity-100 delay-75' : 'opacity-0')}>
                  Fixar menu lateral
                </span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}
