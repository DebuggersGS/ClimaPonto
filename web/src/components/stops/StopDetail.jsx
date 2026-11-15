import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { formatDateTimeWithZone, formatHumidity, formatTemperature } from '../../utils/formatters.js'
import Badge from '../ui/Badge.jsx'
import ConnectivityBadge from '../ui/ConnectivityBadge.jsx'
import EnvironmentalStatusBadge from '../ui/EnvironmentalStatusBadge.jsx'
import ReadingSourceBadge from '../ui/ReadingSourceBadge.jsx'
import StopHistoryLink from '../ui/StopHistoryLink.jsx'
import FavoriteButton from './FavoriteButton.jsx'

const TITLE_ID = 'ficha-ponto-titulo'

const formatCoordinate = (value) => value.toLocaleString('pt-BR', { maximumFractionDigits: 6 })

function Row({ label, children }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="font-medium text-slate-700">{label}</dt>
      <dd className="min-w-0 break-words text-slate-900">{children}</dd>
    </div>
  )
}

function ReadingRows({ reading }) {
  if (!reading) {
    return (
      <Row label="Última leitura">
        <strong>Sem dados</strong>: este ponto ainda não enviou leituras.
      </Row>
    )
  }
  return (
    <>
      <Row label="Última leitura">
        {formatTemperature(reading.temperatureC)} · {formatHumidity(reading.humidityPct)}
        <span className="block text-slate-600">{formatDateTimeWithZone(reading.measuredAt)}</span>
      </Row>
      <Row label="Estado ambiental">
        <EnvironmentalStatusBadge status={reading.environmentalStatus} />
      </Row>
      <Row label="Origem">
        <ReadingSourceBadge source={reading.source} />
      </Row>
      <Row label="Regra de conectividade">
        <span className="text-slate-600">Provisória: baseada na idade da última leitura e num intervalo de envio de exemplo.</span>
      </Row>
    </>
  )
}

/**
 * Restaura o foco ao controle de origem quando a ficha é fechada (desmontada).
 */
function useRestoreFocus() {
  useEffect(() => {
    const origin = document.activeElement
    return () => {
      if (origin instanceof HTMLElement && origin !== document.body && origin.isConnected) origin.focus()
    }
  }, [])
}

/**
 * Conteúdo da ficha do ponto (usado no painel lateral e no bottom sheet).
 * @param {{ item: object, favorite: boolean, onToggleFavorite: () => void, onClose: () => void }} props
 */
function StopDetailContent({ item, favorite, onToggleFavorite, onClose }) {
  const { stop, reading, connectivity } = item
  const hasCoordinates = Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)
  return (
    <div className="p-5 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={TITLE_ID} className="text-lg font-semibold break-words text-slate-900">
            {stop.name}
          </h2>
          <span className="mt-1 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{stop.code}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <X aria-hidden="true" className="h-4 w-4" />
          Fechar
        </button>
      </div>
      {stop.isDemo && (
        <Badge tone="demo" icon="Sparkles" size="sm" className="mt-3">
          Demonstrativo
        </Badge>
      )}
      <dl className="mt-4 space-y-3">
        <Row label="Bairro">{stop.neighborhood}</Row>
        <Row label="Coordenadas cadastradas">
          {hasCoordinates ? `${formatCoordinate(stop.latitude)}, ${formatCoordinate(stop.longitude)}` : 'Não cadastradas'}
        </Row>
        <Row label="Conectividade">
          <ConnectivityBadge status={connectivity.status} />
        </Row>
        <ReadingRows reading={reading} />
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <FavoriteButton name={stop.name} pressed={favorite} onToggle={onToggleFavorite} />
        <StopHistoryLink code={stop.code} />
      </div>
    </div>
  )
}

/** Painel lateral (≥ 1024 px), ao lado do mapa/lista. */
export function StopPanel(props) {
  useRestoreFocus()
  return (
    <aside aria-labelledby={TITLE_ID} className="stop-panel-enter rounded-card bg-surface shadow-card ring-1 ring-slate-900/5 lg:sticky lg:top-24 lg:self-start">
      <StopDetailContent {...props} />
    </aside>
  )
}

/** Bottom sheet modal (< 1024 px) com <dialog> nativo: Esc e botão Fechar. */
export function StopSheet(props) {
  const dialogRef = useRef(null)
  useRestoreFocus()
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={TITLE_ID}
      onClose={props.onClose}
      onClick={(event) => event.target === dialogRef.current && props.onClose()}
      className="stop-sheet-enter mx-0 mb-0 mt-auto max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-card bg-surface p-0 text-slate-900 shadow-elevated backdrop:bg-ink/60"
    >
      <StopDetailContent {...props} />
    </dialog>
  )
}
