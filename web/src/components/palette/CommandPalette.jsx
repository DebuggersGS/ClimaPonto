import { useId, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { FileText, MapPin, Zap } from 'lucide-react'
import { useStops } from '../../hooks/useStops.js'
import { buildCommandResults } from '../../utils/commandSearch.js'
import { EMPTY_STOP_FILTERS, serializeStopFilterParams } from '../../utils/stopFilterParams.js'
import { PUBLIC_NAV_ITEMS } from '../layout/navItems.js'
import { Command, CommandInput, CommandItem, CommandList, CommandStatus } from '../ui/Command.jsx'

const PAGES = PUBLIC_NAV_ITEMS.map(({ to, label }) => ({ to, label }))
const ACTIONS = [
  { id: 'ir-ao-mapa', label: 'Ir ao mapa', to: '/pontos' },
  { id: 'limpar-filtros', label: 'Limpar filtros' },
]
const ICONS = { stop: MapPin, page: FileText, action: Zap }

/**
 * Paleta de comandos (Ctrl/Cmd+K): páginas, ações reais e pontos já carregados.
 * Usa as peças de ui/Command.jsx; a busca fica em utils/commandSearch.js.
 * @param {{ open: boolean, onClose: () => void, returnFocusRef?: import('react').RefObject<HTMLElement|null> }} props
 */
export default function CommandPalette({ open, onClose, returnFocusRef }) {
  return (
    <Command open={open} onOpenChange={(next) => !next && onClose()} title="Busca rápida" returnFocusRef={returnFocusRef}>
      <PaletteBody onClose={onClose} />
    </Command>
  )
}

/** Destino de cada resultado. "Limpar filtros" zera só os filtros de pontos e preserva os demais parâmetros da URL. */
function resolveTarget(result, location) {
  if (result.id !== 'limpar-filtros') return result.to
  const base = location.pathname === '/pontos' ? location.search : ''
  const search = serializeStopFilterParams(base, EMPTY_STOP_FILTERS).toString()
  return `/pontos${search ? `?${search}` : ''}`
}

/** Montado só com a paleta aberta: os pontos são buscados sob demanda e a busca zera ao fechar. */
function PaletteBody({ onClose }) {
  const baseId = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const { stops } = useStops()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo(() => buildCommandResults(query, { pages: PAGES, actions: ACTIONS, stops }), [query, stops])
  const safeIndex = Math.min(activeIndex, Math.max(results.length - 1, 0))
  const optionId = (index) => `${baseId}-opt-${index}`

  function choose(result) {
    navigate(resolveTarget(result, location))
    onClose()
  }

  function handleKeyDown(event) {
    if (results.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((safeIndex + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((safeIndex - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(results[safeIndex])
    }
  }

  return (
    <>
      <CommandInput
        label="Buscar página, ação ou ponto"
        listId={`${baseId}-list`}
        activeId={results.length > 0 ? optionId(safeIndex) : undefined}
        autoFocus
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
        }}
        onKeyDown={handleKeyDown}
        placeholder="Nome, código ou bairro"
      />
      <CommandList id={`${baseId}-list`}>
        {results.map((result, index) => {
          const Icon = ICONS[result.kind]
          return (
            <CommandItem key={`${result.kind}-${result.id}`} id={optionId(index)} active={index === safeIndex} onClick={() => choose(result)}>
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="min-w-0">
                <span className="block break-words font-medium">{result.label}</span>
                <span className="block break-words text-xs text-slate-600">{result.description}</span>
              </span>
            </CommandItem>
          )
        })}
      </CommandList>
      <CommandStatus>
        {results.length === 0 ? 'Nenhum resultado para a busca.' : `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}. Use as setas e Enter.`}
      </CommandStatus>
    </>
  )
}
