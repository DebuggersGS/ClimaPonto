import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Menu, Search, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useDataMode } from '../../hooks/useDataMode.js'
import { getDataModeTone } from '../../utils/statusTones.js'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import CommandPalette from '../palette/CommandPalette.jsx'
import { useCommandPalette } from '../../hooks/useCommandPalette.js'
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
 * Menu móvel (abaixo de xl): botão com aria-expanded que abre a mesma navegação principal.
 * Ao abrir, o foco vai ao primeiro item; Esc fecha e devolve o foco ao botão; escolher um item fecha o menu.
 */
function MobileMenu() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    listRef.current?.querySelector('a')?.focus()
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const Icon = open ? X : Menu
  return (
    <div className="xl:hidden">
      <Button
        ref={buttonRef}
        variant="secondary"
        size="sm"
        aria-expanded={open}
        aria-controls="menu-movel"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon aria-hidden="true" className="h-4 w-4" />
        Menu
      </Button>
      <div id="menu-movel" hidden={!open} className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto px-4 pb-3 pt-2 sm:px-6">
        {open && <MainNav listRef={listRef} onNavigate={() => setOpen(false)} className="mx-auto max-w-sm sm:mx-0" />}
      </div>
    </div>
  )
}

export default function Header() {
  const palette = useCommandPalette()
  return (
    <header className="surface-glass sticky top-0 z-40 rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 xl:justify-end xl:px-8">
        <div className="flex items-center gap-3 xl:hidden">
          <MobileMenu />
          <Logo />
        </div>
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
