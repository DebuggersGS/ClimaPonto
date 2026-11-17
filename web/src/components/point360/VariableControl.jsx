import { VARIABLES } from '../../utils/stopInsights.js'
import SegmentedControl from '../ui/SegmentedControl.jsx'

const OPTIONS = Object.entries(VARIABLES).map(([value, { label }]) => ({ value, label }))

/** Escolha da variável (temperatura ou umidade) usada no gráfico de medições e na comparação. */
export default function VariableControl({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">Variável</span>
      <SegmentedControl label="Variável exibida" options={OPTIONS} value={value} onChange={onChange} />
    </div>
  )
}
