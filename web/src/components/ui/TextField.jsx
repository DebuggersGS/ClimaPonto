import { useId } from 'react'

/**
 * Campo de formulário com rótulo, dica e mensagem de erro associados
 * (aria-describedby / aria-invalid). Aceita `multiline` para textarea.
 */
export default function TextField({ label, error, hint, multiline = false, required = false, className = '', ...props }) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
  const Control = multiline ? 'textarea' : 'input'

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-800">
        {label}
        {required && (
          <span className="text-red-700" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <Control
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-2 focus-visible:outline-brand-600 ${
          error ? 'border-red-500' : 'border-slate-300'
        } ${multiline ? 'min-h-24' : 'min-h-10'}`}
        {...props}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
