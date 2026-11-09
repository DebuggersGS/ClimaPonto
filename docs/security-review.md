# Revisão de segurança — Etapa 2A

Data: 09/11/2026. Projeto Supabase `climaponto-gs-2026` (região `sa-east-1`).

Todas as verificações abaixo foram feitas com **consultas somente leitura** ao catálogo do PostgreSQL, ao *Security Advisor* do Supabase, ao histórico Git e ao build de produção. Nenhum dado foi alterado.

## 1. Resultado por item

| Item verificado | Resultado | Evidência |
| --- | --- | --- |
| RLS habilitado nas tabelas expostas | ✅ | `pg_class.relrowsecurity = true` em `stops` e `readings`. |
| View com `security_invoker` | ✅ | `stop_latest_readings` com `reloptions = {security_invoker=true}`: aplica o RLS de quem consulta. |
| Leitura pública limitada | ✅ | `stops`: `active OR is_admin()`. `readings`: apenas de pontos visíveis a quem consulta. |
| Ausência de escrita pública | ✅ | `anon` tem somente `SELECT` nas três relações. `authenticated` tem escrita apenas em `stops`, filtrada pelo RLS para admins. Nenhuma escrita em `readings` para papéis do navegador. |
| Admin via `app_metadata` | ✅ | `private.is_admin()` lê `auth.jwt() -> 'app_metadata' ->> 'role'`. Nenhuma ocorrência de `user_metadata` no código. Função `SECURITY INVOKER`, com `search_path` vazio, em schema não exposto pela API. |
| Nenhuma secret/service role key exposta | ✅ | O front-end lê apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. A ocorrência de `sb_secret_` no bundle é código do `supabase-js` que **reconhece o prefixo** de chaves, não uma chave. |
| Credenciais nos commits | ✅ | Busca em todas as versões de todos os arquivos do histórico (`git log --all -p`) por chaves `sb_publishable_`/`sb_secret_`, JWTs, tokens do GitHub e pelo identificador do projeto: nada encontrado. O único arquivo `.env*` versionado é `web/.env.example`, sem valores. |
| Restrições de integridade | ✅ | 17 restrições ativas: chaves primárias, `UNIQUE(code)`, `UNIQUE(stop_id, measured_at)`, FK `ON DELETE RESTRICT` e 11 `CHECK` de formato e faixa. |
| *Security Advisor* do Supabase | ✅ | Nenhum alerta. |

## 2. Pontos de atenção encontrados

### 2.1 Privilégios padrão do schema `public` (risco latente — correção proposta)

O projeto mantém os privilégios padrão do Supabase: **toda tabela, função ou sequência criada no futuro em `public` recebe automaticamente todas as permissões para `anon` e `authenticated`**. As tabelas atuais não são afetadas, pois as permissões delas foram revogadas e concedidas explicitamente. Porém, uma tabela nova criada sem RLS na Etapa 2B ou depois ficaria **gravável por qualquer visitante**.

**Correção mínima proposta** (nova migração; não destrutiva, só altera permissões de objetos futuros; **ainda não aplicada**, aguarda aprovação):

```sql
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, public;
```

Depois disso, cada nova tabela precisa de `grant` explícito, como já é feito hoje. Os privilégios padrão definidos pelo papel `supabase_admin` não podem ser alterados pelo papel `postgres`; eles só afetam objetos criados por `supabase_admin`, o que não ocorre nas nossas migrações.

### 2.2 Admin pode alterar `created_at` (baixo)

O `UPDATE` em `stops` vale para todas as colunas. Um admin pode editar `created_at`. O `id` não pode ser trocado se houver leituras, por causa da FK, e `updated_at` é sobrescrito pelo trigger. **Proposta para a Etapa 2B:** conceder `UPDATE` só nas colunas editáveis (`code, name, neighborhood, description, latitude, longitude, is_demo, active`).

### 2.3 Leituras `test` ficam públicas (decisão necessária)

A política atual mostra a visitantes **todas** as leituras de pontos ativos, inclusive `source = 'test'`. Hoje não há leituras. Opções: (a) manter, com a interface sinalizando a origem; (b) restringir leituras `test` a admins na política de `SELECT`.

### 2.4 Revogação de admin não é imediata (aceitável, documentado)

O papel é lido do JWT. Ao remover o papel de um admin, ele mantém acesso até o token expirar (padrão: 1 hora).

### 2.5 Cadastro público (pendente, verificação manual)

A configuração *Allow new users to sign up* não é acessível pelas ferramentas usadas. **Precisa ser verificada e desativada no painel.** Mesmo ativa, um usuário cadastrado não ganharia permissão de escrita, porque não teria `app_metadata.role = 'admin'`.

## 3. Testes SQL de RLS (`supabase/tests/rls_policies.test.sql`)

**Não executado no banco remoto.** A execução pela integração do Supabase foi recusada duas vezes na Etapa 2A. Por decisão da revisão técnica, não deve ser executado no remoto sem nova autorização específica.

### O que o arquivo faz

1. `BEGIN` e criação de uma tabela temporária de resultados (`ON COMMIT DROP`).
2. **Fixtures próprias**, criadas pelo teste: pontos `TEST-ACTIVE` (ativo) e `TEST-HIDDEN` (inativo), e uma leitura `source='test'` para cada um.
3. Para cada perfil, troca o papel do Postgres (`set_config('role', ...)`) e as claims do JWT (`set_config('request.jwt.claims', ...)`, lidas por `auth.jwt()`):
   - **Anônimo:** `role=anon`, claims `{"role":"anon"}`.
   - **Usuário comum:** `role=authenticated`, claims com `sub` fictício e `app_metadata` vazio.
   - **Administrador:** `role=authenticated`, claims com `app_metadata.role = "admin"`.
4. Para cada perfil, executa `SELECT`, `INSERT`, `UPDATE` e `DELETE` sobre as fixtures e registra se o resultado foi o esperado: erro `42501`, zero linhas afetadas, ou sucesso.
5. Como `postgres`, testa restrições: umidade acima de 100, origem desconhecida, medição no futuro, leitura duplicada, código fora do padrão e latitude sem longitude. Todas devem ser rejeitadas.
6. Exibe a tabela de resultados (`passed = true/false`).
7. `ROLLBACK`.

### Garantias e limites

- **Reversão:** todas as alterações acontecem entre `BEGIN` e `ROLLBACK`. Se ocorrer um erro inesperado, a transação é abortada e também nada é gravado.
- **Registros reais:** nenhum registro real é usado como fixture nem é alvo de escrita. As escritas usam apenas `TEST-*` ou um `id` de fixture. O teste só lê o catálogo e as próprias fixtures. Requisito: nenhum ponto real com código `TEST-ACTIVE`, `TEST-HIDDEN`, `TEST-ADMIN` ou `TEST-LAT`. Se existir, o teste falha no `INSERT` e reverte tudo.
- **Limite:** simula as claims do JWT, mas **não** testa a emissão real de tokens pelo Supabase Auth. Esse fluxo será coberto pelos testes da Etapa 2B, com contas reais de teste.

### Execução isolada proposta (ambiente local)

Docker 29.6.2 está instalado nesta máquina. Com a CLI do Supabase (executada via `npx`, sem instalação global):

```bash
npx supabase init                 # cria supabase/config.toml (manter as pastas existentes)
npx supabase start                # sobe Postgres + Auth + API locais em Docker
npx supabase db reset             # aplica migrations/ e seed.sql no banco LOCAL
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/rls_policies.test.sql
npx supabase stop
```

Opcionalmente, converter o arquivo para **pgTAP** e rodar com `npx supabase test db`, que é o padrão da CLI. O banco remoto não é tocado em nenhum passo.

**Observação:** `supabase start` baixa várias imagens Docker (alguns GB) na primeira execução.
