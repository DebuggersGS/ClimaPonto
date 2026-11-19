import { CircleCheck, CircleX, Info } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { getToneClasses } from './tones.js'

// Cada tom tem ícone: a cor nunca é o único sinal.
const TONES = {
  success: { tone: 'success', Icon: CircleCheck },
  error: { tone: 'danger', Icon: CircleX },
  info: { tone: 'info', Icon: Info },
}

/**
 * Mensagem de retorno de uma operação.
 * Erros usam role="alert" (anunciados imediatamente); demais, role="status".
 */
export default function FeedbackMessage({ tone = 'info', children, onDismiss, className }) {
  if (!children) return null
  const { tone: visualTone, Icon } = TONES[tone] ?? TONES.info
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'mb-4 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ring-1 ring-inset',
        getToneClasses(visualTone).soft,
        className,
      )}
    >
      <Icon aria-hidden="true" focusable="false" className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1 break-words">{children}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-6 shrink-0 rounded px-1 font-medium underline focus-visible:outline-2 focus-visible:outline-current"
        >
          Fechar
        </button>
      )}
    </div>
  )
}
