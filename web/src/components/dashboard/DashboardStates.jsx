import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import { getDataModeInfo } from '../../utils/dataMode.js'

/** Skeleton com a forma final do Dashboard (métricas, última medição, cartões). */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton shape="text" rows={1} label="Carregando o Dashboard…" className="max-w-xs" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <Skeleton shape="metric" label="" />
          </Card>
        ))}
      </div>
      <div aria-hidden="true">
        <Skeleton shape="chart" label="" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index}>
            <Skeleton shape="text" rows={4} label="" />
          </Card>
        ))}
      </div>
    </div>
  )
}

/** Erro com role="alert" e ação de nova tentativa. */
export function DashboardError({ title, message, onRetry }) {
  return (
    <div role="alert">
      <EmptyState
        variant="error"
        title={title}
        message={message}
        action={
          <Button variant="secondary" onClick={onRetry}>
            Tentar novamente
          </Button>
        }
      />
    </div>
  )
}

export function UnconfiguredState() {
  return (
    <EmptyState
      variant="warning"
      title="Supabase não configurado"
      message={getDataModeInfo('unconfigured').description}
    />
  )
}

export function NoStopsState() {
  return (
    <EmptyState
      title="Nenhum ponto monitorado"
      message="Não há pontos ativos visíveis. Cadastre ou ative um ponto na área administrativa para acompanhá-lo aqui."
    />
  )
}
