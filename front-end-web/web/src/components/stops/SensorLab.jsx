import ConnectivityBadge from '../ui/ConnectivityBadge.jsx'

/**
 * Laboratório de sensores (demonstração): só no modo mock (scenarios != null).
 * Lista o que cada cenário MOCK demonstra e a conectividade CALCULADA a partir
 * da última leitura carregada do ponto (regra provisória), nunca um valor fixo.
 * @param {{ scenarios: Array<{ id: string, title: string, demonstrates: string, code: string }>|null, items: object[] }} props
 */
export default function SensorLab({ scenarios, items }) {
  if (!scenarios) return null
  const byCode = new Map(items.map((item) => [item.stop.code, item]))
  return (
    <details className="mt-8 rounded-card bg-surface p-4 shadow-card ring-1 ring-slate-900/5">
      <summary className="min-h-10 cursor-pointer text-base font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-600">
        Laboratório de sensores (demonstração)
      </summary>
      <p className="mt-2 text-sm text-slate-600">
        Cenários simulados do modo mock, para conferir os estados da interface. Não são medições reais.
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {scenarios.map((scenario) => (
          <li key={scenario.id} className="rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-inset ring-slate-900/5">
            <p className="font-semibold text-slate-900">
              {scenario.title} <span className="font-mono text-xs font-normal text-slate-700">({scenario.code})</span>
            </p>
            <p className="mt-1 text-slate-700">{scenario.demonstrates}</p>
            <div className="mt-2">
              <ConnectivityBadge status={byCode.get(scenario.code)?.connectivity.status ?? 'unknown'} />
            </div>
          </li>
        ))}
      </ul>
    </details>
  )
}
