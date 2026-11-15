import { Download } from 'lucide-react'
import { buildCsvFilename, buildReadingsCsv } from '../../utils/readingsCsv.js'

/**
 * Baixa as leituras exibidas como CSV; tudo acontece no navegador (Blob local).
 * Sem leituras, o botão não é renderizado.
 * @param {{ readings: object[], stop: { code: string, name: string }, periodId: string, originId: string }} props
 */
export default function ExportCsvButton({ readings, stop, periodId, originId }) {
  if (readings.length === 0) return null

  function handleClick() {
    const csv = buildReadingsCsv(readings, stop)
    if (csv === null) return
    // BOM para o Excel reconhecer UTF-8 (acentos).
    const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = buildCsvFilename(stop.code, periodId, originId)
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-card hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <Download aria-hidden="true" className="h-4 w-4" />
      Exportar CSV
    </button>
  )
}
