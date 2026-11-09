import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useStops } from '../hooks/useStops.js'

export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { stops, isLoading, error } = useStops()

  let stopsSummary = `${stops.length} pontos demonstrativos cadastrados.`
  if (isLoading) stopsSummary = 'Carregando pontos…'
  if (error) stopsSummary = 'Não foi possível carregar os pontos.'

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral das condições ambientais nos pontos de ônibus monitorados."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Pontos">
          <p aria-live="polite">{stopsSummary}</p>
        </Card>
        <Card title="Temperatura e umidade">
          <p>Sem leituras disponíveis. A integração com os sensores ainda não foi implementada.</p>
        </Card>
        <Card title="Alertas">
          <p>Os estados ambientais (ex.: calor extremo) serão exibidos aqui em etapa futura.</p>
        </Card>
      </div>
    </>
  )
}
