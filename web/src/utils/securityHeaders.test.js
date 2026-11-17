import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const config = JSON.parse(readFileSync(fileURLToPath(new URL('../../vercel.json', import.meta.url)), 'utf8'))
const cabecalhos = config.headers.find((h) => h.source === '/(.*)').headers
const valor = (chave) => cabecalhos.find((h) => h.key === chave)?.value

/** Converte a CSP em { diretiva: [fontes] }. */
function lerCsp() {
  const csp = {}
  for (const parte of valor('Content-Security-Policy').split(';')) {
    const [nome, ...fontes] = parte.trim().split(/\s+/)
    if (nome) csp[nome] = fontes
  }
  return csp
}

const TILES = 'https://tiles.openfreemap.org'

test('CSP libera tiles do mapa só no domínio do OpenFreeMap', () => {
  const csp = lerCsp()
  assert.ok(csp['connect-src'].includes(TILES))
  assert.ok(csp['img-src'].includes(TILES))
  for (const fonte of ['data:', 'blob:', "'self'"]) assert.ok(csp['img-src'].includes(fonte), `img-src sem ${fonte}`)
  assert.deepEqual(csp['worker-src'], ["'self'", 'blob:'])
  assert.ok(csp['child-src'].includes('blob:'))
})

test('CSP não usa unsafe-eval nem curingas amplos', () => {
  const csp = lerCsp()
  const texto = valor('Content-Security-Policy')
  assert.doesNotMatch(texto, /unsafe-eval/)
  for (const [diretiva, fontes] of Object.entries(csp)) {
    for (const fonte of fontes) {
      assert.ok(!['*', 'https:', 'http:', 'https://*'].includes(fonte), `${diretiva}: curinga amplo ${fonte}`)
    }
  }
  assert.deepEqual(csp['script-src'], ["'self'"])
  assert.deepEqual(csp['default-src'], ["'self'"])
  assert.deepEqual(csp['frame-ancestors'], ["'none'"])
})

test('demais cabeçalhos de segurança continuam presentes', () => {
  assert.equal(valor('X-Content-Type-Options'), 'nosniff')
  assert.equal(valor('X-Frame-Options'), 'DENY')
  assert.equal(valor('Referrer-Policy'), 'strict-origin-when-cross-origin')
  assert.match(valor('Permissions-Policy'), /camera=\(\)/)
})
