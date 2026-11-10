import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import FeedbackMessage from '../components/ui/FeedbackMessage.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import TextField from '../components/ui/TextField.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

const DEFAULT_REDIRECT = '/admin/pontos'

export default function AdminLoginPage() {
  useDocumentTitle('Entrar')
  const { status, isAdmin, sessionExpired, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? DEFAULT_REDIRECT

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated' && isAdmin && !submitting) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Área administrativa" description="Acesso restrito à equipe do ClimaPonto." />

      {status === 'unavailable' ? (
        <FeedbackMessage tone="error">
          O Supabase não está configurado nesta instalação. Consulte o README.
        </FeedbackMessage>
      ) : (
        <Card>
          {sessionExpired && !error && (
            <FeedbackMessage tone="info">Sua sessão expirou. Entre novamente para continuar.</FeedbackMessage>
          )}
          <FeedbackMessage tone="error">{error}</FeedbackMessage>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <TextField
              label="E-mail"
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <TextField
              label="Senha"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || status === 'loading' || !email.trim() || !password}
            >
              {submitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-4 text-xs text-slate-500">
            Não há cadastro público. Contas administrativas são criadas pela equipe.
          </p>
        </Card>
      )}
    </div>
  )
}
