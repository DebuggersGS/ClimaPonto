import { Link, Outlet } from 'react-router'
import DemoNotice from '../ui/DemoNotice.jsx'
import Header from './Header.jsx'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-white focus:shadow-elevated"
      >
        Pular para o conteúdo
      </a>

      <Header />

      <main id="conteudo" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <DemoNotice />
        <Outlet />
      </main>

      <footer className="border-t border-slate-900/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-slate-600 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>ClimaPonto · Global Solution FIAP 2026.2 · Protótipo acadêmico</p>
          <Link
            to="/admin/login"
            className="inline-flex min-h-6 rounded underline underline-offset-2 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            Área administrativa
          </Link>
        </div>
      </footer>
    </div>
  )
}
