import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DATA_SCENARIO_INFO,
  DATA_SCENARIO_STORAGE_KEY,
  buildScenarioSearch,
  getDataScenarioInfo,
  parseScenarioParam,
  parseStoredScenario,
  readStoredScenario,
  resolveDataScenario,
  writeStoredScenario,
} from './dataScenario.js'

describe('parseScenarioParam', () => {
  it('reconhece demonstração e observado, com variações de caixa e espaços', () => {
    assert.equal(parseScenarioParam('?dados=demonstracao'), 'demonstrativo')
    assert.equal(parseScenarioParam('?dados=DEMONSTRATIVO'), 'demonstrativo')
    assert.equal(parseScenarioParam('?dados=observado'), 'observado')
    assert.equal(parseScenarioParam('?dados=%20Observados%20'), 'observado')
  })

  it('ausente, vazio ou desconhecido vira null', () => {
    for (const search of [undefined, null, '', '?ponto=X', '?dados=', '?dados=mock', '?dados=real', '?dados=constructor']) {
      assert.equal(parseScenarioParam(search), null, String(search))
    }
  })
})

describe('parseStoredScenario', () => {
  it('só aceita os valores exatos dos conjuntos', () => {
    assert.equal(parseStoredScenario('observado'), 'observado')
    assert.equal(parseStoredScenario('demonstrativo'), 'demonstrativo')
    for (const raw of [null, undefined, '', 'demonstracao', 'DEMONSTRATIVO', 1, {}]) {
      assert.equal(parseStoredScenario(raw), null)
    }
  })
})

describe('resolveDataScenario: build mock', () => {
  it('é sempre demonstrativo e não alterna, mesmo pedindo observado', () => {
    for (const search of ['', '?dados=observado', '?dados=demonstracao']) {
      for (const stored of [null, 'observado', 'demonstrativo']) {
        const r = resolveDataScenario({ buildMode: 'mock', search, stored })
        assert.equal(r.scenario, 'demonstrativo')
        assert.equal(r.canSwitch, false)
        assert.equal(r.source, 'build')
      }
    }
  })
})

describe('resolveDataScenario: build unconfigured', () => {
  it('é sempre observado (indisponível) e nunca cai para o mock', () => {
    for (const search of ['', '?dados=demonstracao', '?dados=observado']) {
      for (const stored of [null, 'observado', 'demonstrativo']) {
        const r = resolveDataScenario({ buildMode: 'unconfigured', search, stored })
        assert.equal(r.scenario, 'observado')
        assert.equal(r.canSwitch, false)
        assert.equal(r.source, 'build')
      }
    }
  })

  it('modo de build desconhecido ou ausente é tratado como não configurado', () => {
    for (const buildMode of [undefined, null, 'auto', 'xyz']) {
      const r = resolveDataScenario({ buildMode, search: '?dados=demonstracao', stored: 'demonstrativo' })
      assert.equal(r.scenario, 'observado')
      assert.equal(r.canSwitch, false)
    }
  })
})

describe('resolveDataScenario: build supabase', () => {
  const casos = [
    // [search, stored, cenário, origem]
    ['', null, 'observado', 'default'],
    ['', 'observado', 'observado', 'preference'],
    ['', 'demonstrativo', 'demonstrativo', 'preference'],
    ['', 'lixo', 'observado', 'default'],
    ['?dados=demonstracao', null, 'demonstrativo', 'url'],
    ['?dados=demonstracao', 'observado', 'demonstrativo', 'url'],
    ['?dados=observado', 'demonstrativo', 'observado', 'url'],
    ['?dados=observado', null, 'observado', 'url'],
    ['?dados=invalido', 'demonstrativo', 'demonstrativo', 'preference'],
    ['?dados=invalido', null, 'observado', 'default'],
    ['?outro=1', undefined, 'observado', 'default'],
  ]
  for (const [search, stored, scenario, source] of casos) {
    it(`URL "${search}" + preferência ${JSON.stringify(stored)} => ${scenario} (${source})`, () => {
      const r = resolveDataScenario({ buildMode: 'supabase', search, stored })
      assert.equal(r.scenario, scenario)
      assert.equal(r.source, source)
      assert.equal(r.canSwitch, true)
      assert.ok(r.reason.length > 0)
    })
  }
})

describe('buildScenarioSearch', () => {
  it('escreve o valor explícito e preserva os outros parâmetros', () => {
    assert.equal(buildScenarioSearch('', 'demonstrativo'), '?dados=demonstracao')
    assert.equal(buildScenarioSearch('', 'observado'), '?dados=observado')
    assert.equal(buildScenarioSearch('?ponto=A&dados=demonstracao', 'observado'), '?ponto=A&dados=observado')
    assert.equal(buildScenarioSearch('?mock=lento', 'demonstrativo'), '?mock=lento&dados=demonstracao')
  })

  it('conjunto desconhecido não altera os parâmetros', () => {
    assert.equal(buildScenarioSearch('?a=1', 'mock'), '?a=1')
    assert.equal(buildScenarioSearch(undefined, 'mock'), '')
  })

  it('o resultado é lido de volta como o mesmo conjunto', () => {
    for (const scenario of ['observado', 'demonstrativo']) {
      assert.equal(parseScenarioParam(buildScenarioSearch('?x=1', scenario)), scenario)
    }
  })
})

describe('preferência local com storage injetado', () => {
  function createStorage(initial = {}) {
    const data = { ...initial }
    return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v } }
  }

  it('grava e lê o conjunto escolhido', () => {
    const storage = createStorage()
    assert.equal(writeStoredScenario(storage, 'demonstrativo'), true)
    assert.equal(storage.data[DATA_SCENARIO_STORAGE_KEY], 'demonstrativo')
    assert.equal(readStoredScenario(storage), 'demonstrativo')
  })

  it('não grava conjunto inválido', () => {
    const storage = createStorage()
    assert.equal(writeStoredScenario(storage, 'mock'), false)
    assert.deepEqual(storage.data, {})
  })

  it('tolera storage ausente, bloqueado ou com valor inválido', () => {
    const bloqueado = {
      getItem: () => { throw new Error('SecurityError') },
      setItem: () => { throw new Error('QuotaExceededError') },
    }
    assert.equal(readStoredScenario(null), null)
    assert.equal(readStoredScenario(undefined), null)
    assert.equal(readStoredScenario(bloqueado), null)
    assert.equal(writeStoredScenario(bloqueado, 'observado'), false)
    assert.equal(writeStoredScenario(null, 'observado'), false)
    assert.equal(readStoredScenario(createStorage({ [DATA_SCENARIO_STORAGE_KEY]: 'xyz' })), null)
  })
})

describe('getDataScenarioInfo', () => {
  it('rótulos do seletor e selo em português', () => {
    assert.equal(getDataScenarioInfo('observado').label, 'Dados observados')
    assert.equal(getDataScenarioInfo('demonstrativo').label, 'Cenários demonstrativos')
    assert.equal(DATA_SCENARIO_INFO.demonstrativo.badgeLabel, 'Demonstrativo')
    assert.match(DATA_SCENARIO_INFO.demonstrativo.description, /não são medições reais/)
  })

  it('desconhecido cai em observado, nunca em demonstrativo', () => {
    assert.equal(getDataScenarioInfo('xyz'), DATA_SCENARIO_INFO.observado)
    assert.equal(getDataScenarioInfo(undefined), DATA_SCENARIO_INFO.observado)
  })
})
