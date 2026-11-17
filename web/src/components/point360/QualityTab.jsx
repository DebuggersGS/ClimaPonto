import { formatDateTimeWithZone, formatRelativeAge } from '../../utils/formatters.js'
import Card from '../ui/Card.jsx'
import ConnectivityBadge from '../ui/ConnectivityBadge.jsx'
import FeedbackMessage from '../ui/FeedbackMessage.jsx'
import ReadingSourceBadge from '../ui/ReadingSourceBadge.jsx'

const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const gapMinutes = (ms) => `${Math.round(ms / 60000)} min`

function Row({ label, children }) {
  return (
    <div className="grid gap-0.5 py-2 sm:grid-cols-[12rem_1fr] sm:gap-3">
      <dt className="font-medium text-slate-700">{label}</dt>
      <dd className="min-w-0 break-words text-slate-900">{children}</dd>
    </div>
  )
}

function Provenance({ stop, quality }) {
  const present = quality.sourceDistribution.filter((origin) => origin.count > 0)
  return (
    <Card title="Proveniência" headingLevel={3}>
      {present.length === 0 ? (
        <p>Sem leituras no período: não há origem a apresentar.</p>
      ) : (
        <ul className="space-y-2">
          {present.map((origin) => (
            <li key={origin.source} className="flex flex-wrap items-center gap-2">
              <ReadingSourceBadge source={origin.source} />
              <span className="tabular-nums text-slate-900">
                {origin.count} {origin.count === 1 ? 'leitura' : 'leituras'} ({percent.format(origin.pct)}%)
              </span>
            </li>
          ))}
        </ul>
      )}
      {stop.isDemo && <p className="mt-3">Este ponto é demonstrativo: seus dados e sua posição não representam um sensor real.</p>}
    </Card>
  )
}

/**
 * Qualidade dos dados: proveniência, amostras, lacunas, idade e narrativa
 * determinística (texto montado só com números já calculados; descreve, não classifica).
 */
export default function QualityTab({ stop, insights, now }) {
  const { quality, narrative } = insights
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Qualidade dos dados</h2>
      {quality.hasNonRealData && (
        <FeedbackMessage tone="info" className="mb-0">
          O recorte inclui dados que não são medição real (simulação, teste ou origem desconhecida).
        </FeedbackMessage>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Provenance stop={stop} quality={quality} />
        <Card title="Amostras, lacunas e idade" headingLevel={3}>
          <dl className="divide-y divide-slate-200">
            <Row label="Amostras">
              {quality.sampleCount} {quality.expectedCount !== null && `de ${quality.expectedCount} esperadas`}
              {quality.completenessPct !== null && ` (${percent.format(quality.completenessPct)}%)`}
            </Row>
            <Row label="Lacunas">
              {quality.gapCount === 0
                ? `Nenhuma acima de ${gapMinutes(quality.gapThresholdMs)}`
                : `${quality.gapCount} acima de ${gapMinutes(quality.gapThresholdMs)}; a maior tem ${gapMinutes(quality.largestGapMs)}`}
            </Row>
            <Row label="Última leitura">
              {quality.lastReadingAt
                ? `${formatDateTimeWithZone(quality.lastReadingAt)} (${formatRelativeAge(quality.lastReadingAt, now)})`
                : 'Sem leituras no período'}
            </Row>
            <Row label="Conectividade">
              <ConnectivityBadge status={quality.connectivity} />
            </Row>
          </dl>
          {quality.provisional && <p className="mt-3 text-xs">{quality.ruleText}</p>}
        </Card>
      </div>
      <Card title="Resumo do período" headingLevel={3}>
        <div className="space-y-2 text-slate-800">
          {narrative.map((sentence) => (
            <p key={sentence}>{sentence}</p>
          ))}
        </div>
      </Card>
    </div>
  )
}
