# Revisão de segurança — ClimaPonto

Projeto Supabase remoto: `climaponto-gs-2026` (região `sa-east-1`).
Ambiente local de testes: `supabase/config.toml` com `project_id = "climaponto-local"`. A pasta **não** está vinculada ao projeto remoto (`supabase link` nunca foi executado).

---

## 1. Revisão inicial (Etapa 2A, 09/11/2026)

Feita só com **consultas de leitura** ao catálogo do PostgreSQL remoto, ao *Security Advisor*, ao histórico Git e ao build.

| Item verificado | Resultado |
| --- | --- |
| RLS habilitado em `stops` e `readings` | ✅ |
| View `stop_latest_readings` com `security_invoker = true` | ✅ |
| Escrita pública inexistente (`anon` só tem `SELECT`) | ✅ |
| Admin via `app_metadata` (sem uso de `user_metadata`) | ✅ |
| Nenhuma *secret key* ou *service role key* no front-end | ✅ A ocorrência de `sb_secret_` no bundle é código do `supabase-js` que reconhece prefixos de chave. |
| Nenhuma credencial no histórico Git (`git log --all -p`) | ✅ |
| 17 restrições de integridade ativas | ✅ |
| *Security Advisor* | ✅ sem alertas |

Problemas identificados e encaminhados na seção 2: privilégios padrão do schema `public`, `created_at` editável por admin e leituras `test` públicas.

Outros pontos (aceitos e documentados):

- **Revogação de admin não é imediata:** o papel vem do JWT e vale até o token expirar (padrão 1 h).
- **Cadastro público no remoto:** precisa ser desativado manualmente no painel (*Authentication › Sign In / Providers › Allow new users to sign up*). No ambiente local já está desativado no `config.toml`.

---

## 2. Fechamento da Etapa 2A — correções (não aplicadas no remoto)

Três migrações novas. **Foram testadas apenas localmente; nenhuma foi aplicada no projeto remoto.** Aguardam revisão.

| Migração | Problema | Correção |
| --- | --- | --- |
| `20261109230000_restrict_default_privileges.sql` | Objetos futuros criados pelo papel `postgres` em `public` recebiam acesso total para `anon`, `authenticated` e `service_role`, e funções novas recebiam `EXECUTE` para `PUBLIC`. | Revoga esses privilégios padrão, seguindo a estratégia da documentação do Supabase (*Securing your API › Default privileges*). |
| `20261109230100_restrict_stop_write_columns.sql` | Admin podia alterar `created_at`, `updated_at` e `id`, e definir `created_at` ao criar. | Troca o `INSERT`/`UPDATE` de tabela por privilégios por **coluna**, só nos campos editáveis. |
| `20261109230200_hide_test_readings.sql` | Leituras `test` eram públicas. | Nova política: `simulation`/`sensor` públicas em pontos visíveis; `test` só para admins. |

### 2.1 Privilégios padrão — papéis proprietários e decisão

Estado observado no remoto (`pg_default_acl`) para o schema `public`: há entradas definidas por `postgres` **e** por `supabase_admin`, ambas concedendo acesso total a `anon`, `authenticated` e `service_role`.

- As migrações do ClimaPonto são executadas pelo papel **`postgres`** (SQL Editor, MCP e CLI). Por isso a correção altera os privilégios padrão **desse papel**.
- As entradas de `supabase_admin` pertencem à plataforma, não podem ser alteradas pelo `postgres` e só valem para objetos que a plataforma criar.
- **Ponto importante descoberto no teste local:** a documentação do Supabase sugere `alter default privileges for role postgres in schema public revoke execute on functions from public`. No PostgreSQL, porém, privilégios padrão definidos **por schema só se somam aos globais** (documentação do PostgreSQL, *ALTER DEFAULT PRIVILEGES › Notes*). Como o `EXECUTE` para `PUBLIC` é um padrão **global**, esse comando não tem efeito, e o teste local comprovou isso: 3 falhas. A migração faz então a revogação de `PUBLIC` em nível **global** para o papel `postgres`. Consequência: funções novas criadas pelo `postgres` em qualquer schema exigem `GRANT EXECUTE` explícito. Objetos de outros schemas (`auth`, `storage`, `extensions`) não são alterados.
- `service_role` também deixa de receber acesso automático a objetos novos. A futura tabela de credenciais e as funções da ingestão precisarão de `GRANT` explícito.

### 2.2 Privilégios por coluna em `stops`

No PostgreSQL, `GRANT UPDATE` na **tabela** autoriza todas as colunas e prevalece sobre restrições por coluna. Por isso a migração **revoga** o privilégio de tabela e concede `INSERT`/`UPDATE` só em `code, name, neighborhood, description, latitude, longitude, is_demo, active`.

- O RLS continua definindo **quem** escreve (só admins); os privilégios de coluna definem **o quê**.
- `updated_at` continua sendo atualizado pelo trigger, porque alterações feitas por trigger não passam por checagem de privilégio de coluna.
- `service_role` não é afetado.

### 2.3 Visibilidade das leituras

A política usa uma lista de origens **permitidas** (`simulation`, `sensor`), e não "diferente de `test`". Assim, uma origem nova nasce privada.

Com `security_invoker = true`, a view `stop_latest_readings` mostra **a última leitura que cada perfil pode ver**: para visitantes, uma leitura `test` mais recente é ignorada e aparece a última `simulation`; para admins, aparece a `test`.

---

## 3. Testes locais

### 3.1 Ambiente usado

O plano aprovado era Supabase CLI + Docker. **O Docker Desktop não conseguiu iniciar**, porque o WSL 2 não estava instalado (requisito no Windows 11 Home). O WSL foi instalado nesta etapa, mas **exige reiniciar o Windows**, o que não foi feito.

Como alternativa, autorizada pelo integrante, os testes rodaram em **PostgreSQL 17.10 embarcado** (pacote npm `embedded-postgres@17.10.0-beta.17`, instalado só na pasta temporária da sessão, fora do repositório). Antes das migrações, foi aplicado um *bootstrap* que reproduz o que o Supabase provisiona:

```sql
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create schema auth;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim', true), ''),
                  nullif(current_setting('request.jwt.claims', true), ''))::jsonb
$$;  -- mesma definição usada pelo Supabase
grant usage on schema auth, public to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on functions to anon, authenticated, service_role;
```

**Limites dessa emulação:** não inclui Supabase Auth, PostgREST nem os demais serviços. O `postgres` local é superusuário, enquanto no Supabase não é; os testes trocam para `anon`/`authenticated`, então isso não afeta as verificações de permissão. **O teste com Supabase CLI + Docker continua pendente.**

### 3.2 Resultados (`supabase/tests/rls_policies.test.sql`, 50 verificações)

| Perfil | Somente migrações já aplicadas no remoto (*baseline*) | Todas as migrações |
| --- | --- | --- |
| Visitante | 8/10 | **10/10** |
| Usuário comum | 6/7 | **7/7** |
| Administrador | 10/15 | **15/15** |
| Restrições de integridade | 6/6 | **6/6** |
| Privilégios (existentes e de objetos novos) | 4/12 | **12/12** |
| **Total** | **34/50** | **50/50** |

As 16 falhas do *baseline* são justamente os comportamentos que as novas migrações corrigem: leituras `test` visíveis (3), `created_at`/`updated_at`/`id` editáveis (5, sendo uma consequência em cascata da troca de `id`), privilégio de coluna (1) e privilégios automáticos de objetos novos (7). Isso mostra que **o estado atual do remoto tem essas 16 lacunas** até as migrações serem aplicadas.

Nos dois cenários, nenhum registro `TEST-*` permaneceu após o `ROLLBACK`.

**Problemas encontrados durante os testes:**

1. Erro no próprio teste: em PL/pgSQL, `text[] || 'literal'` interpretava o literal como array (`malformed array literal`) nos ramos de sucesso. Corrigido com `text '...'`; as expectativas não mudaram.
2. Erro real na migração: a revogação de `EXECUTE` de `PUBLIC` por schema não tem efeito (seção 2.1). Corrigido com revogação global.

### 3.3 Como repetir com Supabase CLI (após reiniciar o Windows)

```bash
# na raiz do repositório; o Docker Desktop precisa estar em execução
npx supabase@2.122.0 start        # ambiente LOCAL
npx supabase@2.122.0 db reset     # SOMENTE local: aplica migrations/ + seed.sql
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/rls_policies.test.sql
npx supabase@2.122.0 stop
```

Proibido nesta fase: `db push`, `db reset --linked/--remote` ou qualquer comando contra o projeto remoto.

---

## 4. Estratégia de autenticação dos dispositivos (aprovada como direção; não implementada)

**Decisões registradas:**

1. Cada dispositivo tem **credencial própria**, aleatória (≥ 32 bytes, formato sugerido `cpd_<base64url>`) e **revogável**.
2. O banco guarda **somente o hash**. Para tokens aleatórios de alta entropia, **SHA-256** é adequado; algoritmos lentos (bcrypt/argon2) servem para senhas escolhidas por pessoas. Opcional: HMAC-SHA-256 com um *pepper* guardado como segredo da função, para que um vazamento só do banco não permita verificar tokens. A comparação deve ser em tempo constante.
3. Credenciais **nunca** aparecem em código público, no Git ou em projetos Wokwi públicos. No Wokwi, o token fica só em projeto privado; o projeto público roda sem envio (modo local).
4. A tabela de credenciais fica em schema **não exposto** pela Data API, por exemplo `private.device_credentials (id, stop_id, token_hash, allowed_source, active, last_seen_at, created_at, revoked_at)`. RLS habilitado, sem políticas e sem grants para `anon`/`authenticated`.
5. O endpoint verifica se a credencial pertence ao **dispositivo e ao ponto** (`stop_code`) informados.
6. Validação: corpo JSON de até ~1 KB, só campos conhecidos, faixas e formatos, `measured_at` coerente e `environmental_status` coerente com a `rules_version`. Frequência: recusa envios abaixo do intervalo mínimo por dispositivo (`429`). Erros no formato do contrato de dados.
7. Leituras de dispositivos Wokwi são gravadas sempre como `source = 'simulation'`: o servidor força a origem definida na credencial e ignora o valor enviado.

**Gateway das Edge Functions:** por padrão, o gateway exige um **JWT válido** no cabeçalho `Authorization`, e um token opaco seria recusado antes de chegar ao código. Para essa função específica será necessário:

```toml
# supabase/config.toml
[functions.ingest-reading]
verify_jwt = false
```

Com isso, **qualquer requisição chega à função**, e é obrigação do código recusar tudo o que não tiver credencial válida (`401`), antes de qualquer outro processamento. Nenhuma outra função deve desabilitar `verify_jwt`.

**Acesso aos dados pela função** (decidir na implementação): o schema `private` não é acessível pela API REST. Opções: conexão direta ao Postgres pela variável de ambiente da função, ou uma função SQL `SECURITY DEFINER` com `EXECUTE` concedido apenas a `service_role`.
