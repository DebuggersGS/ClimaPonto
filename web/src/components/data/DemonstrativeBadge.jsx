import Badge from '../ui/Badge.jsx'
import { useDataScenario } from '../../hooks/useDataScenario.js'
import { DATA_SCENARIO_INFO } from '../../utils/dataScenario.js'

/**
 * Selo permanente "Demonstrativo" (ícone + texto) enquanto os cenários
 * demonstrativos estiverem em uso, em qualquer rota. Não aparece nos dados
 * observados. A descrição completa fica no `title` e no texto para leitores
 * de tela.
 */
export default function DemonstrativeBadge({ className }) {
  const { isDemonstrative } = useDataScenario()
  if (!isDemonstrative) return null
  const { badgeLabel, description } = DATA_SCENARIO_INFO.demonstrativo
  return (
    <span title={description} className={className}>
      <Badge tone="demo" icon="Sparkles" size="sm">
        {badgeLabel}
        <span className="sr-only">. {description}</span>
      </Badge>
    </span>
  )
}
