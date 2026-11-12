import {
  ChartLine,
  CircleCheck,
  CircleHelp,
  Droplet,
  FlaskConical,
  OctagonAlert,
  RefreshCw,
  SignalHigh,
  SignalZero,
  Thermometer,
  TriangleAlert,
} from 'lucide-react'

/**
 * Nomes legados dos ícones, agora delegando ao lucide-react. Sempre decorativos
 * (aria-hidden): o significado vem do texto ao lado. Novos usos devem importar
 * direto do lucide-react.
 */
function decorative(Icon) {
  return function DecorativeIcon({ className = 'h-4 w-4' }) {
    return <Icon aria-hidden="true" focusable="false" className={className} />
  }
}

export const IconThermometer = decorative(Thermometer)
export const IconDroplet = decorative(Droplet)
export const IconSignal = decorative(SignalHigh)
export const IconSignalOff = decorative(SignalZero)
export const IconCheckCircle = decorative(CircleCheck)
export const IconAlertTriangle = decorative(TriangleAlert)
export const IconAlertOctagon = decorative(OctagonAlert)
export const IconHelpCircle = decorative(CircleHelp)
export const IconFlask = decorative(FlaskConical)
export const IconRefresh = decorative(RefreshCw)
export const IconChart = decorative(ChartLine)
