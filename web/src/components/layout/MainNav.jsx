import { NavLink } from 'react-router'
import { useAuth } from '../../hooks/useAuth.js'

const PUBLIC_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/pontos', label: 'Pontos' },
  { to: '/historico', label: 'Histórico' },
]

const ADMIN_ITEM = { to: '/admin/pontos', label: 'Gerenciar' }

function linkClassName({ isActive }) {
  const base =
    'inline-flex min-h-10 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-600'
  return isActive
    ? `${base} bg-brand-50 text-brand-700`
    : `${base} text-slate-600 hover:bg-slate-100 hover:text-slate-900`
}

export default function MainNav() {
  const { isAdmin } = useAuth()
  const items = isAdmin ? [...PUBLIC_ITEMS, ADMIN_ITEM] : PUBLIC_ITEMS

  return (
    <nav aria-label="Navegação principal">
      <ul className="flex flex-wrap gap-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} className={linkClassName}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
