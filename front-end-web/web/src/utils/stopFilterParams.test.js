import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  EMPTY_STOP_FILTERS,
  countActiveFilters,
  parseStopFilterParams,
  serializeStopFilterParams,
} from './stopFilterParams.js'

describe('parseStopFilterParams', () => {
  it('sem parâmetros devolve filtros vazios', () => {
    for (const input of [undefined, null, '', new URLSearchParams()]) {
      assert.deepEqual(parseStopFilterParams(input), EMPTY_STOP_FILTERS)
    }
  })

  it('lê todos os filtros', () => {
    const filters = parseStopFilterParams('q=paulista&bairro=Bela%20Vista&ambiente=critical&conexao=online&favoritos=1')
    assert.deepEqual(filters, {
      text: 'paulista',
      neighborhood: 'Bela Vista',
      environmental: 'critical',
      connectivity: 'online',
      favoritesOnly: true,
    })
  })

  it('ignora valores desconhecidos e favoritos diferentes de 1', () => {
    const filters = parseStopFilterParams('ambiente=perigo&conexao=quase&favoritos=sim')
    assert.equal(filters.environmental, '')
    assert.equal(filters.connectivity, '')
    assert.equal(filters.favoritesOnly, false)
  })

  it('limita o tamanho do texto', () => {
    assert.equal(parseStopFilterParams(`q=${'a'.repeat(500)}`).text.length, 100)
  })
})

describe('serializeStopFilterParams', () => {
  it('preserva outros parâmetros e não muta a entrada', () => {
    const original = new URLSearchParams('dados=demonstracao&q=velho')
    const next = serializeStopFilterParams(original, { text: 'sé', environmental: 'normal' })
    assert.equal(next.get('dados'), 'demonstracao')
    assert.equal(next.get('q'), 'sé')
    assert.equal(next.get('ambiente'), 'normal')
    assert.equal(original.get('q'), 'velho')
  })

  it('filtro vazio remove a chave', () => {
    const next = serializeStopFilterParams('q=x&bairro=Sé&favoritos=1&dados=demo', EMPTY_STOP_FILTERS)
    assert.equal(next.toString(), 'dados=demo')
  })

  it('valores inválidos não são gravados', () => {
    const next = serializeStopFilterParams('', { environmental: 'x', connectivity: 'y', favoritesOnly: 'true' })
    assert.equal(next.toString(), '')
  })

  it('ida e volta preserva os filtros', () => {
    const filters = { text: 'a b', neighborhood: 'Sé', environmental: 'attention', connectivity: 'offline', favoritesOnly: true }
    assert.deepEqual(parseStopFilterParams(serializeStopFilterParams('', filters)), filters)
  })
})

describe('countActiveFilters', () => {
  it('conta só filtros ativos', () => {
    assert.equal(countActiveFilters(), 0)
    assert.equal(countActiveFilters(EMPTY_STOP_FILTERS), 0)
    assert.equal(countActiveFilters({ text: '  ', neighborhood: 'Sé', favoritesOnly: true }), 2)
    assert.equal(countActiveFilters({ text: 'a', neighborhood: 'b', environmental: 'normal', connectivity: 'online', favoritesOnly: true }), 5)
  })
})
