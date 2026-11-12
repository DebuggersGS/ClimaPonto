const HEADINGS = { 2: 'h2', 3: 'h3' }

/**
 * Cartão de métrica. Valor '—' indica indisponível e ganha texto para leitores de tela.
 * @param {{ label: string, value: string, description?: string, headingLevel?: 2|3 }} props
 */
export default function MetricCard({ label, value, description, headingLevel = 3 }) {
  const Heading = HEADINGS[headingLevel] ?? 'h3'
  const unavailable = value === '—'
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <Heading className="text-sm font-normal text-slate-600">{label}</Heading>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
        {value}
        {unavailable && <span className="sr-only"> indisponível</span>}
      </p>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    </section>
  )
}
