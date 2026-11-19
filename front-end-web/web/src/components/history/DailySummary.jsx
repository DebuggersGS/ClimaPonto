import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatHumidity, formatTemperature } from '../../utils/formatters.js'
import { summarizeByDay } from '../../utils/historyExploration.js'

function formatDay(day) {
  const [year, month, date] = day.split('-')
  return `${date}/${month}/${year}`
}

function cell(stat, key, format) {
  return stat.count === 0 ? (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">indisponível</span>
    </>
  ) : (
    format(stat[key])
  )
}

/**
 * Resumo por dia civil (America/Sao_Paulo), recolhido por padrão.
 * @param {{ readings: object[] }} props
 */
export default function DailySummary({ readings }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const days = summarizeByDay(readings)
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-surface px-4 py-2 text-sm font-medium text-slate-900 shadow-card hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {open ? 'Ocultar resumo por dia' : 'Mostrar resumo por dia'}
        <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      <div id={panelId} hidden={!open} className="mt-3">
        <p className="mb-2 text-sm text-slate-600">Dias civis no horário de São Paulo; considera só as leituras filtradas.</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((item) => (
            <li key={item.day} className="min-w-0 rounded-xl bg-surface p-3 shadow-card ring-1 ring-slate-900/5">
              <p className="font-semibold text-slate-900">
                {formatDay(item.day)} <span className="text-sm font-normal text-slate-600">· {item.count} {item.count === 1 ? 'leitura' : 'leituras'}</span>
              </p>
              <dl className="mt-2 space-y-1 text-sm text-slate-700">
                <div className="flex flex-wrap justify-between gap-x-2">
                  <dt>Temperatura mín. / média / máx.</dt>
                  <dd className="tabular-nums">
                    {cell(item.temperatureC, 'min', formatTemperature)} / {cell(item.temperatureC, 'avg', formatTemperature)} / {cell(item.temperatureC, 'max', formatTemperature)}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-x-2">
                  <dt>Umidade mín. / média / máx.</dt>
                  <dd className="tabular-nums">
                    {cell(item.humidityPct, 'min', formatHumidity)} / {cell(item.humidityPct, 'avg', formatHumidity)} / {cell(item.humidityPct, 'max', formatHumidity)}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
