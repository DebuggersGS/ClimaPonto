import { Component } from 'react'
import { Link } from 'react-router'
import { TriangleAlert } from 'lucide-react'

/**
 * Barreira de erro por rota: uma exceção de renderização numa página não derruba o app inteiro
 * (antes a árvore toda era desmontada e sobrava só o fundo, a "tela preta"). O shell (barra lateral,
 * cabeçalho) continua funcionando e o erro segue no console com a pilha completa, sem ser escondido.
 * Quem usa passa `key={pathname}`: ao navegar para outra rota a barreira recomeça limpa.
 */
export default class RouteErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[rota] erro ao renderizar a página', error, info?.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <section
        role="alert"
        aria-labelledby="erro-rota-titulo"
        className="mx-auto mt-6 max-w-xl rounded-card bg-surface p-6 text-center shadow-card ring-1 ring-slate-900/10"
      >
        <TriangleAlert aria-hidden="true" className="mx-auto h-8 w-8 text-amber-700 dark:text-amber-300" />
        <h1 id="erro-rota-titulo" className="mt-3 text-xl font-semibold text-slate-900">
          Esta página encontrou um erro
        </h1>
        <p className="mt-2 text-sm text-slate-700">
          O restante do ClimaPonto continua disponível. Tente carregar a página de novo ou volte ao início.
        </p>
        <p className="mt-2 break-words font-mono text-xs text-slate-600">{String(error?.message ?? error)}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="inline-flex min-h-10 items-center rounded-full bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Tentar novamente
          </button>
          <Link
            to="/"
            className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium text-slate-800 ring-1 ring-slate-300 hover:bg-slate-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Ir para a visão geral
          </Link>
        </div>
      </section>
    )
  }
}
