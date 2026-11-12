import { lazy, Suspense } from 'react'
import { MotionConfig } from 'motion/react'
import { Navigate, Route, Routes } from 'react-router'
import RequireAdmin from './components/auth/RequireAdmin.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import Skeleton from './components/ui/Skeleton.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import StopsPage from './pages/StopsPage.jsx'

// A área administrativa é carregada sob demanda: visitantes não baixam esse código.
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage.jsx'))
const AdminStopsPage = lazy(() => import('./pages/AdminStopsPage.jsx'))

export default function App() {
  return (
    // reducedMotion="user": respeita a preferência do sistema em todas as animações do motion.
    <MotionConfig reducedMotion="user">
      <Suspense fallback={<Skeleton label="Carregando página…" className="mx-auto max-w-7xl p-6" />}>
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
    </MotionConfig>
  )
}
