import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import DemoNotice from '../ui/DemoNotice.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import { useSidebarCollapsed } from '../../hooks/useSidebarCollapsed.js'
import { useIsWideScreen } from '../../hooks/useIsWideScreen.js'
import Header from './Header.jsx'
import RouteErrorBoundary from './RouteErrorBoundary.jsx'
import Sidebar from './Sidebar.jsx'

/**
 * Estrutura do app. Camadas (z-index), de baixo para cima:
 * conteúdo (0–10, inclusive controles do mapa) → cabeçalho (30) → barra lateral (40, pode expandir por
 * cima do cabeçalho) → tooltips, popovers, drawer e diálogos (50, em portal) → link "pular" (60).
 * No desktop a barra é um espaçador no fluxo + painel fixo; a coluna de conteúdo tem min-w-0 para nunca
 * gerar rolagem horizontal.
 */
export default function AppLayout() {
  const online = useOnlineStatus()
  const sidebar = useSidebarCollapsed()
  const wide = useIsWideScreen()
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen w-full">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-on-ink focus:shadow-elevated"
      >
        Pular para o conteúdo
      </a>

      {wide && <Sidebar pinned={sidebar.pinned} onTogglePinned={sidebar.togglePinned} />}

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

        <main id="conteudo" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8">
          <DemoNotice />
          {/* Suspense aqui (e não acima do layout): trocar de página não desmonta barra nem cabeçalho. */}
          <RouteErrorBoundary key={pathname}>
            <Suspense fallback={<Skeleton label="Carregando página…" />}>
              <Outlet />
            </Suspense>
          </RouteErrorBoundary>
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
