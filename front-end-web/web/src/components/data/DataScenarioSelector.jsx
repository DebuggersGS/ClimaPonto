import SegmentedControl from '../ui/SegmentedControl.jsx'
import { useDataScenario } from '../../hooks/useDataScenario.js'
import { DATA_SCENARIO_INFO } from '../../utils/dataScenario.js'

const OPTIONS = [
  { value: 'observado', label: DATA_SCENARIO_INFO.observado.label },
  { value: 'demonstrativo', label: DATA_SCENARIO_INFO.demonstrativo.label },
]

/**
 * Seletor "Dados observados | Cenários demonstrativos". Só aparece quando há
 * escolha real (build com Supabase); nos demais builds não há o que alternar
 * e o selo "Demonstrativo" já informa a natureza dos dados. O estado ativo é
 * texto em negrito + indicador (SegmentedControl), nunca só cor.
 * Trocar recarrega a página para não misturar os conjuntos.
 */
export default function DataScenarioSelector({ className }) {
  const { scenario, canSwitch, setScenario } = useDataScenario()
  if (!canSwitch) return null
  return (
    <SegmentedControl
      label="Conjunto de dados exibido"
      options={OPTIONS}
      value={scenario}
      onChange={setScenario}
      className={className}
    />
  )
}
