-- =============================================================================
-- ClimaPonto — testes de permissões (grants + RLS), privilégios e restrições
--
-- Como executar (em ambiente LOCAL — ver docs/security-review.md):
--   psql "<conexão do banco local>" -f supabase/tests/rls_policies.test.sql
-- Deve ser executado como usuário postgres. Tudo acontece dentro de uma
-- transação finalizada com ROLLBACK: nenhum dado de teste permanece no banco.
-- O teste cria seus próprios pontos e leituras (códigos TEST-*); exige apenas
-- que esses códigos não existam previamente. Nenhum registro real é lido como
-- fixture nem alvo de escrita.
--
-- Perfis simulados trocando o papel do Postgres e as claims lidas por
-- auth.jwt():
--   visitante      role=anon           claims {"role":"anon"}
--   usuário comum  role=authenticated  claims com app_metadata vazio
--   administrador  role=authenticated  claims com app_metadata.role = "admin"
--
-- Saída: uma linha por verificação (passed = true/false) e uma linha de resumo.
-- =============================================================================

begin;

create temp table test_results (n int, profile text, test text, passed boolean, detail text) on commit drop;

do $$
declare
  results    text[] := '{}';
  active_id  uuid;
  hidden_id  uuid;
  new_id     uuid;
  cnt        int;
  txt        text;

  user_claims  constant text := '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{}}';
  admin_claims constant text := '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{"role":"admin"}}';
begin
  -- ===================================================================== FIXTURES
  insert into public.stops (code, name, neighborhood, is_demo, active)
  values ('TEST-ACTIVE', 'Ponto de teste ativo', 'Teste', true, true)
  returning id into active_id;

  insert into public.stops (code, name, neighborhood, is_demo, active)
  values ('TEST-HIDDEN', 'Ponto de teste inativo', 'Teste', true, false)
  returning id into hidden_id;

  -- Ponto ativo: uma leitura de simulação (pública) e uma de teste (privada,
  -- MAIS RECENTE — permite verificar o que a view mostra para cada perfil).
  -- Ponto inativo: uma leitura de simulação.
  insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
  values (active_id, 25.0, 60.0, 'simulation', now() - interval '10 minutes'),
         (active_id, 26.0, 58.0, 'test',       now() - interval '1 minute'),
         (hidden_id, 27.0, 55.0, 'simulation', now() - interval '5 minutes');

  -- ================================================================== VISITANTE
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);

  select count(*) into cnt from public.stops where id = active_id;
  results := results || format('visitante|vê ponto ativo|%s|count=%s', cnt = 1, cnt);

  select count(*) into cnt from public.stops where id = hidden_id;
  results := results || format('visitante|NÃO vê ponto inativo|%s|count=%s', cnt = 0, cnt);

  select count(*) into cnt from public.readings where stop_id = active_id and source = 'simulation';
  results := results || format('visitante|vê leitura de simulação de ponto ativo|%s|count=%s', cnt = 1, cnt);

  select count(*) into cnt from public.readings where stop_id = active_id and source = 'test';
  results := results || format('visitante|NÃO vê leitura de teste|%s|count=%s', cnt = 0, cnt);

  select count(*) into cnt from public.readings where stop_id = hidden_id;
  results := results || format('visitante|NÃO vê leitura de ponto inativo|%s|count=%s', cnt = 0, cnt);

  select count(*), max(source) into cnt, txt from public.stop_latest_readings where stop_id in (active_id, hidden_id);
  results := results || format('visitante|view: só ponto ativo, última leitura = simulação|%s|linhas=%s origem=%s',
                               cnt = 1 and txt = 'simulation', cnt, txt);

  begin
    insert into public.stops (code, name, neighborhood) values ('TEST-ANON', 'Invasor', 'Teste');
    results := results || text 'visitante|NÃO cria ponto|false|insert aceito';
  exception when insufficient_privilege then
    results := results || format('visitante|NÃO cria ponto|true|%s', sqlerrm);
  end;

  begin
    update public.stops set name = 'Alterado' where id = active_id;
    results := results || text 'visitante|NÃO edita ponto|false|update aceito';
  exception when insufficient_privilege then
    results := results || format('visitante|NÃO edita ponto|true|%s', sqlerrm);
  end;

  begin
    delete from public.stops where id = active_id;
    results := results || text 'visitante|NÃO exclui ponto|false|delete aceito';
  exception when insufficient_privilege then
    results := results || format('visitante|NÃO exclui ponto|true|%s', sqlerrm);
  end;

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    values (active_id, 30, 50, 'simulation', now());
    results := results || text 'visitante|NÃO insere leitura|false|insert aceito';
  exception when insufficient_privilege then
    results := results || format('visitante|NÃO insere leitura|true|%s', sqlerrm);
  end;

  -- ============================================================== USUÁRIO COMUM
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', user_claims, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into cnt from public.stops where id = hidden_id;
  results := results || format('usuário|NÃO vê ponto inativo|%s|count=%s', cnt = 0, cnt);

  select count(*) into cnt from public.readings where stop_id = active_id and source = 'simulation';
  results := results || format('usuário|vê leitura de simulação de ponto ativo|%s|count=%s', cnt = 1, cnt);

  select count(*) into cnt from public.readings where stop_id = active_id and source = 'test';
  results := results || format('usuário|NÃO vê leitura de teste|%s|count=%s', cnt = 0, cnt);

  begin
    insert into public.stops (code, name, neighborhood) values ('TEST-USER', 'Não admin', 'Teste');
    results := results || text 'usuário|NÃO cria ponto|false|insert aceito';
  exception when insufficient_privilege then
    results := results || format('usuário|NÃO cria ponto|true|%s', sqlerrm);
  end;

  update public.stops set name = 'Alterado' where id = active_id;
  get diagnostics cnt = row_count;
  results := results || format('usuário|NÃO edita ponto|%s|linhas afetadas=%s', cnt = 0, cnt);

  delete from public.stops where id = active_id;
  get diagnostics cnt = row_count;
  results := results || format('usuário|NÃO exclui ponto|%s|linhas afetadas=%s', cnt = 0, cnt);

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    values (active_id, 30, 50, 'simulation', now());
    results := results || text 'usuário|NÃO insere leitura|false|insert aceito';
  exception when insufficient_privilege then
    results := results || format('usuário|NÃO insere leitura|true|%s', sqlerrm);
  end;

  -- ============================================================== ADMINISTRADOR
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', admin_claims, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into cnt from public.stops where id = hidden_id;
  results := results || format('admin|vê ponto inativo|%s|count=%s', cnt = 1, cnt);

  select count(*) into cnt from public.readings where stop_id = active_id and source = 'test';
  results := results || format('admin|vê leitura de teste|%s|count=%s', cnt = 1, cnt);

  select count(*) into cnt from public.readings where stop_id = hidden_id;
  results := results || format('admin|vê leitura de ponto inativo|%s|count=%s', cnt = 1, cnt);

  select source into txt from public.stop_latest_readings where stop_id = active_id;
  results := results || format('admin|view: última leitura do ponto ativo = teste|%s|origem=%s', txt = 'test', txt);

  begin
    insert into public.stops (code, name, neighborhood, is_demo)
    values ('TEST-ADMIN', 'Ponto criado pelo admin', 'Teste', true)
    returning id into new_id;
    results := results || text 'admin|cria ponto (colunas permitidas)|true|insert aceito';
  exception when others then
    results := results || format('admin|cria ponto (colunas permitidas)|false|%s', sqlerrm);
  end;

  update public.stops
     set name = 'Ponto editado', neighborhood = 'Teste 2', description = 'Editado',
         latitude = -23.55, longitude = -46.63, is_demo = true, active = false, code = 'TEST-ADMIN-2'
   where id = new_id;
  get diagnostics cnt = row_count;
  results := results || format('admin|edita todos os campos autorizados|%s|linhas afetadas=%s', cnt = 1, cnt);

  begin
    update public.stops set created_at = now() - interval '1 year' where id = new_id;
    results := results || text 'admin|NÃO altera created_at|false|update aceito';
  exception when insufficient_privilege then
    results := results || format('admin|NÃO altera created_at|true|%s', sqlerrm);
  end;

  begin
    update public.stops set updated_at = now() - interval '1 year' where id = new_id;
    results := results || text 'admin|NÃO altera updated_at manualmente|false|update aceito';
  exception when insufficient_privilege then
    results := results || format('admin|NÃO altera updated_at manualmente|true|%s', sqlerrm);
  end;

  begin
    update public.stops set id = gen_random_uuid() where id = new_id;
    results := results || text 'admin|NÃO altera id|false|update aceito';
  exception when insufficient_privilege then
    results := results || format('admin|NÃO altera id|true|%s', sqlerrm);
  end;

  begin
    insert into public.stops (code, name, neighborhood, created_at)
    values ('TEST-FORGED', 'Data forjada', 'Teste', now() - interval '1 year');
    results := results || text 'admin|NÃO define created_at ao criar|false|insert aceito';
  exception when insufficient_privilege then
    results := results || format('admin|NÃO define created_at ao criar|true|%s', sqlerrm);
  end;

  delete from public.stops where id = new_id;
  get diagnostics cnt = row_count;
  results := results || format('admin|exclui ponto sem leituras|%s|linhas afetadas=%s', cnt = 1, cnt);

  begin
    delete from public.stops where id = active_id;
    results := results || text 'admin|NÃO exclui ponto com leituras (integridade)|false|delete aceito';
  exception when foreign_key_violation then
    results := results || format('admin|NÃO exclui ponto com leituras (integridade)|true|%s', sqlerrm);
  end;

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    values (active_id, 30, 50, 'simulation', now());
    results := results || text 'admin|NÃO insere leitura|false|insert aceito';
  exception when insufficient_privilege then
    results := results || format('admin|NÃO insere leitura|true|%s', sqlerrm);
  end;

  begin
    update public.readings set temperature_c = 35 where stop_id = active_id;
    results := results || text 'admin|NÃO edita leitura|false|update aceito';
  exception when insufficient_privilege then
    results := results || format('admin|NÃO edita leitura|true|%s', sqlerrm);
  end;

  begin
    delete from public.readings where stop_id = active_id;
    results := results || text 'admin|NÃO exclui leitura|false|delete aceito';
  exception when insufficient_privilege then
    results := results || format('admin|NÃO exclui leitura|true|%s', sqlerrm);
  end;

  -- ================================================= RESTRIÇÕES (como postgres)
  perform set_config('role', 'postgres', true);

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    values (active_id, 25, 120, 'test', now() - interval '2 minutes');
    results := results || text 'restrição|umidade > 100 rejeitada|false|aceito';
  exception when check_violation then
    results := results || format('restrição|umidade > 100 rejeitada|true|%s', sqlerrm);
  end;

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    values (active_id, 25, 50, 'esp32', now() - interval '3 minutes');
    results := results || text 'restrição|origem desconhecida rejeitada|false|aceito';
  exception when check_violation then
    results := results || format('restrição|origem desconhecida rejeitada|true|%s', sqlerrm);
  end;

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    values (active_id, 25, 50, 'test', now() + interval '1 hour');
    results := results || text 'restrição|medição no futuro rejeitada|false|aceito';
  exception when check_violation then
    results := results || format('restrição|medição no futuro rejeitada|true|%s', sqlerrm);
  end;

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    select stop_id, temperature_c, humidity_pct, source, measured_at
    from public.readings where stop_id = active_id limit 1;
    results := results || text 'restrição|leitura duplicada rejeitada|false|aceito';
  exception when unique_violation then
    results := results || format('restrição|leitura duplicada rejeitada|true|%s', sqlerrm);
  end;

  begin
    insert into public.stops (code, name, neighborhood) values ('test minúsculo', 'Código inválido', 'Teste');
    results := results || text 'restrição|código fora do padrão rejeitado|false|aceito';
  exception when check_violation then
    results := results || format('restrição|código fora do padrão rejeitado|true|%s', sqlerrm);
  end;

  begin
    insert into public.stops (code, name, neighborhood, latitude) values ('TEST-LAT', 'Só latitude', 'Teste', -23.5);
    results := results || text 'restrição|latitude sem longitude rejeitada|false|aceito';
  exception when check_violation then
    results := results || format('restrição|latitude sem longitude rejeitada|true|%s', sqlerrm);
  end;

  -- ============================================ PRIVILÉGIOS (como postgres)
  -- Objetos existentes mantêm o acesso necessário ao aplicativo.
  results := results || format('privilégio|visitante mantém SELECT em stops|%s|',
                               has_table_privilege('anon', 'public.stops', 'SELECT'));
  results := results || format('privilégio|visitante mantém SELECT na view|%s|',
                               has_table_privilege('anon', 'public.stop_latest_readings', 'SELECT'));
  results := results || format('privilégio|authenticated pode atualizar coluna name|%s|',
                               has_column_privilege('authenticated', 'public.stops', 'name', 'UPDATE'));
  results := results || format('privilégio|authenticated NÃO pode atualizar created_at|%s|',
                               not has_column_privilege('authenticated', 'public.stops', 'created_at', 'UPDATE'));
  results := results || format('privilégio|service_role mantém acesso a readings|%s|',
                               has_table_privilege('service_role', 'public.readings', 'INSERT'));

  -- Objetos NOVOS criados pelo postgres não recebem acesso automático.
  create table public.tmp_default_privileges_check (id int);
  create sequence public.tmp_default_privileges_seq;
  create function public.tmp_default_privileges_fn() returns int language sql as 'select 1';
  create function private.tmp_default_privileges_fn() returns int language sql as 'select 1';

  results := results || format('privilégio|tabela nova: anon sem SELECT|%s|',
                               not has_table_privilege('anon', 'public.tmp_default_privileges_check', 'SELECT'));
  results := results || format('privilégio|tabela nova: authenticated sem INSERT|%s|',
                               not has_table_privilege('authenticated', 'public.tmp_default_privileges_check', 'INSERT'));
  results := results || format('privilégio|tabela nova: service_role sem acesso automático|%s|',
                               not has_table_privilege('service_role', 'public.tmp_default_privileges_check', 'SELECT'));
  results := results || format('privilégio|sequência nova: anon sem USAGE|%s|',
                               not has_sequence_privilege('anon', 'public.tmp_default_privileges_seq', 'USAGE'));
  results := results || format('privilégio|função nova em public: anon sem EXECUTE|%s|',
                               not has_function_privilege('anon', 'public.tmp_default_privileges_fn()', 'EXECUTE'));
  results := results || format('privilégio|função nova em public: authenticated sem EXECUTE|%s|',
                               not has_function_privilege('authenticated', 'public.tmp_default_privileges_fn()', 'EXECUTE'));
  results := results || format('privilégio|função nova em private: anon sem EXECUTE|%s|',
                               not has_function_privilege('anon', 'private.tmp_default_privileges_fn()', 'EXECUTE'));

  -- ================================================================ RESULTADO
  insert into test_results
  select ord::int, split_part(r, '|', 1), split_part(r, '|', 2), split_part(r, '|', 3)::boolean, split_part(r, '|', 4)
  from unnest(results) with ordinality as t(r, ord);
end;
$$;

select n, profile, test, passed, detail from test_results
union all
select null, 'RESUMO', format('%s testes: %s aprovados, %s reprovados',
       count(*), count(*) filter (where passed), count(*) filter (where not passed)),
       bool_and(passed), null
from test_results
order by n nulls last;

rollback;
