/**
 * Seletor de ponto monitorado; value é o code do ponto.
 * @param {{ stops: Array<{ code: string, name: string }>, value: string, onChange: (code: string) => void, id: string, label?: string }} props
 */
export default function StopSelect({ stops, value, onChange, id, label = 'Ponto monitorado' }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-slate-600">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <option value="">Selecione um ponto</option>
        {stops.map((stop) => (
          <option key={stop.code} value={stop.code}>
            {stop.code} — {stop.name}
          </option>
        ))}
      </select>
    </div>
  )
}
