import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DURATION,
  DURATION_MS,
  MOTION_VARIANTS,
  REDUCED_MOTION_VARIANTS,
  getMotionVariants,
} from './motionTokens.js'

const within = (value, min, max) => value >= min && value <= max

describe('durações', () => {
  it('respeitam as faixas', () => {
    assert.ok(within(DURATION_MS.hover, 120, 180))
    assert.ok(within(DURATION_MS.focus, 120, 180))
    assert.ok(within(DURATION_MS.state, 160, 240))
    assert.ok(within(DURATION_MS.panel, 200, 300))
  })

  it('segundos coincidem com ms', () => {
    for (const key of Object.keys(DURATION_MS)) assert.equal(DURATION[key] * 1000, DURATION_MS[key])
  })
})

describe('variantes', () => {
  it('normais usam as durações dos tokens', () => {
    for (const key of ['hover', 'state', 'panel']) {
      assert.equal(MOTION_VARIANTS[key].transition.duration, DURATION[key])
    }
  })

  it('reduzidas animam só opacidade', () => {
    for (const variant of Object.values(REDUCED_MOTION_VARIANTS)) {
      for (const stage of [variant.initial, variant.animate, variant.exit]) {
        assert.deepEqual(Object.keys(stage), ['opacity'])
      }
    }
  })

  it('getMotionVariants escolhe conforme a preferência', () => {
    assert.equal(getMotionVariants(true), REDUCED_MOTION_VARIANTS)
    assert.equal(getMotionVariants(false), MOTION_VARIANTS)
  })
})
