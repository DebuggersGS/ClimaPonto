const TONES = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  error: 'border-red-300 bg-red-50 text-red-900',
  info: 'border-sky-300 bg-sky-50 text-sky-900',
}

/**
 * Mensagem de retorno de uma operação.
 * Erros usam role="alert" (anunciados imediatamente); demais, role="status".
 */
export default function FeedbackMessage({ tone = 'info', children, onDismiss }) {
  if (!children) return null
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`mb-4 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${TONES[tone]}`}
    >
      <p>{children}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded px-1 font-medium underline focus-visible:outline-2 focus-visible:outline-current"
        >
          Fechar
        </button>
      )}
    </div>
  )
}
