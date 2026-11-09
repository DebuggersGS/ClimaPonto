import { Link } from 'react-router'
import MainNav from './MainNav.jsx'

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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

        <MainNav />
      </div>
    </header>
  )
}
