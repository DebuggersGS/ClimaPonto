import { Link, Outlet } from 'react-router'
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import DemoNotice from '../ui/DemoNotice.jsx'
import { useSidebarCollapsed } from '../../hooks/useSidebarCollapsed.js'
import { useIsWideScreen } from '../../hooks/useIsWideScreen.js'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

export default function AppLayout() {
  const online = useOnlineStatus()
  const sidebar = useSidebarCollapsed()
  const wide = useIsWideScreen()
  return (
    <div className="min-h-screen xl:flex">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-on-ink focus:shadow-elevated"
      >
        Pular para o conteúdo
      </a>

      {wide && <Sidebar collapsed={sidebar.collapsed} onToggle={sidebar.toggle} />}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header />

        <div role="status" className={online ? undefined : 'border-b border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-950 dark:text-amber-200'}>
          {!online && (
            <p className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-sm font-medium sm:px-6 lg:px-8">
              <WifiOff aria-hidden="true" className="h-4 w-4 shrink-0" />
              Sem conexão: os dados podem estar desatualizados
            </p>
          )}
        </div>

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
    </div>
  )
}
