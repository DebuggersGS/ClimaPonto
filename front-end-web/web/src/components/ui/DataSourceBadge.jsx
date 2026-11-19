import { getDataModeInfo } from '../../utils/dataMode.js'
import { getDataModeTone } from '../../utils/statusTones.js'
import Badge from './Badge.jsx'

/** Indica de onde vêm os dados exibidos na página (modo efetivo de dados). */
export default function DataSourceBadge({ source }) {
  const tone = getDataModeTone(source)
  return (
    <p className="mb-4">
      <Badge tone={tone.tone} icon={tone.icon} size="sm">
        Fonte: {getDataModeInfo(source).label}
      </Badge>
    </p>
  )
}
