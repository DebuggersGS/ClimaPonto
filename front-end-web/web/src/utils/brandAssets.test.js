import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const web = (caminho) => fileURLToPath(new URL(`../../${caminho}`, import.meta.url))
const html = readFileSync(web('index.html'), 'utf8')

/** Caminhos locais (começam com "/") citados em href/content de index.html, exceto o módulo de entrada. */
function caminhosLocais() {
  const valores = [...html.matchAll(/\b(?:href|content)="(\/[^"]*)"/g)].map((m) => m[1])
  return valores.filter((v) => !v.startsWith('/src/'))
}

test('index.html referencia ativos de marca', () => {
  const caminhos = caminhosLocais()
  assert.ok(caminhos.some((c) => c.endsWith('favicon.ico')))
  assert.ok(caminhos.some((c) => c.includes('apple-touch-icon')))
  assert.ok(caminhos.some((c) => c.includes('og-image')))
  assert.match(html, /property="og:title"/)
  assert.match(html, /property="og:description"/)
})

test('todo href/content local de index.html existe em web/public', () => {
  for (const caminho of caminhosLocais()) {
    assert.ok(existsSync(web(`public${caminho}`)), `ausente em public: ${caminho}`)
  }
})

test('há theme-color claro e escuro', () => {
  assert.match(html, /name="theme-color"[^>]*prefers-color-scheme: light/)
  assert.match(html, /name="theme-color"[^>]*prefers-color-scheme: dark/)
})

test('favicon antigo e pasta de origem dos ativos não existem mais', () => {
  assert.equal(existsSync(web('public/favicon.svg')), false)
  assert.equal(existsSync(web('public/climaponto-brand-assets')), false)
  assert.ok(existsSync(web('public/brand/README-MARCA.md')))
})

test('Logo usa os arquivos de marca e não importa Bus nem ThermometerSun', () => {
  const logo = readFileSync(web('src/components/layout/Logo.jsx'), 'utf8')
  assert.doesNotMatch(logo, /\bBus\b|ThermometerSun|lucide-react/)
  for (const arquivo of ['climaponto-logo-light.png', 'climaponto-logo-dark.png', 'climaponto-mark-transparent.png']) {
    assert.ok(logo.includes(`/brand/${arquivo}`), `Logo deve usar ${arquivo}`)
    assert.ok(existsSync(web(`public/brand/${arquivo}`)))
  }
  assert.match(logo, /alt="ClimaPonto"/)
})
