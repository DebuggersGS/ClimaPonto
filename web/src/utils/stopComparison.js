import { summarizeSeries } from './readings.js'

const SOURCE_PRIORITY = ['sensor', 'simulation']
const FIELDS = ['temperatureC', 'humidityPct']

export const NOT_COMPARABLE_REASONS = {
  'same-stop': 'Escolha dois pontos diferentes.',
  'no-common-source': 'Os pontos não têm leituras de sensor ou de simulação na mesma origem.',
  'no-overlap': 'Os pontos não têm leituras no mesmo trecho de tempo.',
  'no-readings': 'Não há leituras com valor para comparar.',
}

const notComparable = (reason) => ({ status: 'not-comparable', reason, message: NOT_COMPARABLE_REASONS[reason] })

const bySource = (readings, source) => readings.filter((r) => r.source === source)
const bounds = (readings) => ({ start: Math.min(...readings.map((r) => r.measuredAtMs)), end: Math.max(...readings.map((r) => r.measuredAtMs)) })

function describeField(readings, field) {
  const { count, min, average, max } = summarizeSeries(readings, field)
  return { n: count, min, average, max }
}

/**
 * Compara as leituras de 2 pontos distintos no mesmo período, de forma descritiva.
 * Usa só uma origem comum (sensor, depois simulação; nunca mistura, nunca test/unknown),
 * recorta o trecho de tempo em que ambos têm leituras e ignora valores ausentes.
 * Sem limiar mínimo de amostra e sem previsão; não é classificação ambiental.
 * @param {{ stopId: string, readings: object[] }} a
 * @param {{ stopId: string, readings: object[] }} b
 * @returns {{ status: 'not-comparable', reason: string, message: string }
 *   | { status: 'comparable', source: string, isSimulation: boolean, from: number, to: number,
 *       fields: Record<string, { a: object, b: object, averageDifference: number|null }> }}
 */
export function compareStops(a, b) {
  if (!a?.stopId || !b?.stopId || a.stopId === b.stopId) return notComparable('same-stop')
  const source = SOURCE_PRIORITY.find((s) => bySource(a.readings ?? [], s).length > 0 && bySource(b.readings ?? [], s).length > 0)
  if (!source) return notComparable('no-common-source')

  const ra = bySource(a.readings, source)
  const rb = bySource(b.readings, source)
  const from = Math.max(bounds(ra).start, bounds(rb).start)
  const to = Math.min(bounds(ra).end, bounds(rb).end)
  if (from > to) return notComparable('no-overlap')

  const inRange = (r) => r.measuredAtMs >= from && r.measuredAtMs <= to
  const [sa, sb] = [ra.filter(inRange), rb.filter(inRange)]
  const fields = {}
  for (const field of FIELDS) {
    const fa = describeField(sa, field)
    const fb = describeField(sb, field)
    fields[field] = { a: fa, b: fb, averageDifference: fa.n && fb.n ? fa.average - fb.average : null }
  }
  if (FIELDS.every((f) => fields[f].a.n === 0 && fields[f].b.n === 0)) return notComparable('no-readings')
  return { status: 'comparable', source, isSimulation: source !== 'sensor', from, to, fields }
}
