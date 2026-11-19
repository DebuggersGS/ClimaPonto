import { useId, useRef } from 'react'
import { LoaderCircle, Search, X } from 'lucide-react'
import { cn } from '../../utils/cn.js'

/**
 * Campo de busca arredondado, com ícone, botão "Limpar" e estado carregando.
 * O rótulo existe sempre (visível ou só para leitores de tela). Esc limpa o texto.
 * @param {{ label: string, value: string, onValueChange: (value: string) => void, loading?: boolean, hideLabel?: boolean, className?: string }} props
 */
export default function SearchField({
  label,
  value,
  onValueChange,
  loading = false,
  hideLabel = true,
  className,
  ...props
}) {
  const id = useId()
  const inputRef = useRef(null)

  function clear() {
    onValueChange('')
    inputRef.current?.focus()
  }

  return (
    <div className={className}>
      <label htmlFor={id} className={cn('mb-1 block text-sm font-medium text-slate-800', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
        <input
          ref={inputRef}
          id={id}
          type="search"
          value={value}
          aria-busy={loading || undefined}
          autoComplete="off"
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && value) {
              event.preventDefault()
              event.stopPropagation()
              clear()
            }
          }}
          className="h-field w-full appearance-none rounded-pill border border-slate-300 bg-surface pl-11 pr-20 text-base text-slate-900 shadow-xs transition-shadow duration-150 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          {...props}
        />
        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {loading && (
            <>
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin-slow text-slate-600" />
              <span role="status" className="sr-only">
                Buscando…
              </span>
            </>
          )}
          {value && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={clear}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-900/5"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
