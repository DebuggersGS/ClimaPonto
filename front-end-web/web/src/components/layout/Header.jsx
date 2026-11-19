import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronDown, Menu, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useDataMode } from '../../hooks/useDataMode.js'
import { useDataScenario } from '../../hooks/useDataScenario.js'
import { useHeadroom } from '../../hooks/useHeadroom.js'
import { getDataModeTone } from '../../utils/statusTones.js'
import { cn } from '../../utils/cn.js'
import { DATA_SCENARIO_INFO } from '../../utils/dataScenario.js'
import Button from '../ui/Button.jsx'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '../ui/Popover.jsx'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../ui/Sheet.jsx'
import StatusIcon from '../ui/StatusIcon.jsx'
import { getToneClasses } from '../ui/tones.js'
import DataScenarioSelector from '../data/DataScenarioSelector.jsx'
import CommandPalette from '../palette/CommandPalette.jsx'
import { useCommandPalette } from '../../hooks/useCommandPalette.js'
import { useIsWideScreen } from '../../hooks/useIsWideScreen.js'
import Logo from './Logo.jsx'
import MainNav from './MainNav.jsx'

function UserMenu() {
  const { status, user, signOut } = useAuth()
  const navigate = useNavigate()

  if (status !== 'authenticated') return null

  async function handleSignOut() {
    // Sai da área protegida ANTES de encerrar a sessão; caso contrário a rota
    // protegida reage ao fim da sessão e redireciona para o login.
    navigate('/', { replace: true })
    await signOut()
  }

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <span className="hidden max-w-48 truncate text-slate-600 md:inline" title={user?.email}>
        {user?.email}
      </span>
      <Button variant="secondary" size="sm" onClick={handleSignOut}>
        Sair
      </Button>
    </div>
  )
}

/**
 * Indicador ÚNICO da natureza dos dados (antes eram dois selos repetidos no cabeçalho, mais um na barra
 * lateral). Texto + ícone sempre visíveis; ao abrir, explica o modo, permite trocar o conjunto (quando
 * há escolha real) e leva a "Fontes e metodologia".
 */
function DataIndicator() {
  const { mode, label, description } = useDataMode()
  const { isDemonstrative } = useDataScenario()
  const tone = isDemonstrative ? { tone: 'demo', icon: 'Sparkles' } : getDataModeTone(mode)
  const shown = isDemonstrative ? DATA_SCENARIO_INFO.demonstrativo.badgeLabel : label
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs sm:px-3 font-medium ring-1 ring-inset transition-shadow hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          getToneClasses(tone.tone).soft,
        )}
      >
        <StatusIcon name={tone.icon} className="h-3.5 w-3.5 shrink-0" />
        <span className="sr-only">Modo de dados: {label}. </span>
        {shown}
        <ChevronDown aria-hidden="true" className={cn('hidden h-3.5 w-3.5 transition-transform duration-150 sm:block', open && 'rotate-180')} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <PopoverTitle className="text-base font-semibold text-slate-900">Sobre os dados</PopoverTitle>
        <p className="text-sm text-slate-700">
          <strong className="font-semibold text-slate-900">{label}.</strong> {description}
        </p>
        {isDemonstrative && mode !== 'mock' && <p className="text-sm text-slate-700">{DATA_SCENARIO_INFO.demonstrativo.description}</p>}
        <DataScenarioSelector />
        <Link
          to="/relatorios"
          onClick={() => setOpen(false)}
          className="inline-flex min-h-10 items-center text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-brand-200"
        >
          Fontes e metodologia
        </Link>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Menu do toque (abaixo de xl): botão "Menu" que abre a navegação em um drawer (Sheet).
 * Foco preso, Esc e botão "Fechar" fecham; escolher uma seção fecha o drawer e devolve o foco ao botão.
 */
function MobileMenu({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger render={<Button variant="secondary" size="sm" aria-controls="menu-movel" className="px-3" />}>
        <Menu aria-hidden="true" className="h-4 w-4" />
        <span className="max-sm:sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent side="left" id="menu-movel" aria-label="Menu principal" className="w-[min(20rem,88vw)]">
        <SheetTitle className="pr-12">Menu</SheetTitle>
        <MainNav onNavigate={() => onOpenChange(false)} />
        <div className="mt-auto flex flex-col gap-2 border-t border-slate-900/10 pt-3">
          <DataScenarioSelector />
          <Link
            to="/relatorios"
            onClick={() => onOpenChange(false)}
            className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-slate-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Fontes e metodologia
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Cabeçalho fino (64 px) e inteligente: some ao rolar para baixo, volta ao rolar para cima e fica fixo
 * perto do topo, com foco dentro dele ou com algum menu aberto. Ocultar é só transform (sem salto de
 * layout); com movimento reduzido a troca é instantânea (regra global do CSS).
 */
export default function Header() {
  const palette = useCommandPalette()
  const wide = useIsWideScreen()
  const [menuOpen, setMenuOpen] = useState(false)
  const [focusInside, setFocusInside] = useState(false)
  const hidden = useHeadroom({ pinned: focusInside || menuOpen || palette.isOpen })

  return (
    <header
      data-header={hidden ? 'hidden' : 'visible'}
      onFocus={() => setFocusInside(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusInside(false)
      }}
      className={cn(
        'surface-glass sticky top-0 z-30 rounded-none border-x-0 border-t-0 transition-transform duration-300 ease-out-soft will-change-transform',
        hidden && '-translate-y-full',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 xl:justify-end">
        {!wide && (
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
            <Logo />
          </div>
        )}
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          {wide && (
            <button
              type="button"
              onClick={palette.open}
              aria-haspopup="dialog"
              className="group flex h-10 w-64 items-center gap-2 rounded-full bg-surface px-4 text-sm text-slate-600 shadow-xs ring-1 ring-slate-300 transition-shadow hover:shadow-card hover:ring-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Busca rápida</span>
              <kbd aria-hidden="true" className="rounded-md bg-slate-900/5 px-1.5 py-0.5 font-sans text-[0.6875rem] font-medium text-slate-600 ring-1 ring-slate-900/10">
                Ctrl K
              </kbd>
              <span className="sr-only"> (Ctrl+K)</span>
            </button>
          )}
          {!wide && (
            <Button variant="secondary" size="icon" onClick={palette.open} aria-haspopup="dialog" aria-label="Busca rápida">
              <Search aria-hidden="true" className="h-4 w-4" />
            </Button>
          )}
          <DataIndicator />
          <UserMenu />
        </div>
      </div>
      <CommandPalette open={palette.isOpen} onClose={palette.close} returnFocusRef={palette.returnFocusRef} />
    </header>
  )
}
