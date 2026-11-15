import { Clock, Database, Sparkles } from 'lucide-react'
import { getDataModeInfo } from '../../utils/dataMode.js'
import Badge from '../ui/Badge.jsx'
import { cn } from '../../utils/cn.js'

function Chip({ icon: Icon, children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-surface/70 px-2.5 py-1 text-sm font-medium text-slate-800 ring-1 ring-inset ring-slate-900/10',
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-brand-700 dark:text-brand-200" />
      {children}
    </span>
  )
}

/**
 * Contexto do histórico em destaque: ponto, período e origem dos dados.
 * Sem ponto selecionado mostra só período e origem.
 * @param {{ stop?: { name: string, code: string, neighborhood?: string, isDemo?: boolean }, period: { label: string }, source: string }} props
 */
export default function HistoryHeader({ stop, period, source }) {
  return (
    <div className="mb-5 min-w-0">
      {stop && (
        <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="break-words text-xl font-semibold text-slate-900">{stop.name}</span>
          <span className="text-sm text-slate-600">
            Código <span className="font-medium tabular-nums text-slate-800">{stop.code}</span>
            {stop.neighborhood ? ` · ${stop.neighborhood}` : ''}
          </span>
          {stop.isDemo && (
            <Badge tone="demo" icon="Sparkles" size="sm">
              Ponto demonstrativo
            </Badge>
          )}
        </p>
      )}
      <ul className="flex flex-wrap gap-2" aria-label="Contexto da consulta">
        <li>
          <Chip icon={Clock}>Período: {period.label}</Chip>
        </li>
        <li>
          <Chip icon={source === 'mock' ? Sparkles : Database}>Fonte: {getDataModeInfo(source).label}</Chip>
        </li>
      </ul>
    </div>
  )
}
