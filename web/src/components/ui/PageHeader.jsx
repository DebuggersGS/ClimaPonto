export default function PageHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
      {description && <p className="mt-1 max-w-2xl text-slate-600">{description}</p>}
    </div>
  )
}
