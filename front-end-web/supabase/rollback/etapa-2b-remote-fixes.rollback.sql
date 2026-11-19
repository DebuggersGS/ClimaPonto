-- =============================================================================
-- ClimaPonto — PLANO DE RECUPERAÇÃO (não é migração; não executar sem decisão)
--
-- Desfaz, em ordem inversa, as três migrações de segurança aplicadas no
-- projeto remoto na Etapa 2B:
--   1. hide_test_readings
--   2. restrict_stop_write_columns
--   3. restrict_default_privileges
--
-- Nenhuma das migrações remove dados; este script também não remove dados.
-- Restaura exatamente o estado anterior observado no remoto em 09/11/2026.
-- Execute apenas o bloco correspondente à migração que precisar ser desfeita.
-- =============================================================================

-- 1. Desfaz hide_test_readings ------------------------------------------------
begin;
drop policy "Leituras públicas exceto testes; admins veem todas" on public.readings;
create policy "Leituras de pontos visíveis são públicas"
  on public.readings
  for select
  to anon, authenticated
  using (exists (select 1 from public.stops s where s.id = stop_id));
commit;

-- 2. Desfaz restrict_stop_write_columns ---------------------------------------
begin;
revoke insert (code, name, neighborhood, description, latitude, longitude, is_demo, active)
  on table public.stops from authenticated;
revoke update (code, name, neighborhood, description, latitude, longitude, is_demo, active)
  on table public.stops from authenticated;
grant insert, update on table public.stops to authenticated;
commit;

-- 3. Desfaz restrict_default_privileges ---------------------------------------
begin;
alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on functions to anon, authenticated, service_role;
alter default privileges for role postgres
  grant execute on functions to public;
commit;
