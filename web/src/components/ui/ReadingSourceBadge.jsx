import { getReadingSourceInfo } from '../../utils/readings.js'
import { IconFlask } from './icons.jsx'

/**
 * Origem da leitura. Sensor é discreto; simulação, teste e origem
 * desconhecida são destacadas com ícone e texto.
 * @param {{ source: string|null|undefined }} props
 */
export default function ReadingSourceBadge({ source }) {
  const info = getReadingSourceInfo(source)
  if (info.isRealMeasurement) {
    return <span className="text-xs text-slate-600">Origem: {info.label}</span>
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
      <IconFlask className="h-3.5 w-3.5" />
      <span>{info.note}</span>
    </span>
  )
}
