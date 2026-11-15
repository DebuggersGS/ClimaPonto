import { Link, useNavigate } from 'react-router'
import { Bus, Search, ThermometerSun } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useDataMode } from '../../hooks/useDataMode.js'
import { getDataModeTone } from '../../utils/statusTones.js'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import CommandPalette from '../palette/CommandPalette.jsx'
import { useCommandPalette } from '../../hooks/useCommandPalette.js'
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

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-full pr-2 focus-visible:outline-2 focus-visible:outline-brand-600">
      <span
        aria-hidden="true"
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-brand-600 to-accent-500 text-white shadow-glow"
      >
        <Bus className="h-5 w-5" />
        <ThermometerSun className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-ink p-0.5 text-amber-300" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">ClimaPonto</span>
    </Link>
  )
}

export default function Header() {
  const palette = useCommandPalette()
  return (
    <header className="surface-glass sticky top-0 z-40 rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <Logo />
        <MainNav className="order-last w-full sm:order-none sm:w-auto" />
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={palette.open} aria-haspopup="dialog">
            <Search aria-hidden="true" className="h-4 w-4" />
            Busca rápida
            <span className="sr-only"> (Ctrl+K)</span>
          </Button>
          <DataModeIndicator />
          <UserMenu />
        </div>
      </div>
      <CommandPalette open={palette.isOpen} onClose={palette.close} />
    </header>
  )
}
