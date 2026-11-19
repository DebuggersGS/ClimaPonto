/**
 * Dataset MOCK determinístico do modo demonstração (VITE_DATA_MODE=mock).
 *
 * Tudo aqui é FICTÍCIO: pontos, leituras e estados são fixtures geradas por
 * função pura, sem aleatoriedade global nem relógio interno: o instante "agora" é sempre
 * parâmetro e cada valor depende só da semente, do ponto e do instante da
 * leitura. Assim, o mesmo instante gera o mesmo valor, mesmo em consultas
 * feitas em momentos diferentes.
 *
 * As linhas saem em snake_case, com as mesmas colunas de `stops`, `readings`
 * e da view `stop_latest_readings`, para passar pelos mesmos normalizadores
 * da fonte real. O `environmental_status` é um valor fixo de fixture por
 * cenário: o front-end não classifica leituras.
 */

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

/** Semente padrão do dataset. */
export const MOCK_SEED = 20261112

const FIXTURE_DATE = '2026-11-01T00:00:00Z'

/** Atraso entre a medição e o recebimento no servidor (fixture). */
const RECEIVED_DELAY_MS = 2000

/**
 * Grade de cadência por idade da leitura (relativa a "agora"): densa no
 * recente e espaçada no passado, o que mantém o histórico de 30 dias abaixo
 * de HISTORY_LIMIT linhas. Cada leitura cai num múltiplo absoluto do passo.
 */
const CADENCE_TIERS = [
  { maxAgeMs: DAY_MS, stepMs: 10 * MINUTE_MS },
  { maxAgeMs: 7 * DAY_MS, stepMs: HOUR_MS },
  { maxAgeMs: Infinity, stepMs: 3 * HOUR_MS },
]

/** Cobertura do histórico: 8 dias (> 7 d) para a maioria; 31 dias para o histórico longo. */
const DEFAULT_COVERAGE_MS = 8 * DAY_MS
const LONG_COVERAGE_MS = 31 * DAY_MS

/** Idade da última leitura por situação (SEND_INTERVAL_MS = 10 min: online até 20 min, offline acima de 50 min). */
const LATEST_AGE_ONLINE_MS = 0
const LATEST_AGE_DELAYED_MS = 30 * MINUTE_MS // entre 20 e 50 min: atrasado
const LATEST_AGE_OFFLINE_MS = 5 * HOUR_MS

/**
 * Cenários: um ponto fictício por cenário, com id estável.
 * temp/humidity: base, amplitude diurna e limites de segurança (clamp).
 */
export const MOCK_SCENARIOS = [
  {
    id: 'normal',
    title: 'Normal',
    demonstrates: 'Ponto online, estado ambiental normal e histórico completo.',
    stop: {
      code: 'MOCK-01',
      name: 'Av. Paulista × Rua da Consolação',
      neighborhood: 'Consolação',
      latitude: -23.5558,
      longitude: -46.662,
    },
    readings: { status: 'normal', source: 'simulation', latestAgeMs: LATEST_AGE_ONLINE_MS },
    profile: { tempBase: 25, tempAmp: 4, humBase: 62, humAmp: 12 },
  },
  {
    id: 'attention',
    title: 'Atenção',
    demonstrates: 'Ponto online com estado ambiental registrado como atenção (calor elevado).',
    stop: {
      code: 'MOCK-02',
      name: 'Largo da Batata',
      neighborhood: 'Pinheiros',
      latitude: -23.5669,
      longitude: -46.6918,
    },
    readings: { status: 'attention', source: 'simulation', latestAgeMs: LATEST_AGE_ONLINE_MS },
    profile: { tempBase: 31.5, tempAmp: 3, humBase: 48, humAmp: 10 },
  },
  {
    id: 'critical',
    title: 'Crítico',
    demonstrates: 'Ponto online com estado ambiental registrado como crítico (temperatura muito alta).',
    stop: {
      code: 'MOCK-03',
      name: 'Terminal Parque Dom Pedro II',
      neighborhood: 'Sé',
      latitude: -23.5446,
      longitude: -46.6275,
    },
    readings: { status: 'critical', source: 'simulation', latestAgeMs: LATEST_AGE_ONLINE_MS },
    profile: { tempBase: 38.5, tempAmp: 1.8, humBase: 34, humAmp: 6, tempMin: 36, tempMax: 41 },
  },
  {
    id: 'no_data',
    title: 'Sem dados',
    demonstrates: 'Ponto cadastrado que ainda não enviou nenhuma leitura.',
    stop: {
      code: 'MOCK-04',
      name: 'Av. Interlagos × Av. Pedro Bueno',
      neighborhood: 'Interlagos',
      latitude: -23.7036,
      longitude: -46.6997,
    },
    readings: null,
    profile: null,
  },
  {
    id: 'delayed',
    title: 'Conectividade atrasada',
    demonstrates: 'Última leitura há poucos minutos: conectividade atrasada, ainda não offline.',
    stop: {
      code: 'MOCK-05',
      name: 'Av. Sapopemba × Rua Conde de Sarzedas',
      neighborhood: 'Sapopemba',
      latitude: -23.612,
      longitude: -46.518,
    },
    readings: { status: 'normal', source: 'simulation', latestAgeMs: LATEST_AGE_DELAYED_MS },
    profile: { tempBase: 24, tempAmp: 3.5, humBase: 66, humAmp: 11 },
  },
  {
    id: 'offline',
    title: 'Offline',
    demonstrates: 'Última leitura há horas: ponto offline, com o estado ambiental registrado preservado.',
    stop: {
      code: 'MOCK-06',
      name: 'Terminal Jabaquara',
      neighborhood: 'Jabaquara',
      latitude: -23.6672,
      longitude: -46.641,
    },
    readings: { status: 'normal', source: 'simulation', latestAgeMs: LATEST_AGE_OFFLINE_MS },
    profile: { tempBase: 23, tempAmp: 3.5, humBase: 70, humAmp: 12 },
  },
  {
    id: 'long_history',
    title: 'Histórico longo',
    demonstrates: 'Ponto online com 30 dias de histórico, para conferir os períodos de 24 h, 7 dias e 30 dias.',
    stop: {
      code: 'MOCK-07',
      name: 'Av. Brigadeiro Faria Lima × Av. Juscelino Kubitschek',
      neighborhood: 'Itaim Bibi',
      latitude: -23.5855,
      longitude: -46.6873,
    },
    readings: { status: 'normal', source: 'simulation', latestAgeMs: LATEST_AGE_ONLINE_MS, coverageMs: LONG_COVERAGE_MS },
    profile: { tempBase: 26, tempAmp: 4.5, humBase: 58, humAmp: 13 },
  },
  {
    id: 'demo',
    title: 'Demonstrativo',
    demonstrates: 'Ponto marcado como demonstrativo (is_demo) com leituras de origem Teste.',
    stop: {
      code: 'MOCK-08',
      name: 'Praça Miguel Dell’Erba',
      neighborhood: 'Lapa',
      latitude: -23.5271,
      longitude: -46.7021,
      isDemo: true,
    },
    readings: { status: 'normal', source: 'test', latestAgeMs: LATEST_AGE_ONLINE_MS },
    profile: { tempBase: 27, tempAmp: 4, humBase: 55, humAmp: 12 },
  },
].map((scenario, index) => ({
  ...scenario,
  index,
  stopId: `mock-stop-${scenario.id}`,
}))

/** PRNG mulberry32: a mesma semente produz sempre a mesma sequência em [0, 1). */
export function mulberry32(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Mistura inteiros em uma semente de 32 bits (hash simples e estável). */
function mixSeed(...parts) {
  let hash = 0x9e3779b9
  for (const part of parts) {
    hash = Math.imul(hash ^ (part | 0), 0x85ebca6b)
    hash ^= hash >>> 13
    hash = Math.imul(hash, 0xc2b2ae35)
    hash ^= hash >>> 16
  }
  return hash >>> 0
}

const round1 = (value) => Math.round(value * 10) / 10
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/** Fase diurna em [-1, 1]: mínimo ~03h e máximo ~15h no horário de Brasília (UTC-3). */
function dayCycle(timestampMs) {
  const localHours = (timestampMs - 3 * HOUR_MS) / HOUR_MS
  return Math.sin(((localHours - 9) / 24) * 2 * Math.PI)
}

/** Deriva lenta de vários dias (frentes de calor e frio), em [-1, 1]. */
function slowDrift(timestampMs) {
  return Math.sin((timestampMs / DAY_MS / 6.5) * 2 * Math.PI)
}

/**
 * Temperatura e umidade de uma leitura: ciclo diurno suave + deriva lenta +
 * ruído que depende só de (semente, cenário, minuto). A umidade varia ao
 * contrário da temperatura.
 */
function measure(profile, seed, scenarioIndex, timestampMs) {
  const noise = mulberry32(mixSeed(seed, scenarioIndex, Math.floor(timestampMs / MINUTE_MS)))
  const cycle = dayCycle(timestampMs)
  const drift = slowDrift(timestampMs)
  const temperature = profile.tempBase + profile.tempAmp * cycle + 0.8 * drift + (noise() - 0.5) * 0.8
  const humidity = profile.humBase - profile.humAmp * cycle - 2 * drift + (noise() - 0.5) * 3
  return {
    temperatureC: round1(clamp(temperature, profile.tempMin ?? -Infinity, profile.tempMax ?? Infinity)),
    humidityPct: round1(clamp(humidity, 15, 95)),
  }
}

/**
 * Instantes das leituras de um ponto, do mais recente ao mais antigo: a
 * última leitura (anchor, alinhada ao minuto) e a grade de cadência anterior.
 */
function readingTimestamps(nowMs, anchorMs, coverageMs) {
  const timestamps = [anchorMs]
  let minAgeMs = 0
  for (const { maxAgeMs, stepMs } of CADENCE_TIERS) {
    const oldestMs = nowMs - Math.min(maxAgeMs, coverageMs)
    // Maior múltiplo do passo com idade estritamente maior que minAgeMs.
    for (let t = Math.floor((nowMs - minAgeMs - 1) / stepMs) * stepMs; t >= oldestMs; t -= stepMs) {
      if (t < anchorMs) timestamps.push(t)
    }
    minAgeMs = maxAgeMs
  }
  return timestamps
}

function buildReadingRows(scenario, nowMs, seed) {
  const { readings, profile, stopId } = scenario
  if (!readings) return []
  const anchorMs = Math.floor(nowMs / MINUTE_MS) * MINUTE_MS - readings.latestAgeMs
  const coverageMs = readings.coverageMs ?? DEFAULT_COVERAGE_MS

  return readingTimestamps(nowMs, anchorMs, coverageMs).map((timestampMs) => {
    const { temperatureC, humidityPct } = measure(profile, seed, scenario.index, timestampMs)
    return {
      id: `mock-reading-${scenario.id}-${timestampMs / MINUTE_MS}`,
      stop_id: stopId,
      temperature_c: temperatureC,
      humidity_pct: humidityPct,
      environmental_status: readings.status,
      source: readings.source,
      measured_at: new Date(timestampMs).toISOString(),
      received_at: new Date(timestampMs + RECEIVED_DELAY_MS).toISOString(),
    }
  })
}

function buildStopRow({ stop, stopId }) {
  return {
    id: stopId,
    code: stop.code,
    name: stop.name,
    neighborhood: stop.neighborhood,
    description: 'Ponto fictício do modo demonstração. Localização aproximada; não há sensor instalado.',
    latitude: stop.latitude,
    longitude: stop.longitude,
    is_demo: stop.isDemo === true,
    active: true,
    created_at: FIXTURE_DATE,
    updated_at: FIXTURE_DATE,
  }
}

/** Colunas da view stop_latest_readings (a chave da leitura vira reading_id). */
function toLatestRow({ id, ...rest }) {
  return { reading_id: id, ...rest }
}

/**
 * Gera o dataset mock para um instante.
 *
 * @param {{ now: Date|number, seed?: number }} options `now` é obrigatório (injetado)
 * @returns {{
 *   seed: number,
 *   scenarios: typeof MOCK_SCENARIOS,
 *   stops: object[],
 *   readingsByStopId: Record<string, object[]>,
 *   latestReadings: object[]
 * }} stops no formato da tabela `stops`; readingsByStopId (da mais recente à mais
 *   antiga) no formato de `readings`; latestReadings no formato de `stop_latest_readings`
 */
export function createMockDataset({ now, seed = MOCK_SEED }) {
  const nowMs = now instanceof Date ? now.getTime() : now
  if (!Number.isFinite(nowMs)) throw new TypeError('createMockDataset exige "now" (Date ou milissegundos).')

  const readingsByStopId = {}
  const latestReadings = []
  for (const scenario of MOCK_SCENARIOS) {
    const rows = buildReadingRows(scenario, nowMs, seed)
    readingsByStopId[scenario.stopId] = rows
    if (rows.length > 0) latestReadings.push(toLatestRow(rows[0]))
  }

  return {
    seed,
    scenarios: MOCK_SCENARIOS,
    stops: MOCK_SCENARIOS.map(buildStopRow),
    readingsByStopId,
    latestReadings,
  }
}
