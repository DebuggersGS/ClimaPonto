import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function HistoryPage() {
  useDocumentTitle('Histórico')

  return (
    <>
      <PageHeader
        title="Histórico"
        description="Registro das leituras de temperatura e umidade ao longo do tempo."
      />
      <EmptyState
        title="Nenhuma leitura registrada"
        message="O histórico será preenchido quando a coleta de dados estiver integrada."
      />
    </>
  )
}
