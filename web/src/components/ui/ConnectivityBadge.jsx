import { CONNECTIVITY_LABELS } from '../../utils/connectivity.js'
import { IconSignal, IconSignalOff } from './icons.jsx'

// Chip com contorno (forma distinta do selo ambiental). Offline é cinza, nunca vermelho.
const VARIANTS = {
  online: { Icon: IconSignal, classes: 'border-emerald-600 bg-white text-emerald-800' },
  delayed: { Icon: IconSignal, classes: 'border-amber-600 bg-white text-amber-900' },
  offline: { Icon: IconSignalOff, classes: 'border-slate-400 bg-slate-50 text-slate-700' },
  no_data: { Icon: IconSignalOff, classes: 'border-slate-400 bg-white text-slate-700' },
  unknown: { Icon: IconSignalOff, classes: 'border-slate-400 bg-white text-slate-700' },
}

/**
 * Conectividade do ponto, dimensão separada do estado ambiental.
 * @param {{ status: 'online'|'delayed'|'offline'|'no_data'|'unknown', ageText?: string }} props
 */
export default function ConnectivityBadge({ status, ageText }) {
  const key = Object.hasOwn(VARIANTS, status) ? status : 'unknown'
  const { Icon, classes } = VARIANTS[key]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm ${classes}`}>
      <Icon />
      <span>
        Conectividade: <strong className="font-semibold">{CONNECTIVITY_LABELS[key]}</strong>
        {ageText ? ` · última leitura ${ageText}` : ''}
      </span>
    </span>
  )
}
