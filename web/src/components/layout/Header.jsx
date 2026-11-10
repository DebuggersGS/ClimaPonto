import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth.js'
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
    <div className="flex items-center gap-2 text-sm">
      <span className="max-w-48 truncate text-slate-600" title={user?.email}>
        {user?.email}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        Sair
      </button>
    </div>
  )
}

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between sm:px-6">
        <Link to="/" className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-brand-600">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white"
          >
            C
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-brand-900">ClimaPonto</span>
            <span className="text-xs text-slate-500">Condições ambientais em pontos de ônibus</span>
          </span>
        </Link>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:justify-end lg:gap-4">
          <MainNav />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
