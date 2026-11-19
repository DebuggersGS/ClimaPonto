import { useState } from 'react'
import Button from '../ui/Button.jsx'
import FeedbackMessage from '../ui/FeedbackMessage.jsx'
import { IconRefresh } from '../ui/icons.jsx'
import { formatTimeWithZone } from '../../utils/formatters.js'

/**
 * Controle de atualização do Dashboard (pensado para o hero escuro).
 * O horário "Atualizado às ..." fica visível, mas NÃO está em região aria-live:
 * mudaria a cada ciclo de atualização automática e o leitor de tela anunciaria
 * isso o tempo todo. A região aria-live (oculta) anuncia só o resultado de uma
 * atualização manual e a recuperação após erro; falhas já são anunciadas pelo
 * FeedbackMessage (role=alert).
 * @param {{ lastUpdatedAt: Date|number|string|null, isRefreshing: boolean, isStale: boolean,
 *   error: Error|string|null, onRefresh: () => void, source: string }} props
 */
export default function RefreshControl({ lastUpdatedAt, isRefreshing, isStale, error, onRefresh, source }) {
  const [manualPending, setManualPending] = useState(false)
  const [previousRefreshing, setPreviousRefreshing] = useState(isRefreshing)
  const [announcement, setAnnouncement] = useState('')
  const [hadError, setHadError] = useState(Boolean(error))

  const updatedText = lastUpdatedAt ? `Atualizado às ${formatTimeWithZone(lastUpdatedAt)}` : 'Ainda não atualizado'

  // Ajuste de estado durante a renderização: detecta o fim de uma consulta manual.
  if (previousRefreshing !== isRefreshing) {
    setPreviousRefreshing(isRefreshing)
    if (!isRefreshing && manualPending) {
      setManualPending(false)
      setAnnouncement(error ? '' : updatedText)
    }
  }

  // Recuperação: o erro some (ex.: atualização automática bem-sucedida).
  if (hadError !== Boolean(error)) {
    setHadError(Boolean(error))
    if (!error) setAnnouncement(`Dados atualizados novamente. ${updatedText}`)
  }

  function handleRefresh() {
    setManualPending(true)
    setAnnouncement('')
    onRefresh()
  }

  const errorMessage = error ? (typeof error === 'string' ? error : error.message) : null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        <p className="text-sm font-medium text-on-ink-muted">{updatedText}</p>
        <Button variant="secondary" onClick={handleRefresh} disabled={isRefreshing}>
          <IconRefresh className={`h-4 w-4 ${isRefreshing ? 'motion-safe:animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando…' : 'Atualizar agora'}
        </Button>
        <span className="sr-only" aria-live="polite">
          {announcement}
        </span>
      </div>
      {source === 'mock' && (
        <p className="text-sm text-on-ink-muted lg:text-right">
          Não há atualização automática: os pontos demonstrativos locais não têm leituras.
        </p>
      )}
      {(error || isStale) && (
        <FeedbackMessage tone={error ? 'error' : 'info'} className="mb-0 text-left">
          Os dados exibidos podem estar desatualizados.
          {errorMessage ? ` ${errorMessage}` : ''}
        </FeedbackMessage>
      )}
    </div>
  )
}
