import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { FileText, MapPin } from 'lucide-react'
import { useStops } from '../../hooks/useStops.js'
import { buildCommandResults } from '../../utils/commandSearch.js'
import { cn } from '../../utils/cn.js'

const PAGES = [
  { to: '/', label: 'Dashboard' },
  { to: '/pontos', label: 'Pontos' },
  { to: '/historico', label: 'Histórico' },
]

/**
 * Command Palette: diálogo nativo com campo de busca (combobox) e lista de
 * resultados (listbox). Só navegação; pontos vêm do useStops (dados já carregados).
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function CommandPalette({ open, onClose }) {
  const dialogRef = useRef(null)
  const returnFocusRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement
      dialog.showModal()
    }
    if (!open && dialog.open) {
      dialog.close()
      const target = returnFocusRef.current
      if (target && target.isConnected) target.focus()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-label="Busca rápida"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      className="mx-auto mt-[10vh] w-[min(36rem,calc(100vw-2rem))] max-w-full rounded-2xl bg-surface p-0 text-slate-900 shadow-elevated backdrop:bg-ink/60"
    >
      {open && <PaletteBody onClose={onClose} />}
    </dialog>
  )
}

/** Montado só com a palette aberta: os pontos são buscados sob demanda e a busca zera ao fechar. */
function PaletteBody({ onClose }) {
  const baseId = useId()
  const navigate = useNavigate()
  const { stops } = useStops()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo(() => buildCommandResults(query, { pages: PAGES, stops }), [query, stops])
  const safeIndex = Math.min(activeIndex, Math.max(results.length - 1, 0))

  const close = onClose

  function choose(result) {
    navigate(result.to)
    close()
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault()
      setActiveIndex((safeIndex + 1) % results.length)
    } else if (event.key === 'ArrowUp' && results.length > 0) {
      event.preventDefault()
      setActiveIndex((safeIndex - 1 + results.length) % results.length)
    } else if (event.key === 'Enter' && results[safeIndex]) {
      event.preventDefault()
      choose(results[safeIndex])
    }
  }

  const optionId = (index) => `${baseId}-opt-${index}`

  return (
    <div className="p-4">
      <label htmlFor={`${baseId}-input`} className="mb-2 block text-sm font-medium text-slate-800">
        Buscar página ou ponto
      </label>
      <input
        id={`${baseId}-input`}
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls={`${baseId}-list`}
        aria-activedescendant={results.length > 0 ? optionId(safeIndex) : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        autoFocus
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
        }}
        onKeyDown={handleKeyDown}
        placeholder="Nome, código ou bairro"
        className="min-h-11 w-full rounded-xl border border-slate-300 bg-surface px-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      />
      <ul id={`${baseId}-list`} role="listbox" aria-label="Resultados" className="mt-3 max-h-80 space-y-1 overflow-y-auto">
        {results.map((result, index) => {
          const Icon = result.kind === 'stop' ? MapPin : FileText
          return (
            <li
              key={`${result.kind}-${result.id}`}
              id={optionId(index)}
              role="option"
              aria-selected={index === safeIndex}
              onClick={() => choose(result)}
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2',
                index === safeIndex ? 'bg-brand-50 text-brand-900 ring-2 ring-brand-600 dark:bg-brand-900/40 dark:text-brand-100' : 'hover:bg-slate-900/5',
              )}
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="min-w-0">
                <span className="block break-words font-medium">{result.label}</span>
                <span className="block break-words text-xs text-slate-600">{result.description}</span>
              </span>
            </li>
          )
        })}
      </ul>
      <p role="status" className="mt-2 text-sm text-slate-600">
        {results.length === 0 ? 'Nenhum resultado para a busca.' : `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}. Use as setas e Enter.`}
      </p>
    </div>
  )
}
