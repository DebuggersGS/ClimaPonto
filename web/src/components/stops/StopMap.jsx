import { useMemo } from 'react'
import { cn } from '../../utils/cn.js'
import { partitionStopsByCoordinates, projectStops } from '../../utils/stopMap.js'
import { getConnectivityTone, getEnvironmentalTone } from '../../utils/statusTones.js'
import StatusIcon from '../ui/StatusIcon.jsx'
import { getToneClasses } from '../ui/tones.js'

const VIEW = { width: 600, height: 600, padding: 40 }
const GRID_LINES = [100, 200, 300, 400, 500]

/** Nome acessível do marcador: ponto + estado ambiental + conectividade, sempre em texto. */
function markerLabel({ stop, reading, connectivity }) {
  const environmental = reading ? getEnvironmentalTone(reading.environmentalStatus).label : 'sem leitura'
  const connect = getConnectivityTone(connectivity.status).label
  return `${stop.name}, ${stop.code}. Estado ambiental: ${environmental}. Conectividade: ${connect}.`
}

function Marker({ item, x, y, selected, onSelect }) {
  const { stop, reading, connectivity } = item
  const tone = reading ? getEnvironmentalTone(reading.environmentalStatus) : getConnectivityTone(connectivity.status)
  // Borda tracejada: dados não chegando (atrasado, offline, sem dados); não depende da cor.
  const notOnline = connectivity.status !== 'online'
  return (
    <button
      type="button"
      aria-label={markerLabel(item)}
      aria-current={selected ? 'true' : undefined}
      onClick={() => onSelect(stop.code)}
      style={{ left: `${(x / VIEW.width) * 100}%`, top: `${(y / VIEW.height) * 100}%` }}
      className={cn(
        'absolute -ml-3.5 -mt-3.5 flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        getToneClasses(tone.tone).soft,
        notOnline && 'border-2 border-dashed border-slate-700',
        selected && 'outline-2 outline-offset-2 outline-brand-700',
      )}
    >
      <StatusIcon name={tone.icon} className="h-4 w-4" />
      <span aria-hidden="true" className="absolute top-full mt-0.5 hidden whitespace-nowrap rounded bg-surface/90 px-1 text-xs font-medium text-slate-800 sm:block">
        {stop.code}
      </span>
    </button>
  )
}

/** Pontos que não podem ser posicionados no mapa, com o motivo. */
function OffMapList({ entries, onSelect }) {
  if (entries.length === 0) return null
  return (
    <section aria-labelledby="fora-do-mapa" className="mt-4">
      <h2 id="fora-do-mapa" className="text-base font-semibold text-slate-900">
        Pontos fora do mapa
      </h2>
      <ul className="mt-2 space-y-2 text-sm text-slate-700">
        {entries.map(({ item, reason }) => (
          <li key={item.stop.id} className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSelect(item.stop.code)}
              className="min-h-10 rounded-md px-2 font-medium text-brand-700 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-brand-200"
            >
              {item.stop.name} ({item.stop.code})
            </button>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Mapa esquemático: fundo SVG decorativo + um botão por ponto posicionado pelas
 * coordenadas cadastradas (sem mapa base). A projeção usa todos os pontos, então
 * os marcadores não "pulam" quando os filtros mudam; só os filtrados aparecem.
 * @param {{ stops: object[], items: object[], selectedCode: string|null, onSelect: (code: string) => void }} props
 *   `stops` todos os pontos; `items` itens (summarizeDashboard) já filtrados
 */
export default function StopMap({ stops, items, selectedCode, onSelect }) {
  const projected = useMemo(() => projectStops(partitionStopsByCoordinates(stops).located, VIEW), [stops])
  const byId = useMemo(() => new Map(items.map((item) => [item.stop.id, item])), [items])
  const { missing, outside } = useMemo(() => partitionStopsByCoordinates(items), [items])
  const markers = projected.filter(({ item }) => byId.has(item.id))

  return (
    <div>
      <figure aria-label="Mapa esquemático dos pontos de ônibus" className="m-0">
        <div className="relative mx-auto aspect-square w-full max-w-xl overflow-hidden rounded-card bg-surface-muted ring-1 ring-slate-900/10">
          <svg aria-hidden="true" focusable="false" viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} className="absolute inset-0 h-full w-full text-slate-300">
            {GRID_LINES.map((n) => (
              <g key={n} stroke="currentColor" strokeWidth="1" strokeDasharray="4 6">
                <line x1={n} y1="0" x2={n} y2={VIEW.height} />
                <line x1="0" y1={n} x2={VIEW.width} y2={n} />
              </g>
            ))}
          </svg>
          <span className="absolute right-3 top-3 rounded-full bg-surface/90 px-2 py-0.5 text-xs font-semibold text-slate-700">N ↑ norte</span>
          {markers.map(({ item, x, y }) => (
            <Marker key={item.id} item={byId.get(item.id)} x={x} y={y} selected={item.code === selectedCode} onSelect={onSelect} />
          ))}
        </div>
        <figcaption className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
          Mapa esquemático: posição relativa pelas coordenadas cadastradas; sem ruas/mapa base. Cada marcador mostra o
          ícone do estado ambiental gravado; borda tracejada indica ponto atrasado, offline ou sem dados.
        </figcaption>
      </figure>
      {projected.length === 0 && (
        <p className="mt-3 text-sm text-slate-700">Nenhum ponto tem coordenadas válidas cadastradas para aparecer no mapa.</p>
      )}
      <OffMapList entries={[...missing, ...outside]} onSelect={onSelect} />
    </div>
  )
}
