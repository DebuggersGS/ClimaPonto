import { useMemo } from 'react'
import { useNow } from '../../hooks/useNow.js'
import { getPeriodStart } from '../../utils/historyPeriods.js'
import { computeReadingQuality } from '../../utils/readingQuality.js'

function formatGap(ms) {
  if (ms === null) return 'não há duas leituras para medir lacunas'
  const minutes = Math.round(ms / 60000)
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

/**
 * Qualidade das medições do ponto no período (regra provisória, descrita em texto).
 * @param {{ readings: object[], periodId: string, discardedCount: number, truncated: boolean }} props
 */
export default function ReadingQuality({ readings, periodId, discardedCount, truncated }) {
  const now = useNow()
  const quality = useMemo(
    () => computeReadingQuality(readings, { start: getPeriodStart(periodId, now), end: now, discarded: discardedCount }),
    [readings, periodId, now, discardedCount],
  )
  const rows = [
    ['Leituras válidas', quality.valid],
    ['Leituras descartadas por invalidez', quality.discarded === null ? 'não informado pela fonte' : quality.discarded],
    ['Leituras esperadas (estimativa)', quality.expected ?? 'indisponível'],
    [
      'Completude estimada',
      quality.completenessPct === null
        ? 'indisponível'
        : `${Math.round(quality.completenessPct)}%${quality.exceedsExpected ? ' (acima do esperado pelo intervalo provisório)' : ''}`,
    ],
    ['Maior lacuna entre leituras', formatGap(quality.largestGapMs)],
    ['Lacunas acima do limite offline', quality.gapsAboveOffline],
  ]
  return (
    <div>
      {truncated && <p className="mb-2">Só as leituras mais recentes foram carregadas; a completude pode estar subestimada.</p>}
      <dl className="space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-wrap justify-between gap-x-3">
            <dt>{label}</dt>
            <dd className="font-medium tabular-nums text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 break-words text-slate-600">{quality.ruleText}</p>
    </div>
  )
}
