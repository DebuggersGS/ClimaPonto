import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../hooks/useAuth.js'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'

/**
 * Rota protegida da área administrativa.
 *
 * Esconde a interface de quem não é admin. NÃO é uma barreira de segurança:
 * mesmo que alguém contorne esta verificação no navegador, o RLS do banco
 * recusa as operações.
 */
export default function RequireAdmin() {
  const { status, isAdmin, signOut } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <p role="status" className="text-slate-600">
        Verificando sessão…
      </p>
    )
  }

  if (status === 'unavailable') {
    return (
      <Card title="Área administrativa indisponível">
        <p>O Supabase não está configurado nesta instalação. Consulte o README.</p>
      </Card>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdmin) {
    return (
      <Card title="Acesso restrito">
        <p>Esta conta não tem permissão para acessar a área administrativa.</p>
        <Button variant="secondary" className="mt-4" onClick={signOut}>
          Sair
        </Button>
      </Card>
    )
  }

  return <Outlet />
}
