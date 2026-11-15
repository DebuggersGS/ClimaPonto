import { useId, useState } from 'react'
import { ChevronDown, GitCompareArrows } from 'lucide-react'
import Card from '../ui/Card.jsx'
import FeedbackMessage from '../ui/FeedbackMessage.jsx'
import StopSelect from '../history/StopSelect.jsx'
import { useStopComparison } from '../../hooks/useStopComparison.js'
import { DEFAULT_PERIOD_ID, HISTORY_PERIODS } from '../../utils/historyPeriods.js'
import { formatDateTime, formatHumidity, formatTemperature } from '../../utils/formatters.js'
import { getReadingSourceInfo } from '../../utils/readings.js'
import { cn } from '../../utils/cn.js'

const FIELD_ROWS = [
  { field: 'temperatureC', label: 'Temperatura', format: formatTemperature },
  { field: 'humidityPct', label: 'Umidade', format: formatHumidity },
]

const iso = (ms) => formatDateTime(new Date(ms).toISOString())
const orDash = (value, format) => (value === null || value === undefined ? '—' : format(value))

function FieldBlock({ row, data, nameA, nameB }) {
  const { field, label, format } = row
  const diff = data.averageDifference
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-900/5">
      <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
      <dl className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        {[['A', nameA, data.a], ['B', nameB, data.b]].map(([tag, name, stats]) => (
          <div key={tag} className="min-w-0 break-words">
            <dt className="font-medium text-slate-800">Ponto {tag}: {name}</dt>
            <dd className="text-slate-600">
              {stats.n} {stats.n === 1 ? 'leitura' : 'leituras'}
              {stats.n > 0 && (
                <>
                  {' · '}mín. {orDash(stats.min, format)} · média {orDash(stats.average, format)} · máx. {orDash(stats.max, format)}
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p data-field={field} className="mt-2 break-words text-xs text-slate-800">
        {diff === null
          ? 'Diferença de médias indisponível: falta valor em um dos pontos.'
          : `Diferença de médias (A − B): ${diff > 0 ? '+' : ''}${format(Math.round(diff * 10) / 10)}.`}
      </p>
    </div>
  )
}

function Result({ comparison, truncated, nameA, nameB }) {
  if (comparison.status === 'not-comparable') {
    return <FeedbackMessage tone="info">Não comparável: {comparison.message}</FeedbackMessage>
  }
  const source = getReadingSourceInfo(comparison.source)
  return (
    <div className="space-y-3">
      <p className="break-words text-xs text-slate-700">
        Origem: <strong>{source.label}</strong>. Intervalo comparado: {iso(comparison.from)} a {iso(comparison.to)}.
      </p>
      {comparison.isSimulation && <FeedbackMessage tone="info" className="!mb-0">{source.note}. Não tratar como medição real.</FeedbackMessage>}
      {truncated && <FeedbackMessage tone="info" className="!mb-0">Histórico truncado: só as leituras mais recentes foram comparadas.</FeedbackMessage>}
      {FIELD_ROWS.map((row) => (
        <FieldBlock key={row.field} row={row} data={comparison.fields[row.field]} nameA={nameA} nameB={nameB} />
      ))}
    </div>
  )
}

function ComparisonBody({ stops }) {
  const [codeA, setCodeA] = useState('')
  const [codeB, setCodeB] = useState('')
  const [periodId, setPeriodId] = useState(DEFAULT_PERIOD_ID)
  const ids = useId()
  const stopA = stops.find((s) => s.code === codeA)
  const stopB = stops.find((s) => s.code === codeB)
  const { comparison, truncated, isLoading, error, retry } = useStopComparison({ stopAId: stopA?.id, stopBId: stopB?.id, periodId })

  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <StopSelect id={`${ids}-a`} label="Ponto A" stops={stops.filter((s) => s.code !== codeB)} value={codeA} onChange={setCodeA} />
        <StopSelect id={`${ids}-b`} label="Ponto B" stops={stops.filter((s) => s.code !== codeA)} value={codeB} onChange={setCodeB} />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={`${ids}-p`} className="text-sm font-medium text-slate-700">Período</label>
        <select
          id={`${ids}-p`}
          value={periodId}
          onChange={(event) => setPeriodId(event.target.value)}
          className="min-h-11 w-full rounded-full border border-slate-300 bg-surface px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {HISTORY_PERIODS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>
      <p className="text-xs text-slate-700">Comparação descritiva entre pontos; não é classificação ambiental.</p>
      {!stopA || !stopB ? (
        <p className="text-sm text-slate-600">Selecione dois pontos diferentes para comparar.</p>
      ) : error ? (
        <FeedbackMessage tone="error">
          {error.message || 'Não foi possível carregar a comparação.'}{' '}
          <button type="button" onClick={retry} className="font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
            Tentar novamente
          </button>
        </FeedbackMessage>
      ) : isLoading || !comparison ? (
        <p role="status" className="text-sm text-slate-600">Carregando comparação…</p>
      ) : (
        <Result comparison={comparison} truncated={truncated} nameA={stopA.code} nameB={stopB.code} />
      )}
    </div>
  )
}

/**
 * Comparador de 2 pontos no mesmo período, recolhido por padrão.
 * @param {{ stops: Array<{ id: string, code: string, name: string }> }} props
 */
export default function StopComparison({ stops }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <Card className="mt-4 !p-3 sm:!p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <GitCompareArrows aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700 dark:text-brand-200" />
          <span className="min-w-0 flex-1">Comparar dois pontos</span>
          <ChevronDown aria-hidden="true" className={cn('h-4 w-4 shrink-0', open && 'rotate-180')} />
        </button>
      </h3>
      {open && (
        <div id={panelId}>
          <ComparisonBody stops={stops} />
        </div>
      )}
    </Card>
  )
}
