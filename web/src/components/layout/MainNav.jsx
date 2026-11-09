import { NavLink } from 'react-router'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/pontos', label: 'Pontos' },
  { to: '/historico', label: 'Histórico' },
]

function linkClassName({ isActive }) {
  const base =
    'rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-600'
  return isActive
    ? `${base} bg-brand-50 text-brand-700`
    : `${base} text-slate-600 hover:bg-slate-100 hover:text-slate-900`
}

export default function MainNav() {
  return (
    <nav aria-label="Navegação principal">
      <ul className="flex flex-wrap gap-1">
        {NAV_ITEMS.map((item) => (
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
