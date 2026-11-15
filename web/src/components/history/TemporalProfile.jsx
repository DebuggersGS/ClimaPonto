import { useMemo } from 'react'
import { formatHumidity, formatTemperature } from '../../utils/formatters.js'
import { buildHourlyProfile, buildWeekdayProfile } from '../../utils/temporalProfiles.js'

function bucketText(bucket) {
  const count = `${bucket.readingCount} ${bucket.readingCount === 1 ? 'leitura' : 'leituras'}`
  const temperature = bucket.temperature.count
    ? `temperatura média ${formatTemperature(bucket.temperature.avg)} (mín. ${formatTemperature(bucket.temperature.min)}, máx. ${formatTemperature(bucket.temperature.max)})`
    : 'sem temperatura'
  const humidity = bucket.humidity.count ? `umidade média ${formatHumidity(bucket.humidity.avg)}` : 'sem umidade'
  return `${count}; ${temperature}; ${humidity}`
}

function Highlight({ highlight }) {
  if (highlight.insufficient) return <p className="mb-2">{highlight.reason}</p>
  return (
    <p className="mb-2">
      Maior temperatura média: <strong>{highlight.hottest.label}</strong> ({formatTemperature(highlight.hottest.temperature.avg)}). Menor:{' '}
      <strong>{highlight.coolest.label}</strong> ({formatTemperature(highlight.coolest.temperature.avg)}). Descrição das leituras carregadas, sem previsão.
    </p>
  )
}

/**
 * Perfil descritivo por horário do dia ou por dia da semana (America/Sao_Paulo).
 * Alternativa em texto: cada faixa com leituras vira um item de lista.
 * @param {{ readings: object[], kind: 'hour'|'weekday' }} props
 */
export default function TemporalProfile({ readings, kind }) {
  const profile = useMemo(() => (kind === 'hour' ? buildHourlyProfile(readings) : buildWeekdayProfile(readings)), [readings, kind])
  const filled = profile.buckets.filter((bucket) => !bucket.empty)
  return (
    <div>
      <p className="mb-2 text-slate-600">Fuso America/Sao_Paulo; considera só as leituras filtradas.</p>
      <Highlight highlight={profile.highlight} />
      {filled.length === 0 ? (
        <p>Nenhuma leitura para calcular o perfil.</p>
      ) : (
        <ul className="space-y-1">
          {filled.map((bucket) => (
            <li key={bucket.key} className="break-words">
              <strong>{bucket.label}</strong>: {bucketText(bucket)}
            </li>
          ))}
        </ul>
      )}
      {kind === 'hour' && <p className="mt-2 text-slate-600">{24 - filled.length} faixas sem leituras não são listadas.</p>}
    </div>
  )
}
