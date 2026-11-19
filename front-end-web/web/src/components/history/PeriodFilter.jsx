import { HISTORY_PERIODS } from '../../utils/historyPeriods.js'
import SegmentedControl from '../ui/SegmentedControl.jsx'

const OPTIONS = HISTORY_PERIODS.map((period) => ({ value: period.id, label: period.shortLabel }))

/**
 * Filtro de período (24 h / 7 dias / 30 dias) com indicador animado.
 * O período ativo fica no texto visível ("Período:") e em aria-pressed.
 * @param {{ value: string, onChange: (periodId: string) => void }} props
 */
export default function PeriodFilter({ value, onChange }) {
  const current = HISTORY_PERIODS.find((period) => period.id === value)
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">
        Período<span className="sr-only">: {current?.label}</span>
      </span>
      <SegmentedControl label="Período do histórico" options={OPTIONS} value={value} onChange={onChange} />
    </div>
  )
}
