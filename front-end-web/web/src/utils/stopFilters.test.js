import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { filterStops, getStopFilterOptions, normalizeSearchText, resolveActiveFilters, shouldShowFilter } from './stopFilters.js'
import { summarizeDashboard } from './readings.js'

const NOW = Date.parse('2026-11-12T15:30:00Z')
const ago = (ms) => new Date(NOW - ms).toISOString()

const stops = [
  { id: 's1', code: 'SP-001', name: 'Praça da Sé', neighborhood: 'Sé' },
  { id: 's2', code: 'SP-002', name: 'Avenida Paulista', neighborhood: 'Bela Vista' },
  { id: 's3', code: 'SP-003', name: 'Largo São Francisco', neighborhood: 'se' },
  { id: 's4', code: 'SP-004', name: 'Terminal Sem Leitura', neighborhood: 'Itaim' },
]

const reading = (stopId, status, ageMs) => ({
  id: `r-${stopId}`, stopId, environmentalStatus: status, measuredAt: ago(ageMs), measuredAtMs: NOW - ageMs, source: 'sensor',
})

const summary = summarizeDashboard(
  stops,
  [reading('s1', 'critical', 1000), reading('s2', 'normal', 400000), reading('s3', null, 200000)],
  NOW,
)
const items = summary.items
const codes = (list) => list.map((i) => (i.stop ?? i).code)

describe('normalizeSearchText', () => {
  it('remove acentos, caixa e espaços nas pontas', () => {
    assert.equal(normalizeSearchText('  PRAÇA da Sé '), 'praca da se')
    assert.equal(normalizeSearchText(null), '')
    assert.equal(normalizeSearchText(undefined), '')
  })
})

describe('filterStops', () => {
  it('sem filtros ou texto vazio devolve todos, em nova lista', () => {
    for (const f of [undefined, {}, { text: '   ' }, { text: '', neighborhood: '', environmental: '', connectivity: '' }]) {
      const result = filterStops(stops, f, { now: NOW })
      assert.deepEqual(result, stops)
      assert.notEqual(result, stops)
    }
  })

  it('busca texto em nome, código e bairro sem acentos nem caixa', () => {
    assert.deepEqual(codes(filterStops(stops, { text: ' PRACA ' }, { now: NOW })), ['SP-001'])
    assert.deepEqual(codes(filterStops(stops, { text: 'sp-002' }, { now: NOW })), ['SP-002'])
    assert.deepEqual(codes(filterStops(stops, { text: 'bela' }, { now: NOW })), ['SP-002'])
    // "se" casa Sé, se e "Sem Leitura", na ordem original
    assert.deepEqual(codes(filterStops(stops, { text: 'se' }, { now: NOW })), ['SP-001', 'SP-003', 'SP-004'])
  })

  it('filtra por bairro ignorando acento e caixa (igualdade, não trecho)', () => {
    assert.deepEqual(codes(filterStops(stops, { neighborhood: 'SE' }, { now: NOW })), ['SP-001', 'SP-003'])
    assert.deepEqual(codes(filterStops(stops, { neighborhood: 'Bela' }, { now: NOW })), [])
  })

  it('filtra por estado gravado; nulo vira não classificado; sem leitura nunca casa', () => {
    assert.deepEqual(codes(filterStops(items, { environmental: 'critical' }, { now: NOW })), ['SP-001'])
    assert.deepEqual(codes(filterStops(items, { environmental: 'unclassified' }, { now: NOW })), ['SP-003'])
    assert.deepEqual(filterStops(stops, { environmental: 'unclassified' }, { now: NOW }), [])
  })

  it('filtra por conectividade existente, também para pontos simples', () => {
    assert.deepEqual(codes(filterStops(items, { connectivity: 'online' }, { now: NOW })), ['SP-001'])
    assert.deepEqual(codes(filterStops(items, { connectivity: 'offline' }, { now: NOW })), ['SP-002'])
    assert.deepEqual(codes(filterStops(items, { connectivity: 'delayed' }, { now: NOW })), ['SP-003'])
    assert.deepEqual(codes(filterStops(items, { connectivity: 'no_data' }, { now: NOW })), ['SP-004'])
    assert.equal(filterStops(stops, { connectivity: 'no_data' }, { now: NOW }).length, 4)
  })

  it('combina filtros com E lógico', () => {
    assert.deepEqual(codes(filterStops(items, { text: 'se', neighborhood: 'se', connectivity: 'online' }, { now: NOW })), ['SP-001'])
    assert.deepEqual(filterStops(items, { environmental: 'normal', connectivity: 'online' }, { now: NOW }), [])
  })

  it('preserva identidade dos objetos e não muta a entrada', () => {
    const copy = structuredClone(items)
    const result = filterStops(items, { connectivity: 'online' }, { now: NOW })
    assert.equal(result[0], items[0])
    assert.deepEqual(items, copy)
  })

  it('tolera entrada nula, vazia e itens sem dados', () => {
    assert.deepEqual(filterStops(null, { text: 'a' }, { now: NOW }), [])
    assert.deepEqual(filterStops([], {}, { now: NOW }), [])
    assert.deepEqual(filterStops([{ stop: null, reading: null }, {}], { text: 'a' }, { now: NOW }), [])
    assert.deepEqual(filterStops(stops, null, { now: NOW }), stops)
  })
})

describe('getStopFilterOptions', () => {
  it('lista só valores presentes, com contagem, em ordem estável', () => {
    const options = getStopFilterOptions(items, { now: NOW })
    assert.deepEqual(options.neighborhoods, [
      { value: 'Bela Vista', label: 'Bela Vista', count: 1 },
      { value: 'Itaim', label: 'Itaim', count: 1 },
      { value: 'Sé', label: 'Sé', count: 2 },
    ])
    assert.deepEqual(options.environmental.map((o) => [o.value, o.count]), [['normal', 1], ['critical', 1], ['unclassified', 1]])
    assert.deepEqual(options.connectivity.map((o) => [o.value, o.count]), [['online', 1], ['delayed', 1], ['offline', 1], ['no_data', 1]])
    assert.equal(options.environmental[0].label, 'Normal')
  })

  it('pontos simples não geram opção de estado ambiental', () => {
    const options = getStopFilterOptions(stops, { now: NOW })
    assert.deepEqual(options.environmental, [])
    assert.deepEqual(options.connectivity, [{ value: 'no_data', label: 'Sem dados', count: 4 }])
  })

  it('entrada vazia ou nula devolve listas vazias', () => {
    for (const input of [[], null, undefined]) {
      assert.deepEqual(getStopFilterOptions(input, { now: NOW }), { neighborhoods: [], environmental: [], connectivity: [] })
    }
  })

  it('ignora bairro vazio ou ausente', () => {
    const options = getStopFilterOptions([{ code: 'A', neighborhood: '  ' }, { code: 'B' }], { now: NOW })
    assert.deepEqual(options.neighborhoods, [])
  })
})

describe('shouldShowFilter e resolveActiveFilters', () => {
  const opt = (...values) => values.map((value) => ({ value, label: value, count: 1 }))
  const options = { neighborhoods: opt('Sé', 'Itaim'), environmental: opt('normal'), connectivity: opt('online') }

  it('mostra o filtro só com 2 ou mais valores', () => {
    assert.equal(shouldShowFilter('neighborhood', options), true)
    assert.equal(shouldShowFilter('environmental', options), false)
    assert.equal(shouldShowFilter('connectivity', options, {}), false)
  })

  it('mantém visível o filtro com valor ativo presente nas opções', () => {
    assert.equal(shouldShowFilter('connectivity', options, { connectivity: 'online' }), true)
  })

  it('não mostra filtro cujo valor ativo não existe mais', () => {
    assert.equal(shouldShowFilter('connectivity', options, { connectivity: 'offline' }), false)
  })

  it('resolveActiveFilters descarta valores ausentes e preserva os demais', () => {
    const input = { text: 'sé', neighborhood: 'se', environmental: 'critical', connectivity: 'online' }
    assert.deepEqual(resolveActiveFilters(input, options), { text: 'sé', neighborhood: 'se', environmental: '', connectivity: 'online' })
    assert.equal(input.environmental, 'critical')
  })
})

describe('filterStops: somente favoritos', () => {
  const favorites = ['SP-001', 'SP-002', 'SP-004']

  it('desligado (ou ausente) não altera o comportamento, mesmo com favoritos informados', () => {
    assert.deepEqual(filterStops(stops, {}, { now: NOW, favorites }), stops)
    assert.deepEqual(filterStops(stops, { favoritesOnly: false }, { now: NOW, favorites }), stops)
  })

  it('ligado mostra só os favoritos, nos dois formatos de item', () => {
    assert.deepEqual(codes(filterStops(stops, { favoritesOnly: true }, { now: NOW, favorites })), ['SP-001', 'SP-002', 'SP-004'])
    assert.deepEqual(codes(filterStops(items, { favoritesOnly: true }, { now: NOW, favorites: ['SP-003'] })), ['SP-003'])
  })

  it('sem favoritos informados, ligado resulta em lista vazia', () => {
    assert.deepEqual(filterStops(stops, { favoritesOnly: true }, { now: NOW }), [])
    assert.deepEqual(filterStops(stops, { favoritesOnly: true }, { now: NOW, favorites: [] }), [])
  })

  it('combina por E com texto, bairro, estado ambiental e conectividade', () => {
    const opts = { now: NOW, favorites }
    assert.deepEqual(codes(filterStops(items, { favoritesOnly: true, text: 'paulista' }, opts)), ['SP-002'])
    assert.deepEqual(codes(filterStops(items, { favoritesOnly: true, text: 'largo' }, opts)), [])
    assert.deepEqual(codes(filterStops(items, { favoritesOnly: true, neighborhood: 'itaim' }, opts)), ['SP-004'])
    assert.deepEqual(codes(filterStops(items, { favoritesOnly: true, environmental: 'critical' }, opts)), ['SP-001'])
    assert.deepEqual(codes(filterStops(items, { favoritesOnly: true, connectivity: 'no_data' }, opts)), ['SP-004'])
  })
})
