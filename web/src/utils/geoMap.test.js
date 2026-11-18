import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { MARKER_SHAPES, SAO_PAULO_CENTER, buildStopGeoData, getMapBounds, resolveMapOrigin, toMapItem } from './geoMap.js'
import { SAO_PAULO_BOUNDS } from './stopMap.js'

const stop = (code, latitude, longitude, extra = {}) => ({ id: `id-${code}`, code, latitude, longitude, ...extra })

describe('buildStopGeoData', () => {
  it('sem pontos usa o enquadramento explícito de São Paulo', () => {
    for (const input of [[], null, undefined]) {
      const data = buildStopGeoData(input)
      assert.equal(data.featureCollection.features.length, 0)
      assert.equal(data.isFallback, true)
      assert.deepEqual(data.center, [...SAO_PAULO_CENTER])
      assert.deepEqual(data.bounds, [
        [SAO_PAULO_BOUNDS.minLng, SAO_PAULO_BOUNDS.minLat],
        [SAO_PAULO_BOUNDS.maxLng, SAO_PAULO_BOUNDS.maxLat],
      ])
    }
  })

  it('só pontos located viram feição, em [lng, lat] sem alterar valores', () => {
    const items = [stop('A', -23.55, -46.63), stop('B', null, null), stop('C', -22.9, -43.2)]
    const { featureCollection, unlocated } = buildStopGeoData(items)
    assert.equal(featureCollection.type, 'FeatureCollection')
    assert.equal(featureCollection.features.length, 1)
    assert.deepEqual(featureCollection.features[0].geometry.coordinates, [-46.63, -23.55])
    assert.equal(featureCollection.features[0].properties.code, 'A')
    assert.equal(featureCollection.features[0].properties.id, 'id-A')
    assert.deepEqual(unlocated.map((u) => [u.item.code, u.kind]), [['B', 'missing'], ['C', 'outside']])
    assert.ok(unlocated.every((u) => u.reason.length > 0))
  })

  it('bounds vêm das coordenadas reais, não do fallback', () => {
    const data = buildStopGeoData([stop('A', -23.5, -46.7), stop('B', -23.6, -46.5)])
    assert.equal(data.isFallback, false)
    assert.deepEqual(data.bounds, [[-46.7, -23.6], [-46.5, -23.5]])
    assert.ok(Math.abs(data.center[0] - -46.6) < 1e-9)
  })

  it('propriedades de item do dashboard: origem, estado, conectividade e forma', () => {
    const item = {
      stop: stop('A', -23.55, -46.63),
      reading: { source: 'sensor', environmentalStatus: 'critical' },
      connectivity: { status: 'online' },
    }
    const props = buildStopGeoData([item]).featureCollection.features[0].properties
    assert.equal(props.origin, 'observado')
    assert.equal(props.environmental, 'critical')
    assert.equal(props.connectivity, 'online')
    assert.equal(props.markerShape, MARKER_SHAPES.critical)
    assert.equal(props.hasReading, true)
  })

  it('ponto simples: sem leitura, não classificado e sem dados', () => {
    const props = buildStopGeoData([stop('A', -23.55, -46.63)]).featureCollection.features[0].properties
    assert.equal(props.environmental, 'unclassified')
    assert.equal(props.connectivity, 'no_data')
    assert.equal(props.hasReading, false)
    assert.equal(props.markerShape, 'square')
  })

  it('cada estado ambiental tem forma distinta', () => {
    assert.equal(new Set(Object.values(MARKER_SHAPES)).size, 4)
  })
})

describe('resolveMapOrigin', () => {
  it('simulação, teste, origem desconhecida e ponto demonstrativo são demonstrativos', () => {
    assert.equal(resolveMapOrigin({}, { source: 'simulation' }), 'demonstrativo')
    assert.equal(resolveMapOrigin({}, { source: 'test' }), 'demonstrativo')
    assert.equal(resolveMapOrigin({}, { source: 'unknown' }), 'demonstrativo')
    assert.equal(resolveMapOrigin({ isDemo: true }, { source: 'sensor' }), 'demonstrativo')
  })
  it('sensor e ponto sem leitura são observados', () => {
    assert.equal(resolveMapOrigin({}, { source: 'sensor' }), 'observado')
    assert.equal(resolveMapOrigin({}, null), 'observado')
  })
})

describe('getMapBounds', () => {
  it('ponto único gera bounds degenerados no próprio ponto', () => {
    const { bounds, isFallback } = getMapBounds([[-46.6, -23.5]])
    assert.equal(isFallback, false)
    assert.deepEqual(bounds, [[-46.6, -23.5], [-46.6, -23.5]])
  })
})

describe('toMapItem', () => {
  it('ponto simples (Ponto 360°) vira { stop, reading: null, connectivity: null }', () => {
    const stop = { id: 'a', code: 'MOCK-01', latitude: -23.5, longitude: -46.6 }
    assert.deepEqual(toMapItem(stop), { stop, reading: null, connectivity: null })
  })

  it('item do summarizeDashboard é preservado e campos ausentes viram null', () => {
    const stop = { id: 'b', code: 'MOCK-02' }
    const connectivity = { status: 'online' }
    assert.deepEqual(toMapItem({ stop, connectivity }), { stop, reading: null, connectivity })
  })

  it('entrada nula não lança exceção', () => {
    assert.deepEqual(toMapItem(null), { stop: {}, reading: null, connectivity: null })
  })

  it('buildStopGeoData aceita os dois formatos e devolve a mesma feição', () => {
    const stop = { id: 'c', code: 'MOCK-03', name: 'X', latitude: -23.55, longitude: -46.63 }
    const simples = buildStopGeoData([stop]).featureCollection.features[0]
    const embrulhado = buildStopGeoData([toMapItem(stop)]).featureCollection.features[0]
    assert.deepEqual(simples, embrulhado)
  })
})
