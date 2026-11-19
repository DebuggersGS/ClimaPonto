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
 * Classes por tom do design system. No claro, todo par é texto-800/900 (no escuro, texto-200 sobre fundo-950) sobre fundo-50
 * (contraste AA); o ponto (dot) é reforço, nunca o único sinal.
 */
export const TONE_CLASSES = {
  neutral: { soft: 'bg-slate-100 text-slate-700 ring-slate-300/70', dot: 'bg-slate-500' },
  info: { soft: 'bg-sky-50 text-sky-800 ring-sky-300/70 dark:bg-sky-950/60 dark:text-sky-200 dark:ring-sky-400/40', dot: 'bg-sky-600 dark:bg-sky-400' },
  success: { soft: 'bg-emerald-50 text-emerald-800 ring-emerald-300/70 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-400/40', dot: 'bg-emerald-600 dark:bg-emerald-400' },
  warning: { soft: 'bg-amber-50 text-amber-900 ring-amber-300/80 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-400/40', dot: 'bg-amber-600 dark:bg-amber-400' },
  danger: { soft: 'bg-red-50 text-red-800 ring-red-300/70 dark:bg-red-950/60 dark:text-red-200 dark:ring-red-400/40', dot: 'bg-red-600 dark:bg-red-400' },
  demo: { soft: 'bg-violet-50 text-violet-800 ring-violet-300/70 dark:bg-violet-950/60 dark:text-violet-200 dark:ring-violet-400/40', dot: 'bg-violet-600 dark:bg-violet-400' },
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
