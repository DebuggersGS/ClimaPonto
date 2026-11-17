import { formatDateTime } from '../../utils/formatters.js'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'

/** Cartão de um ponto na área administrativa, com as ações disponíveis. */
export default function AdminStopCard({ stop, busy, onEdit, onToggleActive, onDelete }) {
  return (
    <article
      aria-labelledby={`stop-${stop.id}-name`}
      className={`flex h-full flex-col rounded-card p-5 ring-1 transition-[transform,box-shadow] duration-250 ease-out-soft motion-safe:hover:-translate-y-0.5 hover:shadow-elevated ${stop.active ? 'bg-surface shadow-card ring-slate-900/5' : 'bg-slate-50 outline-1 -outline-offset-1 outline-dashed outline-slate-300 ring-slate-900/5'}`}
    >
      <div className="flex flex-col gap-2">
        <div className="min-w-0">
          <h3 id={`stop-${stop.id}-name`} className="font-semibold break-words text-slate-900">
            {stop.name}
          </h3>
          <p className="font-mono text-xs text-slate-500">{stop.code}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge tone={stop.active ? 'success' : 'neutral'} size="sm">
            {stop.active ? 'Ativo' : 'Inativo'}
          </Badge>
          {stop.isDemo && (
            <Badge tone="warning" size="sm">
              Demonstrativo
            </Badge>
          )}
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
        <Button variant="ghost" className="text-red-800 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40 dark:disabled:text-slate-400" onClick={() => onDelete(stop)} disabled={busy} aria-label={`Excluir ${stop.name}`}>
          Excluir
        </Button>
      </div>
    </article>
  )
}
