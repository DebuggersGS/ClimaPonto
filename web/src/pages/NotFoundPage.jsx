import { Link } from 'react-router'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function NotFoundPage() {
  useDocumentTitle('Página não encontrada')

  return (
    <>
      <PageHeader title="Página não encontrada" description="O endereço acessado não existe." />
      <Link to="/" className="font-medium text-brand-700 underline hover:text-brand-900">
        Voltar para o Dashboard
      </Link>
    </>
  )
}
