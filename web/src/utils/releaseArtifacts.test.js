import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

// Raiz do repositório (web/src/utils -> raiz). O ZIP não é versionado e não é lido aqui.
const raiz = new URL('../../../', import.meta.url)
const ler = (caminho) => readFileSync(new URL(caminho, raiz), 'utf8')

const DOCS = [
  'README.md',
  'AI.md',
  'BLOCKERS.md',
  'docs/MATRIZ-FIAP.md',
  'docs/ARQUITETURA-E-DECISOES.md',
  'docs/RELATORIO-FINAL.md',
  'docs/INTEGRACAO-GS.md',
  'docs/CHECKLIST-SUBMISSAO.md',
]

test('documentos de entrega existem', () => {
  for (const d of DOCS) assert.ok(existsSync(new URL(d, raiz)), `faltando: ${d}`)
})

test('relatório final traz commit, branch, status e classificações', () => {
  const t = ler('docs/RELATORIO-FINAL.md')
  for (const s of [
    'b61d184af3ca677ef32cdb5d6f0b5b8c2de05009',
    'harness/G-20261116-a1dfae',
    'LOCAL_RELEASE_READY_WITH_BLOCKERS',
    'ATENDE',
    'PARCIAL',
    'NÃO ATENDE',
    'NÃO VERIFICÁVEL',
  ]) assert.ok(t.includes(s), `RELATORIO-FINAL sem: ${s}`)
})

test('relatório final registra gates, matriz antes→depois e limites da verificação visual', () => {
  const t = ler('docs/RELATORIO-FINAL.md')
  for (const s of [
    'Matriz antes → depois',
    'npm --prefix web run lint',
    'npm --prefix web run build',
    'kB',
    'node --test',
    'Não foram executados pelo agente',
    'Screenshots antes/depois',
    'release/MANIFEST.txt',
    'release/SHA256SUMS',
  ]) assert.ok(t.includes(s), `RELATORIO-FINAL sem: ${s}`)
  for (const rota of ['/analises', '/relatorios', '/laboratorio', '/pontos', '/historico']) {
    assert.ok(t.includes(`\`${rota}\``), `RELATORIO-FINAL sem a rota ${rota}`)
  }
})

test('documentos finais não trazem textos de etapas intermediárias', () => {
  for (const d of ['docs/RELATORIO-FINAL.md', 'docs/CHECKLIST-SUBMISSAO.md', 'BLOCKERS.md']) {
    const t = ler(d)
    for (const velho of ['não existem nesta tarefa', 'gerado pela T4', 'gerados pela T4', 'este documento não os repete']) {
      assert.ok(!t.includes(velho), `${d} contém texto desatualizado: ${velho}`)
    }
  }
})

test('matriz e checklist cobrem as duas disciplinas', () => {
  const m = ler('docs/MATRIZ-FIAP.md')
  const c = ler('docs/CHECKLIST-SUBMISSAO.md')
  for (const t of [m, c]) {
    assert.ok(t.includes('## Front-end Design'))
    assert.ok(t.includes('## Web Development'))
  }
  for (const col of ['Status', 'Evidência', 'Arquivo', 'Teste', 'Pendência']) {
    assert.ok(m.includes(col), `MATRIZ sem coluna: ${col}`)
  }
  for (const k of ['ZIP', 'GitHub', 'write', 'deploy', 'Teams']) {
    assert.ok(c.includes(k), `CHECKLIST sem: ${k}`)
  }
})

test('integração GS cita todas as frentes', () => {
  const t = ler('docs/INTEGRACAO-GS.md')
  for (const k of ['Python', 'Edge', 'Wokwi', 'Front-end', 'Total Experience', 'Storytelling', 'Web']) {
    assert.ok(t.includes(k), `INTEGRACAO-GS sem: ${k}`)
  }
})

test('BLOCKERS é curto e cita os bloqueios humanos', () => {
  const t = ler('BLOCKERS.md')
  assert.ok(t.split('\n').length <= 60)
  for (const k of ['GitHub', 'deploy', 'Teams']) assert.ok(t.includes(k), `BLOCKERS sem: ${k}`)
})

test('nenhum documento declara prontidão total', () => {
  for (const d of DOCS) {
    const t = ler(d)
    assert.ok(!t.includes('100% pronto'), `${d} contém "100% pronto"`)
    assert.ok(!t.includes('READY_FOR_SUBMISSION'), `${d} contém READY_FOR_SUBMISSION`)
  }
})

test('manifesto lista o necessário e nenhum artefato proibido', () => {
  const linhas = ler('release/MANIFEST.txt').split('\n').filter(Boolean)
  assert.match(linhas[0], /^# commit [0-9a-f]{40}$/)
  const caminhos = linhas.slice(1)
  for (const p of ['README.md', 'AI.md', 'web/package.json', 'web/package-lock.json']) {
    assert.ok(caminhos.includes(p), `MANIFEST sem: ${p}`)
  }
  const proibidos = ['node_modules/', 'dist/', '.worktrees/', '.claude/', 'test-results/', 'playwright-report/', '.zip']
  for (const c of caminhos) {
    for (const x of proibidos) assert.ok(!c.includes(x), `MANIFEST contém ${x}: ${c}`)
    const nome = c.split('/').pop()
    if (nome === '.env' || nome.startsWith('.env.')) assert.equal(nome, '.env.example', `env proibido: ${c}`)
  }
})

test('SHA256SUMS no formato esperado', () => {
  assert.match(ler('release/SHA256SUMS'), /^[0-9a-f]{64} {2}ClimaPonto-GS-2026\.2\.zip$/m)
})
