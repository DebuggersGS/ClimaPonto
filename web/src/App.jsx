import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import RequireAdmin from './components/auth/RequireAdmin.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import StopsPage from './pages/StopsPage.jsx'

// A área administrativa é carregada sob demanda: visitantes não baixam esse código.
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage.jsx'))
const AdminStopsPage = lazy(() => import('./pages/AdminStopsPage.jsx'))

function PageLoading() {
  return (
    <p role="status" className="text-slate-600">
      Carregando…
    </p>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pontos" element={<StopsPage />} />
          <Route path="historico" element={<HistoryPage />} />

          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route path="admin" element={<RequireAdmin />}>
            <Route index element={<Navigate to="pontos" replace />} />
            <Route path="pontos" element={<AdminStopsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
