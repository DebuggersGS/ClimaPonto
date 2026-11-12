import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DATA_MODE_INFO, getDataModeInfo, resolveDataMode } from './dataMode.js'

describe('resolveDataMode', () => {
  const casos = [
    ['mock', true, 'mock'],
    ['mock', false, 'mock'],
    ['supabase', true, 'supabase'],
    ['supabase', false, 'unconfigured'],
    ['auto', true, 'supabase'],
    ['auto', false, 'mock'],
  ]

  for (const [pedido, configurado, esperado] of casos) {
    it(`"${pedido}" com Supabase ${configurado ? 'configurado' : 'não configurado'} resulta em ${esperado}`, () => {
      const resultado = resolveDataMode(pedido, { supabaseConfigured: configurado })
      assert.equal(resultado.mode, esperado)
      assert.equal(resultado.requested, pedido)
      assert.ok(resultado.reason.length > 0)
    })
  }

  it('"supabase" sem configuração nunca resolve para mock', () => {
    const resultado = resolveDataMode('supabase', { supabaseConfigured: false })
    assert.notEqual(resultado.mode, 'mock')
    assert.match(resultado.reason, /não está configurado/)
  })

  it('valor ausente, vazio ou só com espaços é tratado como auto', () => {
    for (const valor of [undefined, null, '', '   ']) {
      assert.deepEqual(
        resolveDataMode(valor, { supabaseConfigured: true }).mode,
        'supabase',
        `valor: ${JSON.stringify(valor)}`,
      )
      const semConfig = resolveDataMode(valor, { supabaseConfigured: false })
      assert.equal(semConfig.mode, 'mock')
      assert.equal(semConfig.requested, 'auto')
    }
  })

  it('valor inválido é tratado como auto e o motivo avisa do valor inválido', () => {
    for (const valor of ['demo', 'true', 'mock,supabase', 42, {}]) {
      const resultado = resolveDataMode(valor, { supabaseConfigured: false })
      assert.equal(resultado.mode, 'mock')
      assert.equal(resultado.requested, 'auto')
      assert.match(resultado.reason, /inválido/)
    }
    assert.equal(resolveDataMode('demo', { supabaseConfigured: true }).mode, 'supabase')
  })

  it('valor ausente ou vazio não é descrito como inválido', () => {
    assert.doesNotMatch(resolveDataMode('', { supabaseConfigured: true }).reason, /inválido/)
    assert.doesNotMatch(resolveDataMode(undefined, { supabaseConfigured: true }).reason, /inválido/)
  })

  it('normaliza espaços e maiúsculas', () => {
    assert.equal(resolveDataMode('  MOCK ', { supabaseConfigured: true }).mode, 'mock')
    assert.equal(resolveDataMode('Supabase', { supabaseConfigured: false }).mode, 'unconfigured')
    assert.equal(resolveDataMode(' Supabase\n', { supabaseConfigured: true }).requested, 'supabase')
    assert.equal(resolveDataMode('AUTO', { supabaseConfigured: false }).requested, 'auto')
  })
})

describe('resolveDataMode: 3 x 2 combinações com variações de caixa e espaços', () => {
  const variantes = { mock: ['MOCK', '  Mock  ', '\tmock\n'], supabase: ['SUPABASE', ' Supabase '], auto: ['AUTO', ' Auto '] }
  const esperado = {
    mock: { true: 'mock', false: 'mock' },
    supabase: { true: 'supabase', false: 'unconfigured' },
    auto: { true: 'supabase', false: 'mock' },
  }
  for (const [pedido, valores] of Object.entries(variantes)) {
    for (const configurado of [true, false]) {
      it(`${pedido} (${valores.length} variações) com Supabase ${configurado ? 'configurado' : 'não configurado'}`, () => {
        for (const valor of valores) {
          const resultado = resolveDataMode(valor, { supabaseConfigured: configurado })
          assert.equal(resultado.mode, esperado[pedido][configurado], JSON.stringify(valor))
          assert.equal(resultado.requested, pedido)
          assert.ok(resultado.reason.length > 0)
        }
      })
    }
  }

  it('só "supabase" sem configuração resulta em unconfigured, em qualquer entrada', () => {
    const entradas = [undefined, '', 'mock', 'auto', 'xyz', 'MOCK', ' auto ']
    for (const valor of entradas) {
      assert.notEqual(resolveDataMode(valor, { supabaseConfigured: false }).mode, 'unconfigured')
    }
  })
})

describe('getDataModeInfo', () => {
  it('cada modo efetivo tem rótulo e descrição em português', () => {
    for (const modo of ['mock', 'supabase', 'unconfigured']) {
      const info = getDataModeInfo(modo)
      assert.ok(info.label.length > 0)
      assert.ok(info.description.length > 0)
      assert.equal(info, DATA_MODE_INFO[modo])
    }
  })

  it('o modo mock se declara fictício e o não configurado orienta a configurar', () => {
    assert.match(getDataModeInfo('mock').description, /fictícios/)
    assert.match(getDataModeInfo('unconfigured').description, /VITE_DATA_MODE=mock/)
  })

  it('modo desconhecido cai em não configurado, nunca em mock', () => {
    assert.equal(getDataModeInfo('xyz'), DATA_MODE_INFO.unconfigured)
    assert.equal(getDataModeInfo(undefined), DATA_MODE_INFO.unconfigured)
  })
})
