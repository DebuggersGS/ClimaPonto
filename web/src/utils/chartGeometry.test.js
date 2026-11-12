import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildSeriesGeometry, toPathData } from './chartGeometry.js'
import { getOfflineThresholdMs } from './connectivity.js'

// Fixtures de teste: pontos sintéticos, não são medições.
const MIN = 60000

describe('buildSeriesGeometry', () => {
  it('posiciona X proporcionalmente ao tempo, não ao índice', () => {
    const g = buildSeriesGeometry(
      [{ t: 0, value: 1 }, { t: MIN, value: 2 }, { t: 4 * MIN, value: 3 }],
      { width: 416, padding: 16 },
    )
    const [a, b, c] = g.segments[0]
    assert.equal(a.x, 16)
    assert.equal(b.x, 16 + 96)
    assert.equal(c.x, 400)
  })

  it('inverte Y e mantém coordenadas dentro do viewBox', () => {
    const g = buildSeriesGeometry([{ t: 0, value: 10 }, { t: MIN, value: 30 }, { t: 2 * MIN, value: 20 }])
    assert.equal(g.viewBox, '0 0 600 200')
    const [low, high] = [g.segments[0][0], g.segments[0][1]]
    assert.ok(high.y < low.y)
    for (const p of g.segments[0]) {
      assert.ok(p.x >= 0 && p.x <= 600 && p.y >= 0 && p.y <= 200)
    }
  })

  it('valor nulo quebra em dois segmentos', () => {
    const g = buildSeriesGeometry([
      { t: 0, value: 1 }, { t: MIN, value: 2 }, { t: 2 * MIN, value: null },
      { t: 3 * MIN, value: 3 }, { t: 4 * MIN, value: 4 },
    ])
    assert.equal(g.segments.length, 2)
    assert.equal(g.markers.length, 0)
  })

  it('lacuna exatamente igual a maxGapMs mantém um segmento', () => {
    const g = buildSeriesGeometry([{ t: 0, value: 1 }, { t: 300000, value: 2 }])
    assert.equal(g.segments.length, 1)
  })

  it('lacuna maior que maxGapMs separa em dois trechos', () => {
    const g = buildSeriesGeometry([
      { t: 0, value: 1 }, { t: MIN, value: 2 }, { t: MIN + 300001, value: 3 }, { t: 2 * MIN + 300001, value: 4 },
    ])
    assert.equal(g.segments.length, 2)
  })

  it('amostra isolada entre duas lacunas vira marker', () => {
    const g = buildSeriesGeometry([
      { t: 0, value: 1 }, { t: MIN, value: 2 },
      { t: 20 * MIN, value: 5 },
      { t: 40 * MIN, value: 3 }, { t: 41 * MIN, value: 4 },
    ])
    assert.equal(g.segments.length, 2)
    assert.equal(g.markers.length, 1)
    assert.equal(g.markers[0].value, 5)
  })

  it('um único ponto vira marker sem segmento', () => {
    const g = buildSeriesGeometry([{ t: 1000, value: 22 }])
    assert.equal(g.segments.length, 0)
    assert.equal(g.markers.length, 1)
  })

  it('vazio e só nulos geram zero segmentos e markers, com limites nulos', () => {
    for (const input of [[], [{ t: 0, value: null }, { t: MIN, value: null }]]) {
      const g = buildSeriesGeometry(input)
      assert.equal(g.segments.length, 0)
      assert.equal(g.markers.length, 0)
      assert.equal(g.yMin, null)
      assert.equal(g.yMax, null)
      assert.equal(g.tStart, null)
      assert.equal(g.tEnd, null)
    }
  })

  it('valores constantes e instante único geram coordenadas finitas', () => {
    const constant = buildSeriesGeometry([{ t: 0, value: 5 }, { t: MIN, value: 5 }])
    const single = buildSeriesGeometry([{ t: 7, value: 5 }])
    for (const p of [...constant.segments[0], ...single.markers]) {
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y))
    }
    assert.equal(constant.segments[0][0].y, 100)
    assert.equal(single.markers[0].x, 300)
  })

  it('informa yMin/yMax reais e tStart/tEnd', () => {
    const g = buildSeriesGeometry([{ t: 0, value: 12.5 }, { t: MIN, value: null }, { t: 2 * MIN, value: 30.1 }])
    assert.equal(g.yMin, 12.5)
    assert.equal(g.yMax, 30.1)
    assert.equal(g.tStart, 0)
    assert.equal(g.tEnd, 2 * MIN)
  })

  it('permite sobrescrever maxGapMs', () => {
    const points = [{ t: 0, value: 1 }, { t: 2 * MIN, value: 2 }]
    assert.equal(buildSeriesGeometry(points, { maxGapMs: MIN }).segments.length, 0)
    assert.equal(buildSeriesGeometry(points, { maxGapMs: 2 * MIN }).segments.length, 1)
  })

  it('usa getOfflineThresholdMs() como padrão', () => {
    const gap = getOfflineThresholdMs()
    const same = buildSeriesGeometry([{ t: 0, value: 1 }, { t: gap, value: 2 }])
    const over = buildSeriesGeometry([{ t: 0, value: 1 }, { t: gap + 1, value: 2 }])
    assert.equal(same.segments.length, 1)
    assert.equal(over.segments.length, 0)
  })
})

describe('toPathData', () => {
  it('gera M/L com até 2 casas decimais', () => {
    assert.equal(toPathData([{ x: 1.23456, y: 2 }, { x: 3.456, y: 4.5 }]), 'M 1.23 2 L 3.46 4.5')
  })
})
