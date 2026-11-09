export default function Card({ title, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {title && <h2 className="mb-2 text-base font-semibold text-slate-900">{title}</h2>}
      <div className="text-sm text-slate-600">{children}</div>
    </section>
  )
}
