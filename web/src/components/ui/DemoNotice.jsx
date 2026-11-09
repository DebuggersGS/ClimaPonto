export default function DemoNotice() {
  return (
    <aside
      role="note"
      aria-label="Aviso sobre os dados"
      className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <strong className="font-semibold">Dados demonstrativos.</strong> Esta é uma versão inicial do
      protótipo: as informações exibidas são fictícias e ainda não vêm dos sensores ESP32.
    </aside>
  )
}
