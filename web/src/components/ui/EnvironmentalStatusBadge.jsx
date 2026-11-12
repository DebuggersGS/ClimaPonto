import { ENVIRONMENTAL_STATUS_LABELS } from '../../utils/readings.js'
import { IconAlertOctagon, IconAlertTriangle, IconCheckCircle, IconHelpCircle } from './icons.jsx'

const VARIANTS = {
  normal: { Icon: IconCheckCircle, classes: 'bg-emerald-50 text-emerald-800' },
  attention: { Icon: IconAlertTriangle, classes: 'bg-amber-50 text-amber-900' },
  critical: { Icon: IconAlertOctagon, classes: 'bg-red-50 text-red-800' },
  unclassified: { Icon: IconHelpCircle, classes: 'bg-slate-100 text-slate-700' },
}

/**
 * Exibe o estado ambiental já gravado (nunca calculado aqui): ícone + texto.
 * @param {{ status: 'normal'|'attention'|'critical'|'unclassified' }} props
 */
export default function EnvironmentalStatusBadge({ status }) {
  const key = Object.hasOwn(VARIANTS, status) ? status : 'unclassified'
  const { Icon, classes } = VARIANTS[key]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${classes}`}>
      <Icon />
      <span className="sr-only">Estado ambiental: </span>
      {ENVIRONMENTAL_STATUS_LABELS[key]}
    </span>
  )
}
