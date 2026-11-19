import { useId, useState } from 'react'
import { BellRing, ChevronDown } from 'lucide-react'
import { formatDateTimeWithZone } from '../../utils/formatters.js'
import Badge from '../ui/Badge.jsx'
import Card from '../ui/Card.jsx'
import ReadingSourceBadge from '../ui/ReadingSourceBadge.jsx'

const SEVERITY = {
  critical: { label: 'Crítico', tone: 'danger' },
  offline: { label: 'Offline (dado desatualizado)', tone: 'neutral' },
  attention: { label: 'Atenção', tone: 'warning' },
}

function AlertItem({ alert }) {
  const severity = SEVERITY[alert.severity]
  return (
    <li className="min-w-0 rounded-xl bg-surface p-3 shadow-card ring-1 ring-slate-900/5">
      <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
        <span className="break-words">{alert.stopName}</span>
        <span className="text-sm font-normal text-slate-600">({alert.stopCode})</span>
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-2">
        <Badge tone={severity.tone} size="sm">{severity.label}</Badge>
        <ReadingSourceBadge source={alert.origin.key} />
      </p>
      <p className="mt-2 break-words text-sm text-slate-700">{alert.ruleText}</p>
      <p className="mt-1 text-xs text-slate-600">Leitura de {formatDateTimeWithZone(alert.readingAt)}</p>
    </li>
  )
}

/**
 * Alertas internos derivados das últimas leituras (sem limiares no front-end,
 * sem Notification API). Lista recolhida por padrão; contagem em região aria-live.
 * @param {{ alerts: import('../../utils/stopAlerts.js').StopAlert[] }} props
 */
export default function AlertsPanel({ alerts }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const count = alerts.length
  const summary =
    count === 0
      ? 'Nenhum alerta: nenhum ponto com estado ambiental crítico ou de atenção gravado, e nenhum ponto offline.'
      : `${count} ${count === 1 ? 'alerta ativo' : 'alertas ativos'}.`

  return (
    <Card aria-labelledby={`${panelId}-title`} className="mb-section">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${panelId}-title`} className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <BellRing aria-hidden="true" className="h-4 w-4" />
            Alertas
          </h2>
          <p aria-live="polite" className="mt-1 text-sm text-slate-700">
            {summary}
          </p>
        </div>
        {count > 0 && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-surface px-4 py-2 text-sm font-medium text-slate-900 hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {open ? 'Ocultar alertas' : 'Mostrar alertas'}
            <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      <ul id={panelId} hidden={!open || count === 0} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {alerts.map((alert) => (
          <AlertItem key={`${alert.stopCode}-${alert.type}`} alert={alert} />
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-600">
        Alertas internos desta tela: usam o estado ambiental gravado pelo banco e a regra provisória de conectividade; não são notificações do sistema.
      </p>
    </Card>
  )
}
