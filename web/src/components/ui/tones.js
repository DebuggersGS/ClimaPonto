import {
  CircleCheck,
  Clock,
  CircleHelp,
  Database,
  Flame,
  FlaskConical,
  Radio,
  Sparkles,
  TriangleAlert,
  Wifi,
  WifiOff,
} from 'lucide-react'

/**
 * Classes por tom do design system. Todo par é texto-800/900 sobre fundo-50
 * (contraste AA); o ponto (dot) é reforço, nunca o único sinal.
 */
export const TONE_CLASSES = {
  neutral: { soft: 'bg-slate-100 text-slate-700 ring-slate-300/70', dot: 'bg-slate-500' },
  info: { soft: 'bg-sky-50 text-sky-800 ring-sky-300/70', dot: 'bg-sky-600' },
  success: { soft: 'bg-emerald-50 text-emerald-800 ring-emerald-300/70', dot: 'bg-emerald-600' },
  warning: { soft: 'bg-amber-50 text-amber-900 ring-amber-300/80', dot: 'bg-amber-600' },
  danger: { soft: 'bg-red-50 text-red-800 ring-red-300/70', dot: 'bg-red-600' },
  demo: { soft: 'bg-violet-50 text-violet-800 ring-violet-300/70', dot: 'bg-violet-600' },
}

/** Resolve o NOME de ícone usado em utils/statusTones.js para o componente lucide. */
export const ICONS_BY_NAME = {
  CheckCircle2: CircleCheck,
  AlertTriangle: TriangleAlert,
  Flame,
  CircleHelp,
  Wifi,
  WifiOff,
  Clock,
  Database,
  Radio,
  Sparkles,
  FlaskConical,
}

export function getToneClasses(tone) {
  return TONE_CLASSES[Object.hasOwn(TONE_CLASSES, tone) ? tone : 'neutral']
}
