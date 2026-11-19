import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { getConnectivity } from '../../utils/connectivity.js'
import { HISTORY_LIMIT, getPeriodStart } from '../../utils/historyPeriods.js'
import { PLAUSIBLE_RANGES, normalizeReading } from '../../utils/readings.js'
import { MOCK_SCENARIOS, MOCK_SEED, createMockDataset, mulberry32 } from './mockDataset.js'

const DAY_MS = 24 * 60 * 60 * 1000
const AGORA = new Date('2026-11-12T15:07:30.500Z')

const EXPECTED_SCENARIOS = ['normal', 'attention', 'critical', 'no_data', 'delayed', 'offline', 'long_history', 'demo']

const dataset = createMockDataset({ now: AGORA })

function rowsOf(scenarioId) {
  const scenario = MOCK_SCENARIOS.find((item) => item.id === scenarioId)
  return dataset.readingsByStopId[scenario.stopId]
}

function stopOf(scenarioId) {
  const scenario = MOCK_SCENARIOS.find((item) => item.id === scenarioId)
  return dataset.stops.find((stop) => stop.id === scenario.stopId)
}

function latestOf(scenarioId) {
  return rowsOf(scenarioId)[0]
}

describe('mulberry32', () => {
  it('a mesma semente produz a mesma sequência, em [0, 1)', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 20; i += 1) {
      const value = a()
      assert.equal(value, b())
      assert.ok(value >= 0 && value < 1)
    }
  })

  it('sementes diferentes produzem sequências diferentes', () => {
    assert.notEqual(mulberry32(1)(), mulberry32(2)())
  })
})

describe('createMockDataset: determinismo', () => {
  it('mesma semente e mesmo "agora" geram exatamente o mesmo resultado', () => {
    assert.deepEqual(createMockDataset({ now: AGORA, seed: MOCK_SEED }), createMockDataset({ now: AGORA.getTime() }))
  })

  it('semente diferente muda os valores', () => {
    const outro = createMockDataset({ now: AGORA, seed: MOCK_SEED + 1 })
    assert.notDeepEqual(outro.readingsByStopId, dataset.readingsByStopId)
  })

  it('o mesmo instante gera o mesmo valor em consultas feitas em momentos diferentes', () => {
    const depois = createMockDataset({ now: AGORA.getTime() + 60 * 60 * 1000 })
    const antes = new Map(rowsOf('normal').map((row) => [row.measured_at, row]))
    const comuns = depois.readingsByStopId['mock-stop-normal'].filter((row) => antes.has(row.measured_at))
    assert.ok(comuns.length > 100)
    for (const row of comuns) assert.deepEqual(row, antes.get(row.measured_at))
  })

  it('o código-fonte não usa Math.random nem Date.now (pureza)', () => {
    const codigo = readFileSync(new URL('./mockDataset.js', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    assert.doesNotMatch(codigo, /Math\.random/)
    assert.doesNotMatch(codigo, /Date\.now/)
    assert.doesNotMatch(codigo, /new Date\(\s*\)/)
  })

  it('exige "agora" injetado', () => {
    assert.throws(() => createMockDataset({}), TypeError)
    assert.throws(() => createMockDataset({ now: Number.NaN }), TypeError)
  })
})

describe('createMockDataset: pontos e cenários', () => {
  it('cobre exatamente os 8 cenários, cada um com um ponto de id estável', () => {
    assert.deepEqual(
      dataset.scenarios.map((scenario) => scenario.id),
      EXPECTED_SCENARIOS,
    )
    assert.equal(dataset.stops.length, 8)
    assert.equal(new Set(dataset.stops.map((stop) => stop.id)).size, 8)
    for (const scenario of dataset.scenarios) {
      assert.equal(scenario.stopId, `mock-stop-${scenario.id}`)
      assert.ok(stopOf(scenario.id))
      assert.ok(scenario.demonstrates.length > 0)
    }
  })

  it('pontos têm código, nome, bairro e coordenadas plausíveis para São Paulo', () => {
    const codes = new Set()
    for (const stop of dataset.stops) {
      assert.match(stop.code, /^MOCK-\d{2}$/)
      assert.ok(stop.name.length > 0 && stop.neighborhood.length > 0)
      assert.ok(stop.latitude > -24.1 && stop.latitude < -23.3, `latitude ${stop.latitude}`)
      assert.ok(stop.longitude > -46.9 && stop.longitude < -46.3, `longitude ${stop.longitude}`)
      assert.equal(stop.active, true)
      codes.add(stop.code)
    }
    assert.equal(codes.size, 8)
  })

  it('pontos têm as mesmas colunas da tabela stops', () => {
    const colunas = ['id', 'code', 'name', 'neighborhood', 'description', 'latitude', 'longitude', 'is_demo', 'active', 'created_at', 'updated_at']
    for (const stop of dataset.stops) assert.deepEqual(Object.keys(stop).sort(), [...colunas].sort())
  })

  it('só o ponto demonstrativo tem is_demo = true', () => {
    assert.equal(stopOf('demo').is_demo, true)
    for (const id of EXPECTED_SCENARIOS.filter((item) => item !== 'demo')) assert.equal(stopOf(id).is_demo, false)
  })
})

describe('createMockDataset: linhas de leitura', () => {
  const todas = Object.values(dataset.readingsByStopId).flat()

  it('linhas de readings usam snake_case e as colunas da tabela', () => {
    const colunas = ['id', 'stop_id', 'temperature_c', 'humidity_pct', 'environmental_status', 'source', 'measured_at', 'received_at']
    for (const row of todas) assert.deepEqual(Object.keys(row).sort(), [...colunas].sort())
  })

  it('linhas de últimas leituras usam as colunas da view stop_latest_readings', () => {
    const colunas = ['stop_id', 'reading_id', 'temperature_c', 'humidity_pct', 'environmental_status', 'source', 'measured_at', 'received_at']
    assert.equal(dataset.latestReadings.length, 7)
    for (const row of dataset.latestReadings) assert.deepEqual(Object.keys(row).sort(), [...colunas].sort())
  })

  it('a última leitura de cada ponto coincide com a linha mais recente do histórico', () => {
    for (const row of dataset.latestReadings) {
      const historico = dataset.readingsByStopId[row.stop_id][0]
      assert.equal(row.reading_id, historico.id)
      assert.equal(row.measured_at, historico.measured_at)
    }
  })

  it('todas as linhas passam por normalizeReading sem descarte', () => {
    assert.ok(todas.length > 0)
    for (const row of [...todas, ...dataset.latestReadings]) assert.notEqual(normalizeReading(row), null)
    assert.equal(new Set(todas.map((row) => row.id)).size, todas.length)
  })

  it('temperatura e umidade ficam dentro de PLAUSIBLE_RANGES (sem valores nulos)', () => {
    for (const row of todas) {
      const { temperatureC, humidityPct } = normalizeReading(row)
      assert.ok(temperatureC !== null && temperatureC >= PLAUSIBLE_RANGES.temperatureC.min && temperatureC <= PLAUSIBLE_RANGES.temperatureC.max)
      assert.ok(humidityPct !== null && humidityPct >= PLAUSIBLE_RANGES.humidityPct.min && humidityPct <= PLAUSIBLE_RANGES.humidityPct.max)
    }
  })

  it('source é somente simulation ou test, nunca sensor', () => {
    const origens = new Set(todas.map((row) => row.source))
    for (const origem of origens) assert.ok(['simulation', 'test'].includes(origem), origem)
    assert.ok(origens.has('simulation'))
    assert.ok(origens.has('test'))
  })

  it('o ponto crítico tem temperatura alta e o normal, moderada', () => {
    for (const row of rowsOf('critical')) {
      assert.ok(row.temperature_c >= 36 && row.temperature_c <= 41, `crítico: ${row.temperature_c}`)
    }
    for (const row of rowsOf('normal')) assert.ok(row.temperature_c < 33, `normal: ${row.temperature_c}`)
  })

  it('há variação diurna: o histórico de 24 h não é constante', () => {
    const valores = rowsOf('normal').slice(0, 144).map((row) => row.temperature_c)
    assert.ok(Math.max(...valores) - Math.min(...valores) > 3)
  })

  it('as linhas vêm ordenadas da mais recente à mais antiga, sem instantes repetidos', () => {
    for (const rows of Object.values(dataset.readingsByStopId)) {
      for (let i = 1; i < rows.length; i += 1) {
        assert.ok(Date.parse(rows[i - 1].measured_at) > Date.parse(rows[i].measured_at))
      }
    }
  })

  it('nenhuma leitura está no futuro e received_at não precede measured_at', () => {
    for (const row of todas) {
      assert.ok(Date.parse(row.measured_at) <= AGORA.getTime())
      assert.ok(Date.parse(row.received_at) >= Date.parse(row.measured_at))
    }
  })
})

describe('createMockDataset: estado por cenário', () => {
  it('o ponto "sem dados" não tem leituras', () => {
    assert.deepEqual(rowsOf('no_data'), [])
    assert.ok(!dataset.latestReadings.some((row) => row.stop_id === 'mock-stop-no_data'))
    assert.equal(getConnectivity(null, AGORA).status, 'no_data')
  })

  it('a última leitura está online nos cenários normal, atenção, crítico, histórico longo e demonstrativo', () => {
    for (const id of ['normal', 'attention', 'critical', 'long_history', 'demo']) {
      assert.equal(getConnectivity(latestOf(id).measured_at, AGORA).status, 'online', id)
    }
  })

  it('a última leitura do ponto atrasado está atrasada e a do offline está offline', () => {
    assert.equal(getConnectivity(latestOf('delayed').measured_at, AGORA).status, 'delayed')
    assert.equal(getConnectivity(latestOf('offline').measured_at, AGORA).status, 'offline')
  })

  it('o estado ambiental registrado é fixo: normal, atenção e crítico', () => {
    assert.equal(latestOf('normal').environmental_status, 'normal')
    assert.equal(latestOf('attention').environmental_status, 'attention')
    assert.equal(latestOf('critical').environmental_status, 'critical')
    for (const row of rowsOf('critical')) assert.equal(row.environmental_status, 'critical')
  })

  it('as leituras do ponto demonstrativo têm origem Teste', () => {
    assert.ok(rowsOf('demo').every((row) => row.source === 'test'))
  })
})

describe('createMockDataset: cobertura e volume', () => {
  const comDados = EXPECTED_SCENARIOS.filter((id) => id !== 'no_data')

  it('pontos com dados cobrem pelo menos 7 dias', () => {
    for (const id of comDados) {
      const maisAntiga = Date.parse(rowsOf(id).at(-1).measured_at)
      assert.ok(AGORA.getTime() - maisAntiga >= 7 * DAY_MS, id)
    }
  })

  it('o ponto de histórico longo cobre 30 dias', () => {
    const maisAntiga = Date.parse(rowsOf('long_history').at(-1).measured_at)
    assert.ok(AGORA.getTime() - maisAntiga >= 30 * DAY_MS)
  })

  it('o total de linhas é limitado e o histórico longo cabe em HISTORY_LIMIT nos 30 dias', () => {
    const inicio = Date.parse(getPeriodStart('30d', AGORA))
    const em30dias = rowsOf('long_history').filter((row) => Date.parse(row.measured_at) >= inicio)
    assert.ok(em30dias.length > 300 && em30dias.length <= HISTORY_LIMIT, `linhas em 30 dias: ${em30dias.length}`)
    for (const rows of Object.values(dataset.readingsByStopId)) assert.ok(rows.length <= HISTORY_LIMIT + 50)
  })

  it('a cadência é mais densa no recente: 24 h tem mais linhas por hora que o restante', () => {
    const rows = rowsOf('normal')
    const corte24h = AGORA.getTime() - DAY_MS
    const recentes = rows.filter((row) => Date.parse(row.measured_at) >= corte24h).length
    assert.ok(recentes >= 140 && recentes <= 146, `últimas 24 h: ${recentes}`)
  })
})
