import { getConnectivityTone } from '../../utils/statusTones.js'
import Badge from './Badge.jsx'

/**
 * Conectividade do ponto, dimensão separada do estado ambiental.
 * @param {{ status: 'online'|'delayed'|'offline'|'no_data'|'unknown', ageText?: string }} props
 */
export default function ConnectivityBadge({ status, ageText }) {
  const info = getConnectivityTone(status)
  return (
    <Badge tone={info.tone} icon={info.icon} className="max-w-full whitespace-normal">
      <span className="min-w-0">
        Conectividade: <strong className="font-semibold">{info.label}</strong>
        {ageText ? ` · última leitura ${ageText}` : ''}
      </span>
    </Badge>
  )
}
