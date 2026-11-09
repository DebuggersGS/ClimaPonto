const LABELS = {
  supabase: 'Fonte: banco de dados (Supabase)',
  local: 'Fonte: dados locais do protótipo',
}

/** Indica de onde vêm os dados exibidos na página. */
export default function DataSourceBadge({ source }) {
  return (
    <p className="mb-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      {LABELS[source] ?? 'Fonte desconhecida'}
    </p>
  )
}
