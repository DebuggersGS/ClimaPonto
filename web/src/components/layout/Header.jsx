import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Menu, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useDataMode } from '../../hooks/useDataMode.js'
import { getDataModeTone } from '../../utils/statusTones.js'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../ui/Sheet.jsx'
import DataScenarioSelector from '../data/DataScenarioSelector.jsx'
import DemonstrativeBadge from '../data/DemonstrativeBadge.jsx'
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
      <span className="max-w-32 truncate sm:max-w-48 text-slate-600" title={user?.email}>
        {user?.email}
      </span>
      <Button variant="secondary" size="sm" onClick={handleSignOut}>
        Sair
      </Button>
    </div>
  )
}

/** Indicador persistente do modo de dados (sempre texto + ícone). */
function DataModeIndicator() {
  const { mode, label } = useDataMode()
  const tone = getDataModeTone(mode)
  return (
    <Badge tone={tone.tone} icon={tone.icon} size="sm">
      <span className="sr-only">Modo de dados: </span>
      {label}
    </Badge>
  )
}

/**
 * Menu do toque (abaixo de xl): botão explícito "Menu" que abre a navegação em um drawer (Sheet).
 * Foco preso, Esc e botão "Fechar" fecham; escolher uma seção fecha o drawer e devolve o foco ao botão.
 */
function MobileMenu() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="secondary" size="sm" aria-controls="menu-movel" />}>
        <Menu aria-hidden="true" className="h-4 w-4" />
        Menu
      </SheetTrigger>
      <SheetContent side="left" id="menu-movel" aria-label="Menu principal">
        <SheetTitle>Menu</SheetTitle>
        <MainNav onNavigate={() => setOpen(false)} />
        <div className="mt-auto flex flex-col gap-2 border-t border-slate-900/10 pt-3">
          <DataScenarioSelector />
          <Link to="/relatorios" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-2xl px-3 text-sm font-medium text-slate-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
            Fontes e metodologia
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function Header() {
  const palette = useCommandPalette()
  const wide = useIsWideScreen()
  return (
    <header className="surface-glass sticky top-0 z-40 rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 xl:justify-end xl:px-8">
        {!wide && (
          <div className="flex items-center gap-3">
            <MobileMenu />
            <Logo />
          </div>
        )}
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={palette.open} aria-haspopup="dialog">
            <Search aria-hidden="true" className="h-4 w-4" />
            Busca rápida
            <span className="sr-only"> (Ctrl+K)</span>
          </Button>
          <DemonstrativeBadge />
          <DataModeIndicator />
          <UserMenu />
        </div>
      </div>
      <CommandPalette open={palette.isOpen} onClose={palette.close} />
    </header>
  )
}
