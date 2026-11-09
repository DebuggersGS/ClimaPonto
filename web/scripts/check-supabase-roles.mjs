/**
 * Verifica, pela API real (Supabase Auth + Data API), as permissões de
 * administrador e de usuário comum autenticados.
 *
 * Complementa:
 *   - npm run check:supabase           (visitante, sem login)
 *   - supabase/tests/rls_policies.test.sql (SQL, claims simuladas)
 * Aqui os tokens são emitidos de verdade pelo Supabase Auth.
 *
 * Variáveis de ambiente (nunca versionar valores reais):
 *   SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY
 *   CHECK_ADMIN_EMAIL, CHECK_ADMIN_PASSWORD   conta com app_metadata.role = 'admin'
 *   CHECK_USER_EMAIL,  CHECK_USER_PASSWORD    conta comum, sem papel
 *
 * ATENÇÃO: este script CRIA, EDITA e EXCLUI um ponto com código TEST-ROLES-*.
 * Por segurança só roda contra endereços locais (127.0.0.1/localhost), a
 * menos que CHECK_ALLOW_REMOTE=1 seja definido conscientemente.
 */
import { createClient } from '@supabase/supabase-js'

const env = process.env
const required = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'CHECK_ADMIN_EMAIL',
  'CHECK_ADMIN_PASSWORD',
  'CHECK_USER_EMAIL',
  'CHECK_USER_PASSWORD',
]
const missing = required.filter((name) => !env[name])
if (missing.length) {
  console.error(`Variáveis ausentes: ${missing.join(', ')}`)
  process.exit(1)
}

const host = new URL(env.SUPABASE_URL).hostname
if (!['127.0.0.1', 'localhost'].includes(host) && env.CHECK_ALLOW_REMOTE !== '1') {
  console.error(`Recusado: ${host} não é local. Este script grava dados (ponto TEST-ROLES-*).`)
  process.exit(1)
}

const results = []
const record = (name, passed, detail) => results.push({ name, passed, detail })

function newClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function signIn(email, password) {
  const client = newClient()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Falha no login de teste: ${error.message}`)
  return { client, role: data.user.app_metadata?.role ?? null }
}

/** Espera erro do banco/API; registra sucesso indevido como falha. */
async function expectError(name, operation, expectedCode) {
  const { data, error } = await operation()
  if (error) {
    const ok = !expectedCode || error.code === expectedCode
    record(name, ok, `negado: ${error.code} ${error.message}`)
  } else {
    record(name, false, `ACEITO — ${JSON.stringify(data)}`)
  }
}

const code = `TEST-ROLES-${Date.now().toString(36).toUpperCase()}`
let admin
let createdId = null

try {
  // ------------------------------------------------------------ usuário comum
  const user = await signIn(env.CHECK_USER_EMAIL, env.CHECK_USER_PASSWORD)
  record('usuário: login emite token sem papel admin', user.role !== 'admin', `app_metadata.role=${user.role}`)

  {
    const { data, error } = await user.client.from('stops').select('code, active')
    record(
      'usuário: lê apenas pontos ativos',
      !error && data.every((s) => s.active),
      error ? error.message : `${data.length} pontos, inativos: ${data.filter((s) => !s.active).length}`,
    )
  }

  await expectError(
    'usuário: NÃO cria ponto',
    () => user.client.from('stops').insert({ code: `${code}-U`, name: 'Usuário comum', neighborhood: 'Teste' }).select(),
    '42501',
  )

  {
    // RLS em UPDATE/DELETE filtra as linhas: sem erro, mas 0 linhas afetadas.
    const { data, error } = await user.client.from('stops').update({ name: 'Alterado' }).eq('code', 'DEMO-01').select()
    record('usuário: NÃO edita ponto (0 linhas)', !error && data.length === 0, error ? error.message : `${data.length} linhas`)
  }
  {
    const { data, error } = await user.client.from('stops').delete().eq('code', 'DEMO-01').select()
    record('usuário: NÃO exclui ponto (0 linhas)', !error && data.length === 0, error ? error.message : `${data.length} linhas`)
  }

  // ------------------------------------------------------------ administrador
  admin = await signIn(env.CHECK_ADMIN_EMAIL, env.CHECK_ADMIN_PASSWORD)
  record('admin: login emite token com papel admin', admin.role === 'admin', `app_metadata.role=${admin.role}`)

  {
    const { data, error } = await admin.client
      .from('stops')
      .insert({ code, name: 'Ponto de teste de papéis', neighborhood: 'Teste', is_demo: true })
      .select()
      .single()
    createdId = data?.id ?? null
    record('admin: cria ponto', !error && Boolean(createdId), error ? `${error.code} ${error.message}` : data.code)
  }

  if (createdId) {
    {
      const { data, error } = await admin.client
        .from('stops')
        .update({ name: 'Ponto de teste editado', description: 'Editado pelo teste' })
        .eq('id', createdId)
        .select()
        .single()
      record('admin: edita campos autorizados', !error && data?.name === 'Ponto de teste editado', error ? error.message : data.name)
    }

    await expectError(
      'admin: NÃO altera created_at',
      () => admin.client.from('stops').update({ created_at: '2000-01-01T00:00:00Z' }).eq('id', createdId).select(),
      '42501',
    )

    {
      const { data, error } = await admin.client.from('stops').update({ active: false }).eq('id', createdId).select().single()
      record('admin: desativa ponto', !error && data?.active === false, error ? error.message : `active=${data.active}`)
    }
    {
      const { data, error } = await admin.client.from('stops').select('id').eq('id', createdId)
      record('admin: vê ponto inativo', !error && data.length === 1, error ? error.message : `${data.length} linhas`)
    }
    {
      const { data, error } = await user.client.from('stops').select('id').eq('id', createdId)
      record('usuário: NÃO vê ponto inativo', !error && data.length === 0, error ? error.message : `${data.length} linhas`)
    }

    await expectError(
      'admin: NÃO insere leitura',
      () =>
        admin.client
          .from('readings')
          .insert({ stop_id: createdId, temperature_c: 25, humidity_pct: 50, source: 'simulation', measured_at: new Date().toISOString() })
          .select(),
      '42501',
    )

    {
      const { data, error } = await admin.client.from('stops').delete().eq('id', createdId).select()
      const ok = !error && data.length === 1
      if (ok) createdId = null
      record('admin: exclui ponto sem leituras', ok, error ? error.message : `${data.length} linhas`)
    }
  }
} catch (err) {
  record('execução', false, err.message)
} finally {
  // Limpeza defensiva caso algum passo tenha falhado no meio.
  if (createdId && admin) {
    await admin.client.from('stops').delete().eq('id', createdId)
  }
}

for (const r of results) {
  console.log(`${r.passed ? 'PASSOU' : 'FALHOU'}  ${r.name} — ${r.detail}`)
}
const failed = results.filter((r) => !r.passed).length
console.log(`\n${results.length - failed}/${results.length} verificações passaram.`)
// exitCode em vez de process.exit(): no Windows, encerrar à força com conexões
// HTTP ainda fechando pode abortar o Node (assertion em libuv).
process.exitCode = failed ? 1 : 0
