import { Link } from 'react-router'
import { IconChart } from './icons.jsx'

/**
 * Link para o histórico de um ponto.
 * @param {{ code: string, children?: import('react').ReactNode, period?: string }} props
 */
export default function StopHistoryLink({ code, children = 'Ver histórico', period }) {
  const query = `ponto=${encodeURIComponent(code)}${period ? `&periodo=${encodeURIComponent(period)}` : ''}`
  return (
    <Link
      to={`/historico?${query}`}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-brand-700 dark:text-brand-200 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
    >
      <IconChart />
      {children}
    </Link>
  )
}
