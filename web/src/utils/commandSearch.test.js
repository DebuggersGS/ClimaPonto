import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { COMMAND_RESULTS_LIMIT, buildCommandResults } from './commandSearch.js'

const pages = [
  { to: '/', label: 'Dashboard' },
  { to: '/pontos', label: 'Pontos' },
  { to: '/historico', label: 'Histórico' },
]
const stops = [
  { code: 'MOCK-01', name: 'Av. Paulista × Rua da Consolação', neighborhood: 'Consolação' },
  { code: 'MOCK-02', name: 'Praça da Sé', neighborhood: 'Sé' },
  { code: 'MOCK-10', name: 'Terminal Sacomã', neighborhood: 'Sacomã' },
  { code: 'MOCK-11', name: 'Estação Pinheiros', neighborhood: 'Pinheiros' },
]
const ids = (results) => results.map((r) => r.id)

describe('buildCommandResults', () => {
  it('consulta vazia lista páginas e depois pontos, na ordem recebida', () => {
    for (const q of ['', '   ', null, undefined]) {
      assert.deepEqual(ids(buildCommandResults(q, { pages, stops })), ['/', '/pontos', '/historico', 'MOCK-01', 'MOCK-02', 'MOCK-10', 'MOCK-11'])
    }
  })

  it('sem fontes devolve lista vazia', () => {
    assert.deepEqual(buildCommandResults('x'), [])
    assert.deepEqual(buildCommandResults('', { pages: null, stops: null }), [])
  })

  it('ignora acentos e caixa em página, nome e bairro', () => {
    assert.deepEqual(ids(buildCommandResults('HISTORICO', { pages, stops })), ['/historico'])
    assert.deepEqual(ids(buildCommandResults('se', { pages, stops })), ['MOCK-02'])
    assert.deepEqual(ids(buildCommandResults('consolacao', { pages, stops })), ['MOCK-01'])
    assert.deepEqual(ids(buildCommandResults('praca', { pages, stops })), ['MOCK-02'])
  })

  it('busca por bairro encontra o ponto', () => {
    assert.deepEqual(ids(buildCommandResults('pinheiros', { pages, stops })), ['MOCK-11'])
  })

  it('código exato vem primeiro, antes de prefixos e de páginas', () => {
    const results = buildCommandResults('mock-1', { pages, stops })
    assert.deepEqual(ids(results), ['MOCK-11', 'MOCK-10'])
    const exact = buildCommandResults('MOCK-10', { pages, stops: [{ code: 'MOCK-100', name: 'A' }, ...stops] })
    assert.equal(exact[0].id, 'MOCK-10')
    const withPage = buildCommandResults('pontos', { pages, stops: [{ code: 'pontos', name: 'Z' }] })
    assert.deepEqual(ids(withPage), ['pontos', '/pontos'])
  })

  it('resultado de ponto leva à ficha por ?ponto= e traz descrição', () => {
    const [result] = buildCommandResults('MOCK-02', { pages, stops })
    assert.equal(result.kind, 'stop')
    assert.equal(result.to, '/pontos?ponto=MOCK-02')
    assert.equal(result.description, 'MOCK-02 · Sé')
    assert.equal(buildCommandResults('pontos', { pages, stops })[0].to, '/pontos')
  })

  it('ordem determinística: independe da ordem de entrada', () => {
    const sorted = ids(buildCommandResults('o', { pages, stops }))
    assert.deepEqual(ids(buildCommandResults('o', { pages, stops: [...stops].reverse() })), sorted)
    const shuffled = ids(buildCommandResults('mock', { stops: [...stops].reverse() }))
    assert.deepEqual(shuffled, ids(buildCommandResults('mock', { stops })))
  })

  it('respeita o limite, informado ou padrão', () => {
    assert.equal(buildCommandResults('', { pages, stops, limit: 3 }).length, 3)
    const many = Array.from({ length: 30 }, (_, i) => ({ code: `P-${i}`, name: `Ponto ${i}`, neighborhood: 'X' }))
    assert.equal(buildCommandResults('ponto', { stops: many }).length, COMMAND_RESULTS_LIMIT)
    assert.equal(buildCommandResults('ponto', { stops: many, limit: 0 }).length, COMMAND_RESULTS_LIMIT)
  })

  it('ignora pontos sem código e sem correspondência', () => {
    assert.deepEqual(buildCommandResults('zzz', { pages, stops }), [])
    assert.deepEqual(ids(buildCommandResults('', { stops: [null, { name: 'sem código' }, stops[0]] })), ['MOCK-01'])
  })
})
