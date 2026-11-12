import { useDataMode } from '../../hooks/useDataMode.js'

/** Sinalização persistente do modo de dados no shell. */
export default function DemoNotice() {
  const { mode, label, description } = useDataMode()
  const isSupabase = mode === 'supabase'

  return (
    <aside
      role="note"
      aria-label="Aviso sobre os dados"
      className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      {isSupabase ? (
        <>
          <strong className="font-semibold">Protótipo acadêmico.</strong> Leituras com origem Simulação ou Teste não são
          medições reais; a origem aparece em cada leitura.
        </>
      ) : (
        <>
          <strong className="font-semibold">{label}.</strong> {description}
        </>
      )}
    </aside>
  )
}
