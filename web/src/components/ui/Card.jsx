/**
 * Cartão com título opcional.
 * @param {{ title?: string, children?: import('react').ReactNode, className?: string, headingLevel?: 2|3 }} props
 */
export default function Card({ title, children, className = '', headingLevel = 2 }) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {title && <Heading className="mb-2 text-base font-semibold text-slate-900">{title}</Heading>}
      <div className="text-sm text-slate-600">{children}</div>
    </section>
  )
}
