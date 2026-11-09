-- =============================================================================
-- ClimaPonto — privilégios padrão para objetos FUTUROS
--
-- Problema: por padrão, toda tabela, sequência ou função criada pelo papel
-- `postgres` no schema `public` recebe automaticamente acesso total para
-- anon, authenticated e service_role. Uma tabela nova criada sem RLS ficaria
-- exposta pela Data API.
--
-- Estratégia: a recomendada pela documentação oficial do Supabase
-- ("Securing your API › Default privileges for new tables and functions"):
-- revogar os privilégios padrão concedidos pelo papel `postgres` no schema
-- `public`. A partir daqui, cada novo objeto precisa de GRANT explícito,
-- como já fazem as migrações do ClimaPonto.
--
-- Escopo e efeitos:
--   * Afeta somente objetos CRIADOS DEPOIS desta migração. As tabelas, a view
--     e as funções existentes mantêm exatamente os grants atuais.
--   * Considera o papel `postgres`, que é quem executa as migrações (via SQL
--     Editor, CLI ou MCP). Os privilégios padrão do papel `supabase_admin`
--     pertencem à plataforma, não podem ser alterados pelo `postgres` e só
--     valem para objetos criados pela própria plataforma.
--   * service_role também deixa de receber acesso automático: tabelas futuras
--     usadas por Edge Functions precisam de GRANT explícito para service_role.
--   * Funções novas criadas pelo postgres em QUALQUER schema (inclusive
--     `private`, que tem USAGE para anon/authenticated) deixam de ser
--     executáveis por PUBLIC por padrão — ver explicação abaixo.
--   * Objetos de outros schemas (auth, storage, extensions, ...) não são
--     alterados.
-- =============================================================================

-- Tabelas (inclui views) -------------------------------------------------------
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;

-- Sequências ------------------------------------------------------------------
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;

-- Funções ---------------------------------------------------------------------
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;

-- O PostgreSQL concede EXECUTE a PUBLIC em toda função nova, e anon e
-- authenticated herdam de PUBLIC. Esse é um privilégio padrão GLOBAL e,
-- segundo a documentação do PostgreSQL (ALTER DEFAULT PRIVILEGES, "Notes"),
-- privilégios padrão definidos por schema apenas SE SOMAM aos globais: um
-- "revoke ... in schema public ... from public" não tem efeito sobre ele
-- (comprovado no teste local). Por isso a revogação de PUBLIC é global para
-- o papel postgres: vale para funções que o postgres criar em qualquer schema
-- (public, private, ...). Funções novas passam a exigir GRANT EXECUTE
-- explícito, como private.is_admin() já faz.
alter default privileges for role postgres
  revoke execute on functions from public;
