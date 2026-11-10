import { formatDateTime } from '../../utils/formatters.js'
import Button from '../ui/Button.jsx'

/** Cartão de um ponto na área administrativa, com as ações disponíveis. */
export default function AdminStopCard({ stop, busy, onEdit, onToggleActive, onDelete }) {
  return (
    <article
      aria-labelledby={`stop-${stop.id}-name`}
      className={`flex h-full flex-col rounded-lg border bg-white p-4 shadow-sm ${stop.active ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50'}`}
    >
      <div className="flex flex-col gap-2">
        <div className="min-w-0">
          <h3 id={`stop-${stop.id}-name`} className="font-semibold break-words text-slate-900">
            {stop.name}
          </h3>
          <p className="font-mono text-xs text-slate-500">{stop.code}</p>
        </div>
        <div className="flex flex-wrap gap-1 text-xs font-medium">
          <span className={`rounded-full px-2 py-0.5 ${stop.active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-800'}`}>
            {stop.active ? 'Ativo' : 'Inativo'}
          </span>
          {stop.isDemo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">Demonstrativo</span>}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-700">{stop.neighborhood}</p>
      {stop.description && <p className="mt-1 text-sm break-words text-slate-500">{stop.description}</p>}
      <p className="mt-2 text-xs text-slate-500">Atualizado em {formatDateTime(stop.updatedAt)}</p>

      <div className="mt-4 flex flex-wrap gap-2 pt-2 sm:mt-auto">
        <Button variant="secondary" onClick={() => onEdit(stop)} disabled={busy} aria-label={`Editar ${stop.name}`}>
          Editar
        </Button>
        <Button
          variant="secondary"
          onClick={() => onToggleActive(stop)}
          disabled={busy}
          aria-label={`${stop.active ? 'Desativar' : 'Reativar'} ${stop.name}`}
        >
          {stop.active ? 'Desativar' : 'Reativar'}
        </Button>
        <Button variant="ghost" className="text-red-800 hover:bg-red-50" onClick={() => onDelete(stop)} disabled={busy} aria-label={`Excluir ${stop.name}`}>
          Excluir
        </Button>
      </div>
    </article>
  )
}
