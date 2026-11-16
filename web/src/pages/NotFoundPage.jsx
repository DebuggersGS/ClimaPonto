import { Link } from 'react-router'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function NotFoundPage() {
  useDocumentTitle('Página não encontrada')

  return (
    <>
      <PageHeader title="Página não encontrada" />
      <EmptyState
        variant="info"
        title="Este endereço não existe"
        message="O link pode estar incorreto ou a página foi movida."
        action={
          <Link
            to="/"
            className="inline-flex min-h-10 items-center rounded-full bg-linear-to-b from-brand-600 to-brand-700 px-4 py-2 text-sm font-medium text-white shadow-card hover:from-brand-700 hover:to-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Voltar para a Visão geral
          </Link>
        }
      />
    </>
  )
}
