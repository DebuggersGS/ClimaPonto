-- =============================================================================
-- ClimaPonto — testes de permissões (RLS + grants) e restrições
--
-- Como executar: cole no SQL Editor do Supabase (ou rode via MCP/psql) como
-- usuário postgres. Tudo acontece dentro de uma transação finalizada com
-- ROLLBACK: nenhum dado de teste permanece no banco.
--
-- Simula cada perfil trocando o papel do Postgres (anon / authenticated) e as
-- claims do JWT lidas por auth.jwt(). O resultado é uma tabela com cada teste,
-- o esperado e o obtido.
-- =============================================================================

begin;

create temp table test_results (n int, profile text, test text, passed boolean, detail text) on commit drop;

do $$
declare
  results  text[] := '{}';
  demo_id  uuid;
  hidden_id uuid;
  new_id   uuid;
  cnt      int;
  st       text;

  -- claims usadas para simular usuários
  user_claims  constant text := '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{}}';
  admin_claims constant text := '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{"role":"admin"}}';
begin
  -- ---------------------------------------------------------------- fixtures
  insert into public.stops (code, name, neighborhood, is_demo, active)
  values ('TEST-HIDDEN', 'Ponto de teste inativo', 'Teste', true, false)
  returning id into hidden_id;

  select id into demo_id from public.stops where active order by code limit 1;

  insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
  values (demo_id,   25.0, 60.0, 'test', now() - interval '1 minute'),
         (hidden_id, 26.0, 55.0, 'test', now() - interval '1 minute');

  -- ============================================================ ANON (visitante)
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);

  select count(*) into cnt from public.stops where id = demo_id;
  results := results || format('anon|vê ponto ativo|%s|count=%s', cnt = 1, cnt);

  select count(*) into cnt from public.stops where id = hidden_id;
  results := results || format('anon|NÃO vê ponto inativo|%s|count=%s', cnt = 0, cnt);

  select count(*) into cnt from public.readings where stop_id = demo_id;
  results := results || format('anon|vê leitura de ponto ativo|%s|count=%s', cnt = 1, cnt);

  select count(*) into cnt from public.readings where stop_id = hidden_id;
  results := results || format('anon|NÃO vê leitura de ponto inativo|%s|count=%s', cnt = 0, cnt);

  select count(*) into cnt from public.stop_latest_readings where stop_id in (demo_id, hidden_id);
  results := results || format('anon|view última leitura respeita RLS|%s|count=%s', cnt = 1, cnt);

  begin
    insert into public.stops (code, name, neighborhood) values ('ANON-X', 'Invasor', 'Teste');
    results := results || 'anon|NÃO cria ponto|false|insert aceito';
  exception when insufficient_privilege then
    results := results || format('anon|NÃO cria ponto|true|%s', sqlerrm);
  end;

  begin
    update public.stops set name = 'Alterado' where id = demo_id;
    results := results || 'anon|NÃO edita ponto|false|update aceito';
  exception when insufficient_privilege then
    results := results || format('anon|NÃO edita ponto|true|%s', sqlerrm);
  end;

  begin
    delete from public.stops where id = demo_id;
    results := results || 'anon|NÃO exclui ponto|false|delete aceito';
  exception when insufficient_privilege then
    results := results || format('anon|NÃO exclui ponto|true|%s', sqlerrm);
  end;

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    values (demo_id, 30, 50, 'sensor', now());
    results := results || 'anon|NÃO insere leitura|false|insert aceito';
  exception when insufficient_privilege then
    results := results || format('anon|NÃO insere leitura|true|%s', sqlerrm);
  end;

  -- ================================================= AUTHENTICATED (não admin)
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', user_claims, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into cnt from public.stops where id = hidden_id;
  results := results || format('usuário|NÃO vê ponto inativo|%s|count=%s', cnt = 0, cnt);

  begin
    insert into public.stops (code, name, neighborhood) values ('USER-X', 'Não admin', 'Teste');
    results := results || 'usuário|NÃO cria ponto|false|insert aceito';
  exception when insufficient_privilege then
    results := results || format('usuário|NÃO cria ponto|true|%s', sqlerrm);
  end;

  update public.stops set name = 'Alterado' where id = demo_id;
  get diagnostics cnt = row_count;
  results := results || format('usuário|NÃO edita ponto|%s|linhas afetadas=%s', cnt = 0, cnt);

  delete from public.stops where id = demo_id;
  get diagnostics cnt = row_count;
  results := results || format('usuário|NÃO exclui ponto|%s|linhas afetadas=%s', cnt = 0, cnt);

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    values (demo_id, 30, 50, 'sensor', now());
    results := results || 'usuário|NÃO insere leitura|false|insert aceito';
  exception when insufficient_privilege then
    results := results || format('usuário|NÃO insere leitura|true|%s', sqlerrm);
  end;

  -- ======================================================= ADMINISTRADOR
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', admin_claims, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into cnt from public.stops where id = hidden_id;
  results := results || format('admin|vê ponto inativo|%s|count=%s', cnt = 1, cnt);

  begin
    insert into public.stops (code, name, neighborhood, is_demo)
    values ('TEST-ADMIN', 'Ponto criado pelo admin', 'Teste', true)
    returning id into new_id;
    results := results || 'admin|cria ponto|true|insert aceito';
  exception when others then
    results := results || format('admin|cria ponto|false|%s', sqlerrm);
  end;

  update public.stops set description = 'Editado no teste' where id = new_id;
  get diagnostics cnt = row_count;
  results := results || format('admin|edita ponto|%s|linhas afetadas=%s', cnt = 1, cnt);

  delete from public.stops where id = new_id;
  get diagnostics cnt = row_count;
  results := results || format('admin|exclui ponto sem leituras|%s|linhas afetadas=%s', cnt = 1, cnt);

  begin
    delete from public.stops where id = demo_id;
    results := results || 'admin|NÃO exclui ponto com leituras (integridade)|false|delete aceito';
  exception when foreign_key_violation then
    results := results || format('admin|NÃO exclui ponto com leituras (integridade)|true|%s', sqlerrm);
  end;

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    values (demo_id, 30, 50, 'sensor', now());
    results := results || 'admin|NÃO insere leitura arbitrária|false|insert aceito';
  exception when insufficient_privilege then
    results := results || format('admin|NÃO insere leitura arbitrária|true|%s', sqlerrm);
  end;

  begin
    update public.readings set temperature_c = 99 where stop_id = demo_id;
    results := results || 'admin|NÃO edita leitura|false|update aceito';
  exception when insufficient_privilege then
    results := results || format('admin|NÃO edita leitura|true|%s', sqlerrm);
  end;

  -- ============================================== RESTRIÇÕES (como postgres)
  perform set_config('role', 'postgres', true);

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    values (demo_id, 25, 120, 'test', now() - interval '2 minutes');
    results := results || 'restrição|umidade > 100 rejeitada|false|aceito';
  exception when check_violation then
    results := results || format('restrição|umidade > 100 rejeitada|true|%s', sqlerrm);
  end;

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    values (demo_id, 25, 50, 'esp32', now() - interval '3 minutes');
    results := results || 'restrição|origem desconhecida rejeitada|false|aceito';
  exception when check_violation then
    results := results || format('restrição|origem desconhecida rejeitada|true|%s', sqlerrm);
  end;

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    values (demo_id, 25, 50, 'test', now() + interval '1 hour');
    results := results || 'restrição|medição no futuro rejeitada|false|aceito';
  exception when check_violation then
    results := results || format('restrição|medição no futuro rejeitada|true|%s', sqlerrm);
  end;

  begin
    insert into public.readings (stop_id, temperature_c, humidity_pct, source, measured_at)
    select stop_id, temperature_c, humidity_pct, source, measured_at
    from public.readings where stop_id = demo_id limit 1;
    results := results || 'restrição|leitura duplicada rejeitada|false|aceito';
  exception when unique_violation then
    results := results || format('restrição|leitura duplicada rejeitada|true|%s', sqlerrm);
  end;

  begin
    insert into public.stops (code, name, neighborhood) values ('demo minúsculo', 'Código inválido', 'Teste');
    results := results || 'restrição|código fora do padrão rejeitado|false|aceito';
  exception when check_violation then
    results := results || format('restrição|código fora do padrão rejeitado|true|%s', sqlerrm);
  end;

  begin
    insert into public.stops (code, name, neighborhood, latitude) values ('TEST-LAT', 'Só latitude', 'Teste', -23.5);
    results := results || 'restrição|latitude sem longitude rejeitada|false|aceito';
  exception when check_violation then
    results := results || format('restrição|latitude sem longitude rejeitada|true|%s', sqlerrm);
  end;

  -- ---------------------------------------------------------------- resultado
  insert into test_results
  select ord::int, split_part(r, '|', 1), split_part(r, '|', 2), split_part(r, '|', 3)::boolean, split_part(r, '|', 4)
  from unnest(results) with ordinality as t(r, ord);
end;
$$;

select n, profile, test, passed, detail from test_results order by n;

rollback;
