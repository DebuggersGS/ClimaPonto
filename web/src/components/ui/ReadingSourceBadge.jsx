import { getReadingSourceInfo } from '../../utils/readings.js'
import { getSourceTone } from '../../utils/statusTones.js'
import Badge from './Badge.jsx'

/**
 * Origem da leitura. Todas as origens têm ícone e texto; as que não são
 * medição real exibem a nota explicativa (readings.js) em vez do rótulo curto.
 * @param {{ source: string|null|undefined }} props
 */
export default function ReadingSourceBadge({ source }) {
  const info = getReadingSourceInfo(source)
  const tone = getSourceTone(source)
  return (
    <Badge tone={tone.tone} icon={tone.icon} size="sm">
      {info.isRealMeasurement ? `Origem: ${info.label}` : info.note}
    </Badge>
  )
}
