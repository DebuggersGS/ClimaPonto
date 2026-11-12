import { useId } from 'react'
import { HISTORY_PERIODS } from '../../utils/historyPeriods.js'
import { IconCheckCircle } from '../ui/icons.jsx'

/**
 * Filtro de período em segmentos (radios nativos: navegação por setas).
 * @param {{ value: string, onChange: (periodId: string) => void }} props
 */
export default function PeriodFilter({ value, onChange }) {
  const name = useId()
  return (
    <fieldset>
      <legend className="mb-1 text-sm text-slate-600">Período</legend>
      <div className="flex flex-col gap-2 sm:flex-row">
        {HISTORY_PERIODS.map((period) => {
          const selected = period.id === value
          return (
            <label
              key={period.id}
              className={`relative inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-4 py-2 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600 ${
                selected
                  ? 'border-2 border-brand-600 bg-brand-50 font-semibold text-slate-900'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={period.id}
                checked={selected}
                onChange={() => onChange(period.id)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              {selected && <IconCheckCircle className="h-4 w-4" />}
              {period.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
