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

## 2. Fechamento da Etapa 2A — correções (aplicadas no remoto na Etapa 2B, ver seção 5)

Três migrações, testadas localmente na Etapa 2A e **aplicadas no projeto remoto na Etapa 2B** (seção 5). Os nomes dos arquivos foram alinhados às versões registradas no remoto.

| Migração | Problema | Correção |
| --- | --- | --- |
| `20261109224540_restrict_default_privileges.sql` | Objetos futuros criados pelo papel `postgres` em `public` recebiam acesso total para `anon`, `authenticated` e `service_role`, e funções novas recebiam `EXECUTE` para `PUBLIC`. | Revoga esses privilégios padrão, seguindo a estratégia da documentação do Supabase (*Securing your API › Default privileges*). |
| `20261109224553_restrict_stop_write_columns.sql` | Admin podia alterar `created_at`, `updated_at` e `id`, e definir `created_at` ao criar. | Troca o `INSERT`/`UPDATE` de tabela por privilégios por **coluna**, só nos campos editáveis. |
| `20261110193817_hide_test_readings.sql` | Leituras `test` eram públicas. | Nova política: `simulation`/`sensor` públicas em pontos visíveis; `test` só para admins. |

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

**Limites dessa emulação:** não inclui Supabase Auth, PostgREST nem os demais serviços. O `postgres` local é superusuário, enquanto no Supabase não é; os testes trocam para `anon`/`authenticated`, então isso não afeta as verificações de permissão.

#### Validação com Supabase CLI + Docker (concluída após reiniciar o Windows)

- Ambiente: Docker Desktop 29.6.2 (WSL 2), Supabase CLI 2.122.0 via `npx`, imagem oficial `supabase/postgres:17.11.0.006` (PostgreSQL 17.11). Serviços em execução: Postgres, Auth (GoTrue v2.197.0), Data API (PostgREST v16.5) e gateway (Kong). Studio, Storage, Realtime, logs e Edge Runtime foram excluídos com `-x` por não serem necessários.
- No ambiente oficial, o papel `postgres` **não** é superusuário (`rolsuper = false`, `rolbypassrls = true`), como no projeto hospedado.
- `supabase start` e depois `supabase db reset --local` (apenas local) aplicaram as **5 migrações** e o `seed.sql` sem erro, reconstruindo o banco do zero.
- `supabase/tests/rls_policies.test.sql` via `psql` dentro do container: **50/50 aprovados** (visitante 10/10, usuário 7/7, admin 15/15, restrições 6/6, privilégios 12/12). Zero registros `TEST-*` após o `ROLLBACK`.
- **Teste com tokens reais do Supabase Auth** (`web/scripts/check-supabase-roles.mjs`): duas contas de teste criadas apenas no Auth **local** (`admin.teste@climaponto.local` com `app_metadata.role = 'admin'` e `usuario.teste@climaponto.local` sem papel), com senhas aleatórias geradas em memória. Resultado: **14/14**. O usuário comum não cria pontos (`42501`), não edita nem exclui (0 linhas) e não vê pontos inativos. O admin cria, edita campos autorizados, desativa, vê inativos e exclui pontos sem leituras, mas não altera `created_at` (`42501`) nem insere leituras (`42501`). O ponto `TEST-ROLES-*` criado foi excluído pelo próprio teste.
- `check-supabase-access.mjs` (visitante) contra o ambiente local: **8/8**.
- A pasta continua **sem vínculo** com o projeto remoto (`supabase/.temp/project-ref` inexistente).

### 3.2 Resultados no PostgreSQL embarcado (`supabase/tests/rls_policies.test.sql`, 50 verificações)

Os resultados finais foram confirmados depois no Supabase local oficial (seção 3.1). A comparação abaixo, entre o estado do remoto e o estado com as migrações novas, foi feita no ambiente embarcado.

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

### 3.3 Como repetir com Supabase CLI

```bash
# na raiz do repositório; o Docker Desktop precisa estar em execução
npx supabase@2.122.0 start -x studio,imgproxy,vector,logflare,edge-runtime,realtime,storage-api,mailpit,postgres-meta,supavisor
npx supabase@2.122.0 db reset --local     # SOMENTE local: aplica migrations/ + seed.sql
docker exec -i supabase_db_climaponto-local psql -U postgres -d postgres < supabase/tests/rls_policies.test.sql
npx supabase@2.122.0 stop
```

Para o teste com tokens reais, crie no Auth local uma conta admin (`app_metadata.role = 'admin'`) e uma comum, coloque `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `CHECK_*` em `web/.env.check.local` (não versionado) e rode `npm run check:supabase:roles` em `web/`. O script recusa endereços não locais, porque grava dados de teste.

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

---

## 5. Etapa 2B — aplicação no remoto e testes da área administrativa (10/11/2026)

### 5.1 Migrações no projeto remoto

**Verificação prévia** (somente leitura):
- Projeto `climaponto-gs-2026`, `ACTIVE_HEALTHY`.
- 2 migrações aplicadas.
- Política antiga de `readings` presente; grants de tabela em `stops`; privilégios padrão de fábrica.
- Dados: 3 pontos e 0 leituras.

**Plano de recuperação** escrito antes da aplicação: `supabase/rollback/etapa-2b-remote-fixes.rollback.sql`. Não foi usado.

| Migração | Resultado |
| --- | --- |
| `restrict_default_privileges` (versão `20261109224540`) | Aplicada. |
| `restrict_stop_write_columns` (versão `20261109224553`) | Aplicada. |
| `hide_test_readings` (versão `20261110193817`) | Detalhado abaixo. |

**Histórico da `hide_test_readings`:**
- **1ª tentativa:** erro 502 do proxy da integração. A verificação posterior confirmou que **não** tinha sido aplicada; o banco estava consistente.
- **2ª tentativa:** **recusada** pela integração, provavelmente por conter `DROP POLICY`. As alterações remotas foram interrompidas e o caso, reportado.
- **Reescrita sem `DROP`:** a migração passou a usar `ALTER POLICY`, que troca a expressão e o nome da política existente. A política final é a mesma e não existe nenhum instante sem política. Essa versão passou nos testes **50/50** no Supabase local.
- **3ª tentativa:** aplicada depois da aprovação do integrante.

**Verificação posterior:**
- 5 migrações no histórico.
- Política nova ativa.
- `authenticated` com `DELETE`/`SELECT` na tabela `stops` e `INSERT`/`UPDATE` apenas nas 8 colunas editáveis.
- Privilégios padrão de `public` restritos ao `postgres`; `EXECUTE` de funções revogado de `PUBLIC` globalmente.
- Dados intactos (3 pontos, 0 leituras).
- *Security Advisor* sem alertas.
- `npm run check:supabase` (visitante, API real do remoto): **8/8**.
- Nenhum `db reset`, `db push` ou comando destrutivo foi executado no remoto.

### 5.2 Testes no Supabase local (mesmas 5 migrações)

- `db reset --local` com os arquivos renomeados: aplicou as 5 migrações e o seed.
- Suíte SQL: **50/50**.
- `check-supabase-roles.mjs` com tokens reais: **14/14**.
- **Interface de ponta a ponta:** script de teste fora do repositório, com o Chrome headless controlado via DevTools Protocol, o Vite apontando para o Supabase local e contas de teste criadas só no Auth local. Resultado: **21/21 cenários**.
  - **Acesso:** rota protegida sem login redireciona; senha errada; usuário comum recusado; login de admin.
  - **Formulário:** validação de campos vazios, de código inválido e de latitude sem longitude; cadastro válido; código duplicado.
  - **Operações:** edição; desativação com confirmação; filtro e pesquisa; página pública sem ponto inativo; reativação; Esc fechando o diálogo; exclusão sem leituras; bloqueio de exclusão com leituras.
  - **Mobile (375 px):** lista, formulário e login sem rolagem horizontal.
  - **Sessão:** logout; sessão expirada, simulada revogando os tokens no servidor e vencendo o token local, levando ao login com aviso.
  - Nenhum erro no console do navegador e nenhum ponto `TEST-*` restante.
- **Problema encontrado e corrigido:** ao sair, a rota protegida reagia ao fim da sessão e redirecionava para o login antes da navegação para o início. Agora a navegação acontece antes do encerramento da sessão.

### 5.3 Não validado

- **CRUD no projeto remoto com conta real de administrador:** nenhuma conta administrativa foi criada no remoto, porque isso exige ação humana.
- **Leitores de tela reais e navegadores além do Chrome:** não testados.
- **Cadastro público no remoto:** a configuração não está acessível pelas ferramentas usadas; precisa ser conferida no painel.

---

## 6. Finalização da Etapa 2B — validação remota com contas reais (10/11/2026)

### 6.1 Configuração de Auth do projeto remoto

Lida pelo endpoint público `/auth/v1/settings`, somente leitura:

| Configuração | Valor | Situação |
| --- | --- | --- |
| `disable_signup` | `false` | ⚠️ **Cadastro público LIGADO.** Precisa ser desativado no painel. As ferramentas disponíveis (integração MCP sem API de configuração de Auth, sem token de gerenciamento) não permitem alterar isso. Mitigação existente: contas cadastradas não recebem `app_metadata.role` e, portanto, só têm leitura (RLS). |
| Provedores | apenas `email` | ✅ telefone, SAML e login anônimo desativados. |
| `mailer_autoconfirm` | `false` | ✅ cadastro por e-mail exige confirmação. |

### 6.2 Contas de teste: provisionamento e encerramento

Método autorizado pelo integrante:

- **Por que SQL:** a *Admin API* exige a chave secreta (indisponível) e o cadastro público exige confirmação por e-mail (o domínio reservado `.test` é recusado). Restou o provisionamento por SQL na tabela `auth.users` + `auth.identities`. **O método foi testado antes no Supabase local:** login e RLS funcionaram.
- **Senhas:** aleatórias (24 bytes), mantidas **apenas na memória** do processo de teste. Ao banco e à conversa foram somente os **hashes bcrypt**, calculados no Postgres local.
- **Contas criadas:** `admin.teste@climaponto.test` (com `app_metadata.role = 'admin'`) e `usuario.teste@climaponto.test` (sem papel). Não existiam outras contas no projeto: 0 usuários antes.
- **Ao final:** o papel `admin` foi **removido** e as duas contas foram **bloqueadas** (`banned_until = infinity`).
  - Sessões ativas no servidor: 0.
  - Os perfis temporários do navegador, que guardavam tokens, e o arquivo de hashes foram apagados.
  - Nenhuma credencial utilizável permanece. As contas continuam existindo (bloqueadas) e podem ser excluídas pelo painel.

### 6.3 Resultado da validação remota — 31/31

**Pela API** (`check-supabase-roles.mjs` com `CHECK_ALLOW_REMOTE=1`, tokens reais do Auth remoto): **15/15**.

| Perfil | Comportamento verificado |
| --- | --- |
| Usuário comum | Token sem papel admin. Lê só pontos ativos. Não cria pontos (`42501`), não edita nem exclui (0 linhas), não vê inativos. |
| Admin | Token com papel admin. Cria, edita campos autorizados, desativa, vê inativos e exclui pontos sem leituras. Não altera `created_at` (`42501`) e não insere leituras (`42501`). |

**Pela interface** (Vite com `.env.local` → Supabase remoto; Chrome headless): **16/16**.

- **Acesso:** rota protegida redireciona; senha errada; usuário comum recusado; login de admin.
- **CRUD do ponto temporário:** validação; cadastro; código duplicado `DEMO-01` recusado; pesquisa; edição; desativação com confirmação; ponto inativo oculto na página pública; reativação; exclusão.
- **Sessão:** logout; sessão expirada, simulada invalidando o *refresh token*, levando ao login com aviso.
- Limpeza: nenhum `TEST-*` restante. Erros de console: 0.

**Pontos demonstrativos:** `DEMO-01..03` têm a mesma impressão digital (md5 de todas as colunas) e o mesmo `updated_at` antes e depois. Não foram alterados.

**Não validado no remoto:** bloqueio de exclusão de ponto **com leituras**. Exigiria inserir uma leitura por SQL e depois removê-la; o cenário foi validado no Supabase local (24/24).

### 6.4 Acessibilidade e deploy

- **axe-core 4.14** (WCAG 2.1 A/AA + boas práticas): 0 violações nas páginas públicas e no login (desktop e mobile, build de produção) e na lista, no formulário com erros e no diálogo administrativos (local).
  - **Problema encontrado e corrigido:** `heading-order` na lista administrativa (cartões `h3` sem `h2`). Foi adicionado um `h2` de seção visível só para leitores de tela.
- **`web/vercel.json`:** validado localmente (25/25). Detalhes em [deploy.md](deploy.md).
