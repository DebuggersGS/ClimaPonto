import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildSparkline } from './sparkline.js'

describe('buildSparkline — entradas insuficientes', () => {
  it('devolve null para vazio, 1 valor ou só nulos', () => {
    assert.equal(buildSparkline([]), null)
    assert.equal(buildSparkline([20]), null)
    assert.equal(buildSparkline([null, 20, undefined, NaN]), null)
    assert.equal(buildSparkline([null, null, null]), null)
  })
})

describe('buildSparkline — lacunas', () => {
  it('null, NaN e Infinity quebram o trecho sem inventar pontos', () => {
    const s = buildSparkline([10, 20, null, 30, 40, NaN, 50, Infinity, 60, 70])
    assert.equal(s.segments.length, 4)
    assert.deepEqual(s.segments.map((t) => t.length), [2, 2, 1, 2])
    assert.equal(s.count, 7)
    assert.equal(s.paths.length, 3)
  })

  it('lacunas preservam a posição no eixo X', () => {
    const s = buildSparkline([1, null, 3], { width: 100, padding: 0 })
    assert.deepEqual(s.segments.map((t) => t.map((p) => p.x)), [[0], [100]])
  })

  it('ponto isolado vai para dots e não gera path', () => {
    const s = buildSparkline([1, 2, null, 5])
    assert.equal(s.paths.length, 1)
    assert.equal(s.dots.length, 1)
    assert.deepEqual(s.dots[0], s.lastPoint)
  })
})

describe('buildSparkline — geometria e valores', () => {
  it('série constante fica no meio, sem NaN', () => {
    const s = buildSparkline([25, 25, 25], { height: 32 })
    assert.ok(s.segments[0].every((p) => p.y === 16 && Number.isFinite(p.x)))
    assert.ok(!s.paths[0].includes('NaN'))
  })

  it('maior valor fica no topo (y menor)', () => {
    const s = buildSparkline([10, 30], { height: 32, padding: 2 })
    assert.equal(s.segments[0][0].y, 30)
    assert.equal(s.segments[0][1].y, 2)
  })

  it('min, max, last e count são os valores reais', () => {
    const s = buildSparkline([22.5, null, 31.2, 18.4, null])
    assert.equal(s.min, 18.4)
    assert.equal(s.max, 31.2)
    assert.equal(s.last, 18.4)
    assert.equal(s.count, 3)
  })

  it('coordenadas ficam dentro do viewBox', () => {
    const s = buildSparkline([3, 9, null, 1, 7, 7.3333333], { width: 80, height: 24, padding: 3 })
    assert.equal(s.viewBox, '0 0 80 24')
    for (const p of s.segments.flat()) {
      assert.ok(p.x >= 0 && p.x <= 80 && p.y >= 0 && p.y <= 24)
      assert.equal(p.x, Math.round(p.x * 100) / 100)
    }
  })

  it('não muta a entrada', () => {
    const input = [1, null, 3, 4]
    const copy = [...input]
    buildSparkline(input)
    assert.deepEqual(input, copy)
  })
})
