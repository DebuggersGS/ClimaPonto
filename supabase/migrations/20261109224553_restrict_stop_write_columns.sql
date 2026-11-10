-- =============================================================================
-- ClimaPonto — colunas graváveis de `stops`
--
-- Objetivo: impedir que o cliente (inclusive administradores) altere
-- `id`, `created_at` e `updated_at` pelas operações normais da API.
--
-- Interação entre privilégios no PostgreSQL: um GRANT de UPDATE na TABELA
-- autoriza todas as colunas e prevalece sobre qualquer restrição por coluna.
-- Por isso o privilégio de tabela é REVOGADO e substituído por privilégios
-- por COLUNA. O RLS continua decidindo QUEM pode escrever (só admins); os
-- privilégios de coluna decidem O QUE pode ser escrito.
--
--   * updated_at continua sendo atualizado pelo trigger stops_set_updated_at:
--     alterações feitas por trigger não passam por checagem de privilégio de
--     coluna.
--   * INSERT recebe a mesma restrição para que created_at/updated_at/id não
--     possam ser forjados na criação (usam os valores padrão do banco).
--   * DELETE e SELECT não mudam.
--   * service_role (credencial de servidor) mantém seus privilégios atuais.
-- =============================================================================

revoke insert, update on table public.stops from authenticated;

grant insert (code, name, neighborhood, description, latitude, longitude, is_demo, active)
  on table public.stops to authenticated;

grant update (code, name, neighborhood, description, latitude, longitude, is_demo, active)
  on table public.stops to authenticated;
