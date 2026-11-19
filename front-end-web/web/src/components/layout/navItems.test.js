import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ADMIN_NAV_GROUP, ADMIN_NAV_ITEM, findActiveGroupId, getNavGroups, getNavItems, PUBLIC_NAV_ITEMS } from './navItems.js'

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

describe('getNavGroups', () => {
  it('visitante vê Explorar, Investigar e Compartilhar com os itens na ordem definida', () => {
    const groups = getNavGroups(false)
    assert.deepEqual(
      groups.map((group) => [group.label, group.items.map((item) => item.label)]),
      [
        ['Explorar', ['Visão geral', 'Explorar']],
        ['Investigar', ['Análises', 'Histórico', 'Laboratório']],
        ['Compartilhar', ['Relatórios']],
      ],
    )
  })

  it('admin ganha o grupo Operar, só com Administração, como último grupo', () => {
    const groups = getNavGroups(true)
    assert.equal(groups.length, 4)
    assert.equal(groups.at(-1), ADMIN_NAV_GROUP)
    assert.equal(ADMIN_NAV_GROUP.label, 'Operar')
    assert.deepEqual(ADMIN_NAV_GROUP.items, [ADMIN_NAV_ITEM])
    assert.ok(!getNavGroups(false).some((group) => group.id === 'operar'))
  })

  it('ids de grupo são únicos', () => {
    const ids = getNavGroups(true).map((group) => group.id)
    assert.equal(new Set(ids).size, ids.length)
  })
})

describe('findActiveGroupId', () => {
  const groups = getNavGroups(true)

  it('encontra o grupo da rota atual, inclusive em subrotas', () => {
    assert.equal(findActiveGroupId(groups, '/'), 'explorar')
    assert.equal(findActiveGroupId(groups, '/pontos/MOCK-01'), 'explorar')
    assert.equal(findActiveGroupId(groups, '/historico'), 'investigar')
    assert.equal(findActiveGroupId(groups, '/relatorios'), 'compartilhar')
    assert.equal(findActiveGroupId(groups, '/admin/pontos'), 'operar')
  })

  it('a raiz não casa com outras rotas e rota desconhecida devolve null', () => {
    assert.equal(findActiveGroupId(groups, '/qualquer'), null)
    assert.equal(findActiveGroupId(groups, '/pontosx'), null)
  })
})
