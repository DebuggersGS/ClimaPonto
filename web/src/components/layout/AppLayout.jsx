import { Outlet } from 'react-router'
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
        <p className="mx-auto max-w-6xl px-4 py-4 text-sm text-slate-500 sm:px-6">
          ClimaPonto · Global Solution FIAP 2026.2 · Protótipo acadêmico
        </p>
      </footer>
    </div>
  )
}
