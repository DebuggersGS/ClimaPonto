import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { MapPin, Star } from 'lucide-react'
import { useFavoriteStops } from '../../hooks/useFavoriteStops.js'
import { useStops } from '../../hooks/useStops.js'

const LAST_STOP_KEY = 'climaponto:ultimo-ponto'
const MAX_CODE_LENGTH = 60
const MAX_FAVORITES_SHOWN = 5

function readLastStop() {
  try {
    const value = window.localStorage.getItem(LAST_STOP_KEY)
    return value && value.length <= MAX_CODE_LENGTH ? value : null
  } catch {
    return null
  }
}

/** Código do ponto na URL atual: /pontos/:codigo ou ?ponto=:codigo. */
function codeFromLocation({ pathname, search }) {
  const fromPath = /^\/pontos\/([^/]+)/.exec(pathname)?.[1]
  const raw = fromPath ?? new URLSearchParams(search).get('ponto')
  if (!raw) return null
  try {
    const code = decodeURIComponent(raw)
    return code.length <= MAX_CODE_LENGTH ? code : null
  } catch {
    return null
  }
}

/** Último ponto aberto neste navegador (só o código, em localStorage). Lido a cada render: o valor vive fora do React. */
function useLastStop() {
  const location = useLocation()
  const urlCode = codeFromLocation(location)

  useEffect(() => {
    if (!urlCode) return
    try {
      window.localStorage.setItem(LAST_STOP_KEY, urlCode)
    } catch {
      // Sem persistência: o atalho vale só nesta visita.
    }
  }, [urlCode])

  return urlCode ?? readLastStop()
}

function QuickLink({ to, icon: Icon, children }) {
  return (
    <li>
      <Link
        to={to}
        className="flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span className="min-w-0 break-words">{children}</span>
      </Link>
    </li>
  )
}

/** Montado só quando há atalho real, para buscar os nomes dos pontos apenas se for preciso. */
function QuickLinksList({ favorites, lastCode }) {
  const { stops } = useStops()
  const nameOf = (code) => stops.find((stop) => stop.code === code)?.name ?? code
  const shownFavorites = favorites.slice(0, MAX_FAVORITES_SHOWN)
  const showLast = lastCode && !shownFavorites.includes(lastCode)

  return (
    <section aria-label="Acessos rápidos">
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Acessos rápidos</p>
      <ul className="flex flex-col gap-1">
        {showLast && (
          <QuickLink to={`/pontos/${encodeURIComponent(lastCode)}`} icon={MapPin}>
            <span className="block text-xs text-slate-600">Último ponto</span>
            {nameOf(lastCode)}
          </QuickLink>
        )}
        {shownFavorites.map((code) => (
          <QuickLink key={code} to={`/pontos/${encodeURIComponent(code)}`} icon={Star}>
            <span className="block text-xs text-slate-600">Favorito</span>
            {nameOf(code)}
          </QuickLink>
        ))}
      </ul>
    </section>
  )
}

/** Favoritos e último ponto consultado; some por completo se não houver dado local real. */
export default function SidebarQuickLinks() {
  const { favorites } = useFavoriteStops()
  const lastCode = useLastStop()
  if (favorites.length === 0 && !lastCode) return null
  return <QuickLinksList favorites={favorites} lastCode={lastCode} />
}
