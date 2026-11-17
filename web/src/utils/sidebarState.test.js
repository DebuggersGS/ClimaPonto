import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  SIDEBAR_GROUP_KEY,
  SIDEBAR_PIN_KEY,
  readSidebarOpenGroup,
  readSidebarPinned,
  writeSidebarOpenGroup,
  writeSidebarPinned,
} from './sidebarState.js'

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
  }
}

const broken = {
  getItem() {
    throw new Error('indisponível')
  },
  setItem() {
    throw new Error('cota')
  },
  removeItem() {
    throw new Error('indisponível')
  },
}

describe('preferência pin', () => {
  it('ida e volta', () => {
    const storage = memoryStorage()
    assert.equal(readSidebarPinned(storage), false)
    assert.equal(writeSidebarPinned(storage, true), true)
    assert.equal(readSidebarPinned(storage), true)
    writeSidebarPinned(storage, false)
    assert.equal(readSidebarPinned(storage, true), false)
  })

  it('valor inválido usa o fallback', () => {
    assert.equal(readSidebarPinned(memoryStorage({ [SIDEBAR_PIN_KEY]: 'talvez' }), true), true)
  })

  it('storage ausente ou que lança não quebra', () => {
    for (const storage of [null, undefined, broken]) {
      assert.equal(readSidebarPinned(storage, true), true)
      assert.equal(writeSidebarPinned(storage, true), false)
    }
  })
})

describe('grupo aberto', () => {
  it('ida e volta e limpeza', () => {
    const storage = memoryStorage()
    assert.equal(readSidebarOpenGroup(storage), null)
    assert.equal(writeSidebarOpenGroup(storage, 'analise'), true)
    assert.equal(readSidebarOpenGroup(storage), 'analise')
    writeSidebarOpenGroup(storage, null)
    assert.equal(readSidebarOpenGroup(storage), null)
  })

  it('rejeita grupo desconhecido, vazio ou longo demais', () => {
    assert.equal(readSidebarOpenGroup(memoryStorage({ [SIDEBAR_GROUP_KEY]: 'x' }), ['analise']), null)
    assert.equal(readSidebarOpenGroup(memoryStorage({ [SIDEBAR_GROUP_KEY]: 'a'.repeat(100) })), null)
    assert.equal(writeSidebarOpenGroup(memoryStorage(), ''), false)
    assert.equal(writeSidebarOpenGroup(memoryStorage(), 'a'.repeat(100)), false)
  })

  it('storage ausente ou que lança não quebra', () => {
    for (const storage of [null, undefined, broken]) {
      assert.equal(readSidebarOpenGroup(storage), null)
      assert.equal(writeSidebarOpenGroup(storage, 'analise'), false)
      assert.equal(writeSidebarOpenGroup(storage, null), false)
    }
  })
})
