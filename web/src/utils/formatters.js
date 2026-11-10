const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

/** Formata um timestamp UTC (ISO 8601) no horário de Brasília. */
export function formatDateTime(isoString) {
  if (!isoString) return '—'
  const date = new Date(isoString)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}
