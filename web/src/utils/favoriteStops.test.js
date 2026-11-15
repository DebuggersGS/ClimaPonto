import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { FAVORITES_LIMIT, parseFavorites, serializeFavorites, toggleFavorite } from './favoriteStops.js'

describe('parseFavorites', () => {
  it('lê uma lista válida', () => {
    assert.deepEqual(parseFavorites('["MOCK-01","MOCK-02"]'), ['MOCK-01', 'MOCK-02'])
  })

  it('valor ausente, JSON inválido ou que não é array resulta em lista vazia, sem exceção', () => {
    for (const raw of [null, undefined, '', '{', 'abc', '{"a":1}', '"MOCK-01"', '42', 'null', 7, {}]) {
      assert.deepEqual(parseFavorites(raw), [], String(raw))
    }
  })

  it('descarta itens que não são string, vazios e duplicatas', () => {
    assert.deepEqual(parseFavorites('["A",1,null,{"x":1},["B"],"A"," ","B ","B"]'), ['A', 'B'])
  })

  it('limita o excesso', () => {
    const raw = JSON.stringify(Array.from({ length: FAVORITES_LIMIT + 20 }, (_, i) => `P-${i}`))
    const list = parseFavorites(raw)
    assert.equal(list.length, FAVORITES_LIMIT)
    assert.equal(list[0], 'P-0')
  })
})

describe('toggleFavorite', () => {
  it('adiciona e remove sem mutar a entrada', () => {
    const base = ['A']
    const added = toggleFavorite(base, 'B')
    assert.deepEqual(added, ['A', 'B'])
    assert.deepEqual(base, ['A'])
    assert.deepEqual(toggleFavorite(added, 'A'), ['B'])
  })

  it('ignora código inválido e entrada que não é lista', () => {
    assert.deepEqual(toggleFavorite(['A'], ''), ['A'])
    assert.deepEqual(toggleFavorite(['A'], null), ['A'])
    assert.deepEqual(toggleFavorite(null, 'A'), ['A'])
  })

  it('com a lista cheia não adiciona, mas ainda permite remover', () => {
    const full = Array.from({ length: FAVORITES_LIMIT }, (_, i) => `P-${i}`)
    assert.equal(toggleFavorite(full, 'NOVO').length, FAVORITES_LIMIT)
    assert.equal(toggleFavorite(full, 'P-0').length, FAVORITES_LIMIT - 1)
  })
})

describe('serializeFavorites', () => {
  it('serializa só códigos saneados e faz ida e volta', () => {
    const text = serializeFavorites(['A', 'A', 3, 'B'])
    assert.equal(text, '["A","B"]')
    assert.deepEqual(parseFavorites(text), ['A', 'B'])
    assert.equal(serializeFavorites(undefined), '[]')
  })
})
