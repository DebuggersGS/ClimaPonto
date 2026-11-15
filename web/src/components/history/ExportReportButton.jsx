import { FileText } from 'lucide-react'
import { buildSummaryReportCsv, buildSummaryReportFilename } from '../../utils/readingsCsv.js'

/**
 * Baixa o relatório resumido (por dia e por hora) como CSV, gerado no navegador.
 * Sem leituras, o botão não é renderizado.
 * @param {{ readings: object[], stop: { code: string }, periodId: string }} props
 */
export default function ExportReportButton({ readings, stop, periodId }) {
  if (readings.length === 0) return null

  function handleClick() {
    const csv = buildSummaryReportCsv(readings, { stopCode: stop.code, period: periodId })
    if (csv === null) return
    const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = buildSummaryReportFilename(stop.code, periodId)
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-surface px-4 py-2 text-sm font-medium text-slate-900 shadow-card hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <FileText aria-hidden="true" className="h-4 w-4" />
      Exportar relatório (CSV)
    </button>
  )
}
