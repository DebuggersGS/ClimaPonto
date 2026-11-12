import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  CONNECTIVITY_PRESENTATION,
  DATA_MODE_PRESENTATION,
  ENVIRONMENTAL_PRESENTATION,
  SOURCE_PRESENTATION,
  getConnectivityTone,
  getDataModeTone,
  getEnvironmentalTone,
  getSourceTone,
} from './statusTones.js'
import { CONNECTIVITY_LABELS } from './connectivity.js'
import { ENVIRONMENTAL_STATUS_LABELS, READING_SOURCES } from './readings.js'

const TONES = ['neutral', 'info', 'success', 'warning', 'danger', 'demo']
const UNKNOWN_INPUTS = [null, undefined, '', 'xyz', 42, {}, 'toString', '__proto__']

function assertWellFormed(presentation, where) {
  assert.ok(typeof presentation.label === 'string' && presentation.label.trim() !== '', `${where}: label`)
  assert.ok(typeof presentation.icon === 'string' && presentation.icon !== '', `${where}: icon`)
  assert.ok(TONES.includes(presentation.tone), `${where}: tone ${presentation.tone}`)
}

describe('todo valor tem label, tom do design system e ícone', () => {
  const maps = {
    environmental: ENVIRONMENTAL_PRESENTATION,
    connectivity: CONNECTIVITY_PRESENTATION,
    source: SOURCE_PRESENTATION,
    dataMode: DATA_MODE_PRESENTATION,
  }
  for (const [name, map] of Object.entries(maps)) {
    it(`mapa ${name}`, () => {
      for (const [key, presentation] of Object.entries(map)) assertWellFormed(presentation, `${name}.${key}`)
    })
  }

  it('cobre todos os valores de entrada esperados', () => {
    for (const key of ['normal', 'attention', 'critical', 'unclassified']) assertWellFormed(getEnvironmentalTone(key), key)
    for (const key of ['online', 'delayed', 'offline', 'no_data', 'unknown']) assertWellFormed(getConnectivityTone(key), key)
    for (const key of ['sensor', 'simulation', 'test']) assertWellFormed(getSourceTone(key), key)
    for (const key of ['mock', 'supabase', 'unconfigured']) assertWellFormed(getDataModeTone(key), key)
  })
})

describe('valor nulo ou desconhecido cai em neutro', () => {
  it('estado ambiental → Não classificado, nunca critical', () => {
    for (const input of UNKNOWN_INPUTS) {
      const p = getEnvironmentalTone(input)
      assert.equal(p.tone, 'neutral')
      assert.equal(p.label, 'Não classificado')
      assert.notEqual(p.label, ENVIRONMENTAL_STATUS_LABELS.critical)
    }
  })

  it('conectividade → Indeterminado, nunca online', () => {
    for (const input of UNKNOWN_INPUTS) {
      const p = getConnectivityTone(input)
      assert.equal(p.tone, 'neutral')
      assert.equal(p.label, 'Indeterminado')
      assert.notEqual(p.label, CONNECTIVITY_LABELS.online)
    }
  })

  it('origem → Origem desconhecida, nunca sensor', () => {
    for (const input of UNKNOWN_INPUTS) {
      const p = getSourceTone(input)
      assert.equal(p.tone, 'neutral')
      assert.equal(p.label, 'Origem desconhecida')
      assert.notEqual(p.label, READING_SOURCES.sensor.label)
    }
  })

  it('modo de dados desconhecido → neutro com rótulo e ícone', () => {
    for (const input of UNKNOWN_INPUTS) {
      const p = getDataModeTone(input)
      assert.equal(p.tone, 'neutral')
      assertWellFormed(p, 'dataMode desconhecido')
    }
  })
})

describe('dimensões distintas', () => {
  it('offline não é um estado ambiental', () => {
    assert.equal(getEnvironmentalTone('offline').label, 'Não classificado')
    assert.equal(getEnvironmentalTone('offline').tone, 'neutral')
    assert.equal(Object.hasOwn(ENVIRONMENTAL_PRESENTATION, 'offline'), false)
  })

  it('conectividade não aceita chaves de estado ambiental', () => {
    for (const key of ['normal', 'attention', 'critical']) {
      assert.equal(getConnectivityTone(key).label, 'Indeterminado')
    }
  })

  it('mapas de estado ambiental e conectividade têm chaves e objetos distintos', () => {
    assert.notEqual(ENVIRONMENTAL_PRESENTATION, CONNECTIVITY_PRESENTATION)
    const envKeys = Object.keys(ENVIRONMENTAL_PRESENTATION)
    const connKeys = Object.keys(CONNECTIVITY_PRESENTATION)
    assert.deepEqual(envKeys.filter((k) => connKeys.includes(k)), [])
  })

  it('tons de severidade fazem sentido', () => {
    assert.equal(getEnvironmentalTone('normal').tone, 'success')
    assert.equal(getEnvironmentalTone('attention').tone, 'warning')
    assert.equal(getEnvironmentalTone('critical').tone, 'danger')
    assert.equal(getConnectivityTone('offline').tone, 'danger')
    assert.equal(getSourceTone('simulation').tone, 'demo')
  })
})

describe('labels coincidem com readings.js e connectivity.js', () => {
  it('estado ambiental', () => {
    for (const [key, label] of Object.entries(ENVIRONMENTAL_STATUS_LABELS)) {
      assert.equal(getEnvironmentalTone(key).label, label)
    }
  })

  it('conectividade', () => {
    for (const [key, label] of Object.entries(CONNECTIVITY_LABELS)) {
      assert.equal(getConnectivityTone(key).label, label)
    }
  })

  it('origem', () => {
    for (const [key, info] of Object.entries(READING_SOURCES)) {
      assert.equal(getSourceTone(key).label, info.label)
    }
  })
})
