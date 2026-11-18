import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { HEADROOM_THRESHOLD, HEADROOM_TOP_ZONE, nextHeadroomState } from './headroom.js'

describe('nextHeadroomState', () => {
  it('perto do topo o cabeçalho sempre aparece, mesmo rolando para baixo', () => {
    assert.deepEqual(nextHeadroomState({ hidden: true, lastY: 0, y: HEADROOM_TOP_ZONE }), { hidden: false, lastY: HEADROOM_TOP_ZONE })
  })

  it('rolar para baixo além da zona do topo esconde; rolar para cima mostra', () => {
    const down = nextHeadroomState({ hidden: false, lastY: 100, y: 300 })
    assert.deepEqual(down, { hidden: true, lastY: 300 })
    const up = nextHeadroomState({ ...down, y: 250 })
    assert.deepEqual(up, { hidden: false, lastY: 250 })
  })

  it('ignora movimentos menores que o limiar (sem tremulação) e não avança a referência', () => {
    const state = { hidden: true, lastY: 400 }
    assert.deepEqual(nextHeadroomState({ ...state, y: 400 - (HEADROOM_THRESHOLD - 1) }), state)
    assert.deepEqual(nextHeadroomState({ hidden: false, lastY: 400, y: 400 + HEADROOM_THRESHOLD - 1 }), { hidden: false, lastY: 400 })
  })

  it('valores inválidos ou negativos (rolagem elástica) contam como topo', () => {
    assert.equal(nextHeadroomState({ hidden: true, lastY: 500, y: -40 }).hidden, false)
    assert.equal(nextHeadroomState({ hidden: true, lastY: 500, y: Number.NaN }).hidden, false)
  })
})
