import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Escopo da anotação 'console-esperado': só os cenários offline de conexao.spec.mjs,
// com a descrição específica do erro de desconexão (nunca curinga ou genérica).
const E2E_DIR = fileURLToPath(new URL('../../e2e/', import.meta.url))
const ARQUIVO_PERMITIDO = 'conexao.spec.mjs'
const MARCADOR = 'console-esperado'
const DESCRICOES_PERMITIDAS = ['ERR_INTERNET_DISCONNECTED']
const OFFLINE = 'context.setOffline(true)'
const PUSH_RE = /annotations\.push\(\s*\{([^}]*)\}\s*\)/g

/** Lê todos os specs de web/e2e: { nome: conteúdo }. */
function lerSpecs() {
  return Object.fromEntries(
    readdirSync(E2E_DIR)
      .filter((nome) => nome.endsWith('.spec.mjs'))
      .sort()
      .map((nome) => [nome, readFileSync(E2E_DIR + nome, 'utf8')]),
  )
}

/** Divide o fonte em blocos que começam em cada chamada `test(` (não `test.info(` etc.). */
function dividirTestes(fonte) {
  const inicios = [...fonte.matchAll(/^[ \t]*test\(/gm)].map((m) => m.index)
  return inicios.map((ini, i) => fonte.slice(ini, inicios[i + 1] ?? fonte.length))
}

/** Extrai as anotações console-esperado de um trecho: [{ description, fim }]. */
function extrairAnotacoes(trecho) {
  const achadas = []
  for (const m of trecho.matchAll(PUSH_RE)) {
    const corpo = m[1]
    if (!corpo.includes(MARCADOR)) continue
    const desc = corpo.match(/description\s*:\s*(['"`])(.*?)\1/)
    achadas.push({ description: desc ? desc[2] : null, fim: m.index + m[0].length, inicio: m.index })
  }
  return achadas
}

/** Primeira linha não vazia após a posição dada. */
function proximaInstrucao(trecho, pos) {
  return trecho.slice(pos).split('\n').map((l) => l.trim()).find((l) => l !== '') ?? ''
}

/** Retorna a lista de problemas de uma descrição de anotação (vazia = válida). */
function validarDescricao(description) {
  if (description === null || description.trim() === '') return ['descrição ausente ou vazia']
  if (!DESCRICOES_PERMITIDAS.includes(description)) return [`descrição não permitida: "${description}"`]
  return []
}

const specs = lerSpecs()
const conexao = specs[ARQUIVO_PERMITIDO] ?? ''
const testesConexao = dividirTestes(conexao)
const testesOffline = testesConexao.filter((t) => t.includes(OFFLINE))

describe('escopo da anotação console-esperado nos specs E2E', () => {
  it('encontra os specs e o arquivo permitido', () => {
    assert.ok(Object.keys(specs).length > 0, 'nenhum *.spec.mjs encontrado em web/e2e')
    assert.ok(ARQUIVO_PERMITIDO in specs, `${ARQUIVO_PERMITIDO} não encontrado em web/e2e`)
  })

  it('somente conexao.spec.mjs contém console-esperado', () => {
    for (const [nome, fonte] of Object.entries(specs)) {
      if (nome === ARQUIVO_PERMITIDO) continue
      assert.ok(!fonte.includes(MARCADOR), `${nome} não pode conter '${MARCADOR}'`)
    }
  })

  it('há ao menos uma anotação em conexao.spec.mjs', () => {
    assert.ok(extrairAnotacoes(conexao).length >= 1, `nenhuma anotação '${MARCADOR}' em ${ARQUIVO_PERMITIDO}`)
  })

  it('toda anotação tem a descrição específica permitida', () => {
    for (const a of extrairAnotacoes(conexao)) {
      assert.deepEqual(validarDescricao(a.description), [], `anotação com descrição inválida: ${JSON.stringify(a.description)}`)
    }
  })

  it('não há uso do marcador fora de annotations.push', () => {
    const usos = conexao.split(MARCADOR).length - 1
    assert.equal(usos, extrairAnotacoes(conexao).length, `'${MARCADOR}' aparece fora de annotations.push em ${ARQUIVO_PERMITIDO}`)
  })

  it('cada anotação fica em teste offline, antes de setOffline(true), após goto e expect', () => {
    for (const teste of testesConexao) {
      for (const a of extrairAnotacoes(teste)) {
        const titulo = teste.split('\n')[0].trim()
        assert.ok(teste.includes(OFFLINE), `anotação em teste sem ${OFFLINE}: ${titulo}`)
        assert.equal(proximaInstrucao(teste, a.fim), `await ${OFFLINE}`, `a instrução seguinte à anotação deve ser 'await ${OFFLINE}': ${titulo}`)
        const antes = teste.slice(0, a.inicio)
        assert.ok(antes.includes('page.goto'), `page.goto deve vir antes da anotação: ${titulo}`)
        assert.ok(antes.includes('await expect('), `'await expect(' deve vir antes da anotação: ${titulo}`)
      }
    }
  })

  it('todo teste com setOffline(true) tem exatamente uma anotação', () => {
    assert.ok(testesOffline.length >= 1, 'nenhum teste offline encontrado em conexao.spec.mjs')
    for (const teste of testesOffline) {
      assert.equal(extrairAnotacoes(teste).length, 1, `teste offline deve ter exatamente uma anotação: ${teste.split('\n')[0].trim()}`)
    }
  })

  it('testes sem setOffline não têm anotação', () => {
    for (const teste of testesConexao.filter((t) => !t.includes(OFFLINE))) {
      assert.equal(extrairAnotacoes(teste).length, 0, `teste online com anotação: ${teste.split('\n')[0].trim()}`)
    }
  })
})

describe('validação de descrição (verificações negativas)', () => {
  const trecho = (d) => `test.info().annotations.push({ type: 'console-esperado', description: '${d}' })`

  it('aceita a descrição específica', () => {
    assert.deepEqual(validarDescricao(extrairAnotacoes(trecho('ERR_INTERNET_DISCONNECTED'))[0].description), [])
  })

  it('rejeita curinga, vazia, genérica e ausente', () => {
    for (const d of ['*', '', 'error', 'fetch', 'ERR_FAILED']) {
      const [a] = extrairAnotacoes(trecho(d))
      assert.notDeepEqual(validarDescricao(a.description), [], `descrição '${d}' deveria ser rejeitada`)
    }
    const [semDesc] = extrairAnotacoes("annotations.push({ type: 'console-esperado' })")
    assert.notDeepEqual(validarDescricao(semDesc.description), [])
  })

  it('detecta instrução seguinte incorreta', () => {
    const t = `${trecho('ERR_INTERNET_DISCONNECTED')}\n\n  await page.reload()`
    const [a] = extrairAnotacoes(t)
    assert.notEqual(proximaInstrucao(t, a.fim), `await ${OFFLINE}`)
  })
})
