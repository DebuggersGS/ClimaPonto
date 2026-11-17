import { SHAPE_BY_STATUS, STATUS_COLORS, STATUS_LEGEND } from './mapConfig.js'

const PATHS = {
  circle: <circle cx="10" cy="10" r="7" />,
  triangle: <polygon points="10,2 18,17 2,17" />,
  diamond: <polygon points="10,1 19,10 10,19 1,10" />,
  square: <rect x="3" y="3" width="14" height="14" />,
}

function ShapeIcon({ status, dashed }) {
  return (
    <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20" className="shrink-0">
      <g fill={STATUS_COLORS[status]} stroke="#0b1220" strokeWidth="2" strokeDasharray={dashed ? '3 2.5' : undefined}>
        {PATHS[SHAPE_BY_STATUS[status]]}
      </g>
    </svg>
  )
}

/** Legenda em texto: cada estado tem forma própria; contorno tracejado indica ponto não online. */
export default function MapLegend() {
  return (
    <div className="mt-2 text-sm text-slate-700">
      <p className="font-medium text-slate-800">Legenda do mapa</p>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {STATUS_LEGEND.map(({ status, label }) => (
          <li key={status} className="flex items-center gap-1.5">
            <ShapeIcon status={status} />
            {label} ({{ circle: 'círculo', triangle: 'triângulo', diamond: 'losango', square: 'quadrado' }[SHAPE_BY_STATUS[status]]})
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <ShapeIcon status="unclassified" dashed />
          Contorno tracejado: atrasado, offline ou sem dados
        </li>
        <li>Círculo azul com número: grupo de pontos próximos (clique para aproximar)</li>
      </ul>
    </div>
  )
}
