import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ADMIN_NAV_ITEM, getNavItems, PUBLIC_NAV_ITEMS } from './navItems.js'

describe('getNavItems', () => {
  it('visitante vê as seis seções públicas, sem Administração', () => {
    const labels = getNavItems(false).map((item) => item.label)
    assert.deepEqual(labels, ['Visão geral', 'Explorar', 'Análises', 'Histórico', 'Laboratório', 'Relatórios'])
  })

  it('admin recebe Administração como último item', () => {
    const items = getNavItems(true)
    assert.equal(items.length, PUBLIC_NAV_ITEMS.length + 1)
    assert.equal(items.at(-1), ADMIN_NAV_ITEM)
    assert.equal(ADMIN_NAV_ITEM.to, '/admin/pontos')
  })

  it('rotas e rótulos são únicos, e as rotas antigas continuam na navegação', () => {
    const items = getNavItems(true)
    assert.equal(new Set(items.map((item) => item.to)).size, items.length)
    assert.equal(new Set(items.map((item) => item.label)).size, items.length)
    for (const rota of ['/', '/pontos', '/historico']) assert.ok(items.some((item) => item.to === rota))
  })
})
