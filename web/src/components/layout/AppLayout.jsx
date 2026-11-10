import { Link, Outlet } from 'react-router'
import DemoNotice from '../ui/DemoNotice.jsx'
import Header from './Header.jsx'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Pular para o conteúdo
      </a>

      <Header />

      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <DemoNotice />
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-sm text-slate-500 sm:flex-row sm:justify-between sm:px-6">
          <p>ClimaPonto · Global Solution FIAP 2026.2 · Protótipo acadêmico</p>
          <Link to="/admin/login" className="rounded underline hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-brand-600">
            Área administrativa
          </Link>
        </div>
      </footer>
    </div>
  )
}
