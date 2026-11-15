import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SAO_PAULO_BOUNDS, partitionStopsByCoordinates, projectStops } from './stopMap.js'

const stop = (code, latitude, longitude) => ({ code, latitude, longitude })
const codes = (list) => list.map((i) => (i.item ?? i).code ?? (i.item ?? i).stop.code)

describe('partitionStopsByCoordinates', () => {
  it('lista vazia, nula ou inválida resulta em grupos vazios', () => {
    for (const input of [[], null, undefined, 'x']) {
      assert.deepEqual(partitionStopsByCoordinates(input), { located: [], missing: [], outside: [] })
    }
  })

  it('separa válidos, sem coordenadas e fora da área, preservando a ordem', () => {
    const items = [
      stop('A', -23.55, -46.63),
      stop('B', null, null),
      stop('C', -22.9, -43.2), // Rio de Janeiro: válido no globo, fora de SP
      stop('D', -23.6, -46.7),
      stop('E', undefined, undefined),
    ]
    const result = partitionStopsByCoordinates(items)
    assert.deepEqual(codes(result.located), ['A', 'D'])
    assert.deepEqual(codes(result.missing), ['B', 'E'])
    assert.deepEqual(codes(result.outside), ['C'])
    assert.equal(result.located[0], items[0])
    assert.match(result.outside[0].reason, /fora da área/i)
  })

  it('par incompleto, string e NaN vão para "sem posição", com motivo', () => {
    const cases = [stop('P1', -23.55, null), stop('P2', null, -46.6), stop('S', '-23.55', '-46.63'), stop('N', NaN, -46.6), stop('I', -23.5, Infinity)]
    const { located, missing } = partitionStopsByCoordinates(cases)
    assert.equal(located.length, 0)
    assert.deepEqual(codes(missing), ['P1', 'P2', 'S', 'N', 'I'])
    assert.match(missing[0].reason, /incompletas/)
    assert.match(missing[2].reason, /não numéricas/)
  })

  it('fora de -90..90 / -180..180 nunca é posicionado', () => {
    const { located, missing, outside } = partitionStopsByCoordinates([stop('X', -91, -46.6), stop('Y', -23.5, 181), stop('Z', 95, -200)])
    assert.equal(located.length, 0)
    assert.equal(outside.length, 0)
    assert.match(missing[0].reason, /intervalo/)
    assert.equal(missing.length, 3)
  })

  it('aceita item do summarizeDashboard e item sem ponto', () => {
    const items = [{ stop: stop('A', -23.55, -46.63), reading: null }, { stop: null }, null]
    const { located, missing } = partitionStopsByCoordinates(items)
    assert.equal(located[0], items[0])
    assert.equal(missing.length, 2)
  })

  it('limites do retângulo são inclusivos', () => {
    const { minLat, maxLng } = SAO_PAULO_BOUNDS
    assert.equal(partitionStopsByCoordinates([stop('L', minLat, maxLng)]).located.length, 1)
  })
})

describe('projectStops', () => {
  const box = { width: 800, height: 520, padding: 40 }

  it('lista vazia devolve vazio', () => {
    assert.deepEqual(projectStops([], box), [])
    assert.deepEqual(projectStops(null, box), [])
  })

  it('um único ponto fica centralizado', () => {
    const [p] = projectStops([stop('A', -23.55, -46.63)], box)
    assert.equal(p.x, 400)
    assert.equal(p.y, 260)
  })

  it('é determinística, mantém a ordem e o objeto original', () => {
    const items = [stop('A', -23.5, -46.8), stop('B', -23.7, -46.4), stop('C', -23.6, -46.6)]
    const first = projectStops(items, box)
    assert.deepEqual(projectStops(items, box), first)
    assert.deepEqual(first.map((p) => p.item.code), ['A', 'B', 'C'])
    assert.equal(first[0].item, items[0])
  })

  it('norte fica acima, leste à direita e tudo dentro da margem', () => {
    const [north, south] = projectStops([stop('N', -23.4, -46.6), stop('S', -23.8, -46.6)], box)
    assert.ok(north.y < south.y)
    const [west, east] = projectStops([stop('W', -23.6, -46.8), stop('E', -23.6, -46.4)], box)
    assert.ok(west.x < east.x)
    for (const p of [north, south, west, east]) {
      assert.ok(p.x >= 40 && p.x <= 760 && p.y >= 40 && p.y <= 480, `${p.x},${p.y}`)
    }
  })

  it('corrige a proporção por cos(latitude) e não altera as coordenadas', () => {
    const items = [stop('A', -23.5, -46.8), stop('B', -23.7, -46.4)]
    const copy = structuredClone(items)
    const [a, b] = projectStops(items, { width: 1000, height: 1000, padding: 0 })
    const cos = Math.cos((-23.6 * Math.PI) / 180)
    const ratio = (b.x - a.x) / (b.y - a.y)
    assert.ok(Math.abs(Math.abs(ratio) - (0.4 * cos) / 0.2) < 1e-9)
    assert.deepEqual(items, copy)
  })

  it('pontos na mesma latitude ficam na linha central', () => {
    const [a, b] = projectStops([stop('A', -23.6, -46.8), stop('B', -23.6, -46.4)], box)
    assert.equal(a.y, 260)
    assert.equal(b.y, 260)
    assert.ok(a.x >= 40 && b.x <= 760 && a.x < b.x)
  })

  it('aceita itens do summarizeDashboard', () => {
    const [p] = projectStops([{ stop: stop('A', -23.55, -46.63), reading: null }], box)
    assert.equal(p.x, 400)
  })
})
