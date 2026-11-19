/**
 * Verifica, pela API real do Supabase, o que um VISITANTE (chave publishable,
 * sem login) consegue e não consegue fazer.
 *
 * Uso (dentro de web/):  npm run check:supabase
 * Requer VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY em .env.local.
 *
 * Os testes de escrita esperam ser NEGADOS; se algum for aceito, o script
 * informa a falha e termina com código 1. Nenhum dado é alterado quando as
 * permissões estão corretas.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY em web/.env.local.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })
const results = []

function record(name, passed, detail) {
  results.push({ name, passed, detail })
}

// ---------------------------------------------------------------- permitido
{
  const { data, error } = await supabase.from('stops').select('code, active, is_demo').order('code')
  record(
    'visitante lê pontos',
    !error && data.length > 0,
    error ? error.message : `${data.length} pontos: ${data.map((s) => s.code).join(', ')}`,
  )
  if (data) {
    record(
      'visitante só recebe pontos ativos',
      data.every((s) => s.active),
      `inativos recebidos: ${data.filter((s) => !s.active).length}`,
    )
  }
}

{
  const { data, error } = await supabase.from('readings').select('id').limit(5)
  record('visitante consulta leituras', !error, error ? error.message : `${data.length} leituras visíveis`)
}

{
  const { data, error } = await supabase.from('stop_latest_readings').select('stop_id').limit(5)
  record('visitante consulta última leitura por ponto', !error, error ? error.message : `${data.length} linhas`)
}

// ------------------------------------------------------------------- negado
async function expectDenied(name, operation) {
  const { data, error } = await operation()
  if (error) {
    record(name, true, `negado: ${error.code} ${error.message}`)
  } else {
    record(name, false, `ACEITO — resposta: ${JSON.stringify(data)}`)
  }
}

await expectDenied('visitante NÃO cria ponto', () =>
  supabase.from('stops').insert({ code: 'ANON-TEST', name: 'Teste anônimo', neighborhood: 'Teste' }).select(),
)

await expectDenied('visitante NÃO edita ponto', () =>
  supabase.from('stops').update({ name: 'Alterado por visitante' }).eq('code', 'DEMO-01').select(),
)

await expectDenied('visitante NÃO exclui ponto', () =>
  supabase.from('stops').delete().eq('code', 'DEMO-01').select(),
)

await expectDenied('visitante NÃO insere leitura', async () => {
  const { data: stop } = await supabase.from('stops').select('id').limit(1).single()
  return supabase
    .from('readings')
    .insert({
      stop_id: stop?.id,
      temperature_c: 25,
      humidity_pct: 50,
      source: 'test',
      measured_at: new Date().toISOString(),
    })
    .select()
})

// ---------------------------------------------------------------- resultado
for (const r of results) {
  console.log(`${r.passed ? 'PASSOU' : 'FALHOU'}  ${r.name} — ${r.detail}`)
}
const failed = results.filter((r) => !r.passed).length
console.log(`\n${results.length - failed}/${results.length} verificações passaram.`)
// exitCode em vez de process.exit(): no Windows, encerrar à força com conexões
// HTTP ainda fechando pode abortar o Node (assertion em libuv).
process.exitCode = failed ? 1 : 0
