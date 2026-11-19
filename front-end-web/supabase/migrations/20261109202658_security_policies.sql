-- =============================================================================
-- ClimaPonto — permissões e Row Level Security
--
-- Modelo:
--   * Visitante (anon) e usuário autenticado comum: somente leitura de pontos
--     ativos e das leituras desses pontos.
--   * Administrador (authenticated com app_metadata.role = 'admin'): gerencia
--     pontos (criar, editar, excluir, ver inativos). NÃO insere leituras.
--   * Leituras só entram pelo futuro endpoint de ingestão protegido
--     (Edge Function com credencial de servidor), nunca pelo navegador.
--
-- app_metadata só pode ser alterado com credencial de servidor (painel/SQL),
-- portanto um usuário não consegue se promover a administrador.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Função auxiliar: o usuário atual é administrador?
-- -----------------------------------------------------------------------------
create function private.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.set_updated_at() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Grants explícitos (não depender dos privilégios padrão do projeto)
-- -----------------------------------------------------------------------------
revoke all on table public.stops, public.readings, public.stop_latest_readings
  from anon, authenticated;

grant select on table public.stops, public.readings, public.stop_latest_readings
  to anon, authenticated;

-- Escrita em stops só para usuários autenticados; o RLS restringe a admins.
grant insert, update, delete on table public.stops to authenticated;

-- Nenhum grant de escrita em readings para anon/authenticated.

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.stops    enable row level security;
alter table public.readings enable row level security;

-- stops: leitura -------------------------------------------------------------
create policy "Pontos ativos são públicos; admins veem todos"
  on public.stops
  for select
  to anon, authenticated
  using (active or (select private.is_admin()));

-- stops: escrita (somente admin) ----------------------------------------------
create policy "Admins criam pontos"
  on public.stops
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins editam pontos"
  on public.stops
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins excluem pontos"
  on public.stops
  for delete
  to authenticated
  using ((select private.is_admin()));

-- readings: leitura -----------------------------------------------------------
-- Visível quando o ponto é visível para quem consulta (o RLS de stops
-- também se aplica dentro desta subconsulta).
create policy "Leituras de pontos visíveis são públicas"
  on public.readings
  for select
  to anon, authenticated
  using (exists (select 1 from public.stops s where s.id = stop_id));

-- readings: sem políticas de insert/update/delete => negado para anon e
-- authenticated (inclusive admins). A ingestão usará credencial de servidor.
