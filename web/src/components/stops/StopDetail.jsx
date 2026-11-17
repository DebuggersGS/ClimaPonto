import { ChevronsRight, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { formatDateTimeWithZone, formatHumidity, formatTemperature } from '../../utils/formatters.js'
import { partitionStopsByCoordinates } from '../../utils/stopMap.js'
import Badge from '../ui/Badge.jsx'
import ConnectivityBadge from '../ui/ConnectivityBadge.jsx'
import EnvironmentalStatusBadge from '../ui/EnvironmentalStatusBadge.jsx'
import ReadingSourceBadge from '../ui/ReadingSourceBadge.jsx'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '../ui/Sheet.jsx'
import StopHistoryLink from '../ui/StopHistoryLink.jsx'
import FavoriteButton from './FavoriteButton.jsx'

const TITLE_ID = 'ficha-ponto-titulo'

const formatCoordinate = (value) => value.toLocaleString('pt-BR', { maximumFractionDigits: 6 })

function Row({ label, children }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-3 lg:grid-cols-1 lg:gap-0.5">
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
      </Row>
      <Row label="Carimbo da leitura">{formatDateTimeWithZone(reading.measuredAt)}</Row>
      <Row label="Estado ambiental">
        <EnvironmentalStatusBadge status={reading.environmentalStatus} />
      </Row>
      <Row label="Origem">
        <ReadingSourceBadge source={reading.source} />
      </Row>
    </>
  )
}

/** Posição cadastrada, ou o motivo de o ponto estar sem localização; rotula posição fictícia. */
function PositionRow({ item, fictionalPosition }) {
  const { stop } = item
  const { located, missing, outside } = partitionStopsByCoordinates([item])
  if (located.length === 0) {
    return <Row label="Localização">Sem localização: {[...missing, ...outside][0]?.reason}</Row>
  }
  const isFictional = fictionalPosition || stop.isDemo === true
  return (
    <Row label="Coordenadas cadastradas">
      {formatCoordinate(stop.latitude)}, {formatCoordinate(stop.longitude)}
      {isFictional && <span className="block font-medium text-violet-800 dark:text-violet-200">Posição fictícia (dados demonstrativos)</span>}
    </Row>
  )
}

/** Ao fechar (desmontar), devolve o foco ao controle que estava ativo na abertura. */
function useRestoreFocus() {
  useEffect(() => {
    const origin = document.activeElement
    return () => {
      if (origin instanceof HTMLElement && origin !== document.body && origin.isConnected) origin.focus()
    }
  }, [])
}

/** Conteúdo da ficha (painel e sheet). O título é fornecido por quem monta. */
function DetailBody({ item, favorite, onToggleFavorite, fictionalPosition }) {
  const { stop, reading, connectivity } = item
  return (
    <div className="text-sm">
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{stop.code}</span>
        <ConnectivityBadge status={connectivity.status} />
        {stop.isDemo && (
          <Badge tone="demo" icon="Sparkles" size="sm">
            Demonstrativo
          </Badge>
        )}
      </div>
      <dl className="mt-4 space-y-3">
        <Row label="Bairro">{stop.neighborhood}</Row>
        <ReadingRows reading={reading} />
        <PositionRow item={item} fictionalPosition={fictionalPosition} />
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <FavoriteButton name={stop.name} pressed={favorite} onToggle={onToggleFavorite} />
        <StopHistoryLink code={stop.code} />
        <Link
          to={`/pontos/${encodeURIComponent(stop.id)}`}
          className="inline-flex min-h-10 items-center rounded-full bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Ver análise detalhada<span className="sr-only"> de {stop.name}</span>
        </Link>
      </div>
    </div>
  )
}

const headerButton =
  'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'

/**
 * Painel lateral (≥ 1024 px), recolhível. "Recolher" esconde o painel mantendo o
 * ponto selecionado; "Fechar" limpa a seleção. `focusHeading` move o foco ao título (ao reabrir).
 */
export function StopPanel({ onClose, onCollapse, focusHeading = false, ...detail }) {
  const headingRef = useRef(null)
  useRestoreFocus()
  useEffect(() => {
    if (focusHeading) headingRef.current?.focus()
  }, [focusHeading])
  return (
    <aside aria-labelledby={TITLE_ID} className="stop-panel-enter rounded-card bg-surface p-5 shadow-card ring-1 ring-slate-900/5 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <h2 id={TITLE_ID} ref={headingRef} tabIndex={-1} className="min-w-0 text-lg font-semibold break-words text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-600">
          {detail.item.stop.name}
        </h2>
        <div className="flex shrink-0 gap-1.5">
          <button type="button" onClick={onCollapse} aria-label="Recolher painel" className={headerButton}>
            <ChevronsRight aria-hidden="true" className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} className={headerButton}>
            <X aria-hidden="true" className="h-4 w-4" />
            Fechar
          </button>
        </div>
      </div>
      <DetailBody {...detail} />
    </aside>
  )
}

/** Sheet inferior modal (< 1024 px): foco preso, Esc/Fechar fecham e o foco volta a quem abriu. */
export function StopSheet({ onClose, ...detail }) {
  const { stop } = detail.item
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom">
        <div className="pr-10">
          <SheetTitle className="break-words">{stop.name}</SheetTitle>
          <SheetDescription className="sr-only">Ficha do ponto {stop.code}: última leitura, origem e ações.</SheetDescription>
        </div>
        <DetailBody {...detail} />
      </SheetContent>
    </Sheet>
  )
}
