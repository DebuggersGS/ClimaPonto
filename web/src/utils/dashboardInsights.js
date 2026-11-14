import { getConnectivity } from './connectivity.js'
import { formatHumidity, formatTemperature } from './formatters.js'
import { ENVIRONMENTAL_STATUS_LABELS, normalizeEnvironmentalStatus } from './readings.js'

/**
 * Insights do Dashboard: determinísticos, explicáveis e sem limiares novos.
 * Nunca derivam estado ambiental de temperatura/umidade: só mostram o estado
 * GRAVADO e comparações entre pontos.
 *
 * @typedef {object} DashboardInsight
 * @property {string} id identificador estável
 * @property {string} title
 * @property {string} text resultado, em português
 * @property {string} explanation como o resultado foi calculado
 */

const STATUS_ORDER = ['normal', 'attention', 'critical', 'unclassified']

const unitsOf = (count) => (count === 1 ? '1 ponto' : `${count} pontos`)

function compareCode(a, b) {
  const x = String(a.stop?.code ?? '')
  const y = String(b.stop?.code ?? '')
  return x < y ? -1 : x > y ? 1 : 0
}

function describeStop(item) {
  const { code, name } = item.stop ?? {}
  return [name, code && `(${code})`].filter(Boolean).join(' ') || 'ponto sem nome'
}

function environmentalDistribution(withReading) {
  const counts = Object.fromEntries(STATUS_ORDER.map((key) => [key, 0]))
  for (const { reading } of withReading) counts[normalizeEnvironmentalStatus(reading.environmentalStatus)] += 1
  const parts = STATUS_ORDER.filter((key) => counts[key] > 0).map((key) => `${ENVIRONMENTAL_STATUS_LABELS[key]}: ${counts[key]}`)
  return {
    id: 'environmental-distribution',
    title: 'Estados ambientais gravados',
    text: `${parts.join('; ')}.`,
    explanation:
      `Conta o estado ambiental gravado na última leitura de cada um dos ${unitsOf(withReading.length)} com leitura. ` +
      'O estado vem do banco; não é recalculado a partir de temperatura ou umidade.',
  }
}

/**
 * Maior e menor valor entre pontos. Empate: menor código primeiro.
 * Devolve null com menos de 2 pontos com valor.
 */
function extremesInsight({ id, title, field, format, label }, withReading) {
  const valued = withReading.filter(({ reading }) => reading[field] !== null && reading[field] !== undefined)
  if (valued.length < 2) return null
  const byDesc = [...valued].sort((a, b) => b.reading[field] - a.reading[field] || compareCode(a, b))
  const byAsc = [...valued].sort((a, b) => a.reading[field] - b.reading[field] || compareCode(a, b))
  const [max, min] = [byDesc[0], byAsc[0]]
  const same = max.reading[field] === min.reading[field]
  const text = same
    ? `Os ${valued.length} pontos com valor registram ${format(max.reading[field])}.`
    : `Maior: ${format(max.reading[field])} em ${describeStop(max)}. Menor: ${format(min.reading[field])} em ${describeStop(min)}.`
  return {
    id,
    title,
    text: `${text} Comparação entre pontos; não é classificação ambiental.`,
    explanation:
      `Compara a ${label} da última leitura de ${valued.length} pontos com valor (leituras sem o valor são ignoradas). ` +
      'Empates são desempatados pelo código do ponto, em ordem crescente.',
  }
}

function staleInsight(items, now, options) {
  const stale = items.filter(({ reading }) => {
    const status = getConnectivity(reading?.measuredAt ?? null, now, options).status
    return status === 'offline' || status === 'no_data'
  })
  return {
    id: 'stale-stops',
    title: 'Pontos sem leitura recente',
    text: stale.length === 0 ? 'Nenhum ponto está offline ou sem dados.' : `${unitsOf(stale.length)} offline ou sem dados.`,
    explanation:
      `Soma os pontos com conectividade "Offline" ou "Sem dados" pela regra de conectividade existente, ` +
      `considerando ${unitsOf(items.length)} no instante informado.`,
  }
}

function simulationInsight(withReading) {
  const nonSensor = withReading.filter(({ reading }) => reading.source !== 'sensor')
  if (nonSensor.length === 0) return null
  return {
    id: 'simulation-data',
    title: 'Há leituras que não são medição real',
    text: `${unitsOf(nonSensor.length)} com última leitura de simulação, teste ou origem desconhecida; não tratar como medição real.`,
    explanation: 'Conta as últimas leituras cuja origem não é "sensor".',
  }
}

/**
 * Gera os insights do Dashboard. Mesma entrada produz mesma saída.
 * Sem nenhuma leitura devolve um único item `insufficient-data`.
 * Ordem: distribuição, temperatura, umidade, sem leitura recente, simulação.
 * @param {{ items?: Array<{ stop: object, reading: object|null }> }|Array<{ stop: object, reading: object|null }>|null|undefined} summaryOrItems
 *   resultado de summarizeDashboard ou seus `items`
 * @param {Date|number} now instante atual (parâmetro, nunca Date.now())
 * @param {{ sendIntervalMs?: number }} [options]
 * @returns {DashboardInsight[]}
 */
export function buildDashboardInsights(summaryOrItems, now, { sendIntervalMs } = {}) {
  const source = Array.isArray(summaryOrItems) ? summaryOrItems : summaryOrItems?.items
  const items = (Array.isArray(source) ? source : []).filter((item) => item && typeof item === 'object')
  const withReading = items.filter(({ reading }) => reading)

  if (withReading.length === 0) {
    return [
      {
        id: 'insufficient-data',
        title: 'Dados insuficientes',
        text: 'Ainda não há leituras para gerar insights.',
        explanation: 'Os insights usam a última leitura de cada ponto; nenhum ponto possui leitura.',
      },
    ]
  }

  return [
    environmentalDistribution(withReading),
    extremesInsight(
      { id: 'temperature-extremes', title: 'Temperatura: maior e menor', field: 'temperatureC', format: formatTemperature, label: 'temperatura' },
      withReading,
    ),
    extremesInsight(
      { id: 'humidity-extremes', title: 'Umidade: maior e menor', field: 'humidityPct', format: formatHumidity, label: 'umidade' },
      withReading,
    ),
    staleInsight(items, now, { sendIntervalMs }),
    simulationInsight(withReading),
  ].filter(Boolean)
}
