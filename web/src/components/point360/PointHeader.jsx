import { ArrowLeft, Link2, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { resolveMapOrigin } from '../../utils/geoMap.js'
import { partitionStopsByCoordinates } from '../../utils/stopMap.js'
import DemonstrativeBadge from '../data/DemonstrativeBadge.jsx'
import FavoriteButton from '../stops/FavoriteButton.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'

const formatCoordinate = (value) => value.toLocaleString('pt-BR', { maximumFractionDigits: 6 })

/** Texto de posição: coordenadas reais cadastradas ou a ausência delas (nunca estimadas). */
function describeLocation(stop) {
  if (partitionStopsByCoordinates([stop]).located.length === 0) return null
  const origin = resolveMapOrigin(stop, null) === 'demonstrativo' ? 'posição fictícia (dados demonstrativos)' : 'cadastro do ponto'
  return { text: `${formatCoordinate(stop.latitude)}, ${formatCoordinate(stop.longitude)}`, origin }
}

/**
 * Cabeçalho do Ponto 360°: identificação, localização, favoritar, copiar link e voltar ao mapa.
 * @param {{ stop: object, isFavorite: boolean, onToggleFavorite: () => void }} props
 */
export default function PointHeader({ stop, isFavorite, onToggleFavorite }) {
  const [copyStatus, setCopyStatus] = useState('')
  const location = describeLocation(stop)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyStatus('Link copiado.')
    } catch {
      setCopyStatus('Não foi possível copiar automaticamente; copie o endereço da barra do navegador.')
    }
  }

  return (
    <header className="mb-6">
      {/* Destino fixo: o mapa com este ponto selecionado; funciona também em acesso direto (sem histórico). */}
      <Link
        to={`/pontos?ponto=${encodeURIComponent(stop.code)}`}
        className="mb-3 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-200"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Voltar ao mapa
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-200">Ponto 360°</p>
          <h1 className="break-words text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{stop.name}</h1>
          <p className="mt-2 text-base text-slate-700">
            Código <span className="font-medium">{stop.code}</span> · {stop.neighborhood}
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-700">
            <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {location ? (
              <span className="min-w-0 break-words">
                Coordenadas <span className="tabular-nums">{location.text}</span> · origem: {location.origin}
              </span>
            ) : (
              <span>Localização não cadastrada</span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DemonstrativeBadge />
            {stop.isDemo && (
              <Badge tone="demo" icon="Sparkles" size="sm">
                Ponto demonstrativo
              </Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <FavoriteButton name={stop.name} pressed={isFavorite} onToggle={onToggleFavorite} />
          <Button variant="secondary" onClick={copyLink}>
            <Link2 aria-hidden="true" className="h-4 w-4" />
            Copiar link
          </Button>
        </div>
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm text-slate-700">
        {copyStatus}
      </p>
    </header>
  )
}
