import { getEnvironmentalTone } from '../../utils/statusTones.js'
import { StatusBadge } from './Badge.jsx'

/**
 * Exibe o estado ambiental já gravado (nunca calculado aqui): ícone + texto.
 * @param {{ status: 'normal'|'attention'|'critical'|'unclassified', size?: 'sm'|'md' }} props
 */
export default function EnvironmentalStatusBadge({ status, size }) {
  return <StatusBadge info={getEnvironmentalTone(status)} prefix="Estado ambiental" size={size} />
}
