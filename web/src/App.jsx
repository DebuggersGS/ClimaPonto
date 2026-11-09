import { Route, Routes } from 'react-router'
import AppLayout from './components/layout/AppLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import StopsPage from './pages/StopsPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="pontos" element={<StopsPage />} />
        <Route path="historico" element={<HistoryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
