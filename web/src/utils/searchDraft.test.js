import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createSearchDraft, reconcileSearchDraft, recordTyping } from './searchDraft.js'

const trim = (value) => value.trim()

describe('rascunho de busca sincronizado com a URL', () => {
  it('digitação rápida com a URL atrasada não perde letras', () => {
    let state = createSearchDraft('')
    for (const value of ['m', 'mo', 'moc', 'mock']) state = recordTyping(state, value, trim)
    // a URL chega atrasada, valor por valor: nenhum eco substitui o rascunho
    for (const echo of ['m', 'mo', 'moc', 'mock']) state = reconcileSearchDraft(state, echo) ?? state
    assert.equal(state.draft, 'mock')
    assert.deepEqual(state.pending, [])
  })

  it('a URL pode pular ecos intermediários (navegações agrupadas)', () => {
    let state = createSearchDraft('')
    for (const value of ['b', 'ba', 'bat']) state = recordTyping(state, value, trim)
    state = reconcileSearchDraft(state, 'ba') ?? state
    assert.equal(state.draft, 'bat')
    assert.deepEqual(state.pending, ['bat'])
  })

  it('mudança externa (Limpar filtros, voltar) substitui o rascunho', () => {
    let state = recordTyping(createSearchDraft(''), 'batata', trim)
    state = reconcileSearchDraft(state, 'batata') ?? state
    state = reconcileSearchDraft(state, '')
    assert.deepEqual(state, { seen: '', pending: [], draft: '' })
  })

  it('espaços digitados nas pontas continuam no campo enquanto a URL guarda o texto aparado', () => {
    let state = recordTyping(createSearchDraft(''), 'av ', trim)
    state = reconcileSearchDraft(state, 'av') ?? state
    assert.equal(state.draft, 'av ')
  })

  it('sem mudança na URL não há novo estado', () => {
    assert.equal(reconcileSearchDraft(createSearchDraft('x'), 'x'), null)
  })
})
