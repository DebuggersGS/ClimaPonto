# ClimaPonto

Protótipo de monitoramento inteligente de condições ambientais em pontos de ônibus de São Paulo — **Global Solution FIAP 2026.2**.

O objetivo é coletar leituras de temperatura e umidade com ESP32, processar estados ambientais (ex.: calor extremo) e apresentá-los em uma aplicação web, ajudando a identificar pontos de ônibus com condições desconfortáveis ou de risco para quem espera o transporte.

> **Situação atual:** Etapa 3B. Banco Supabase com tabelas, permissões (RLS) e 3 pontos **demonstrativos**; área administrativa com login e CRUD de pontos; Dashboard e Histórico de leituras implementados no front-end. Ainda **não há leituras reais** no Supabase remoto (0 leituras): as telas mostram "Sem dados" até a ingestão existir.

Repositório (privado): https://github.com/EnricoVidal/climaponto-gs-2026

## Equipe

| Integrante | Responsabilidade |
| --- | --- |
| Enrico | Front-end Design e Web Development |
| Vini | Software & Total Experience Design e Storytelling |
| Gui | Computational Thinking with Python e Differentiated Problem Solving |
| Thiago | Edge Computing & Computer Systems |

## Tecnologias

- [React](https://react.dev/) 19 com [Vite](https://vite.dev/) 8 (JavaScript/JSX)
- [Tailwind CSS](https://tailwindcss.com/) 4 (plugin `@tailwindcss/vite`)
- [React Router](https://reactrouter.com/) 8
- [Supabase](https://supabase.com/) (PostgreSQL, API REST, Auth) via `@supabase/supabase-js` 2
- [Oxlint](https://oxc.rs/docs/guide/usage/linter) (lint)

## Pré-requisitos

- Node.js 20.19+ ou 22.12+ (desenvolvido com Node.js 24.18.1)
- npm (desenvolvido com npm 11.16.0)

## Instalação e execução

```bash
cd web
npm install
npm run dev
```

Acesse o endereço exibido no terminal (por padrão `http://localhost:5173`).

Sem configurar o Supabase, a aplicação funciona com **dados demonstrativos locais**. Para usar o banco, siga a próxima seção.

### Configuração do Supabase

1. Copie o arquivo de exemplo:
   ```bash
   cd web
   cp .env.example .env.local
   ```
2. Preencha em `web/.env.local` (valores em *Supabase › Project Settings › API Keys* e *Data API*):
   - `VITE_SUPABASE_URL` — URL do projeto.
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — chave **publishable** (`sb_publishable_...`).
3. Reinicie `npm run dev`. As páginas mostram "Fonte: banco de dados (Supabase)".

> **Nunca** use a *secret key* (`sb_secret_...`) ou a *service_role key* no front-end. O arquivo `.env.local` não é versionado.

### Criar o banco do zero (outro projeto Supabase)

No *SQL Editor* do Supabase, execute **todos** os arquivos de `supabase/migrations/` em ordem de nome (data), e depois `supabase/seed.sql` (pontos demonstrativos).

O projeto remoto `climaponto-gs-2026` tem as **5 migrações** aplicadas, e as versões dos arquivos coincidem com o histórico remoto. Há um plano de recuperação em `supabase/rollback/`; ele **não** é uma migração.

Depois, em *Authentication › Sign In / Providers*, desative **Allow new users to sign up**.

### Ambiente local e testes do banco

`supabase/config.toml` configura um Supabase **local** (`project_id = "climaponto-local"`), que não está vinculado ao projeto remoto. Requer Docker Desktop (no Windows, com WSL 2):

```bash
npx supabase@2.122.0 start
npx supabase@2.122.0 db reset --local    # apenas no ambiente local
docker exec -i supabase_db_climaponto-local psql -U postgres -d postgres < supabase/tests/rls_policies.test.sql
npx supabase@2.122.0 stop
```

Nunca execute `db push` ou `db reset --linked` sem aprovação. Resultados e detalhes em [docs/security-review.md](docs/security-review.md#3-testes-locais).

### Administradores

Contas administrativas são criadas manualmente:

1. *Authentication › Users › Add user* (e-mail e senha).
2. No *SQL Editor*, conceda o papel (substitua o e-mail):
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
   where email = 'admin@exemplo.com';
   ```
3. O papel passa a valer no próximo login do usuário.

### Área administrativa

- Acesso pelo link **Área administrativa**, no rodapé, ou pelo endereço `/admin/login`. Não existe cadastro público.
- Depois do login, `/admin/pontos` permite **listar** (ativos e inativos), **pesquisar**, **filtrar**, **cadastrar**, **editar**, **desativar/reativar** e **excluir** pontos.
- **Exclusão:** só é permitida para pontos **sem leituras**. Para pontos com histórico, a interface oferece desativar.
- **Contas sem papel admin:** são recusadas no login. Quando a sessão expira, a interface volta ao login com um aviso.
- **Autoridade das permissões:** a interface só esconde o que o usuário não pode fazer. Quem decide de fato são o RLS e os privilégios do banco.

### Scripts disponíveis (dentro de `web/`)

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Versão de produção em `web/dist/` |
| `npm run preview` | Serve localmente a versão de produção |
| `npm run lint` | Analisa o código com Oxlint |
| `node --test` | Executa os testes automatizados (executor nativo do Node, sem dependência nova; não há script no `package.json`) |
| `npm run check:supabase` | Testa pela API real o que um visitante pode e não pode fazer (requer `.env.local`) |
| `npm run check:supabase:roles` | Testa permissões de admin e de usuário comum com login real; **só roda contra Supabase local** (requer `.env.check.local`) |

## Estrutura do projeto

```
GLOBAL-SOLUTION/
├── README.md
├── AI.md                         # Registro do uso de IA
├── docs/
│   ├── data-contract.md          # Contrato de dados (ESP32, Python, front-end)
│   ├── architecture-decisions.md # Decisões técnicas
│   ├── security-review.md        # Revisão de segurança e testes
│   ├── deploy.md                 # Deploy na Vercel (preparado)
│   └── etapa-3-proposta.md       # Proposta do dashboard (em revisão)
├── supabase/
│   ├── config.toml               # Supabase LOCAL (climaponto-local)
│   ├── migrations/               # Esquema, restrições, índices, RLS, privilégios
│   ├── rollback/                 # Plano de recuperação (não é migração)
│   ├── seed.sql                  # Pontos demonstrativos
│   └── tests/rls_policies.test.sql  # Testes de permissões e restrições (SQL)
└── web/                          # Aplicação React (Vite)
    ├── .env.example
    ├── vercel.json               # Build, rewrites e cabeçalhos de segurança
    ├── scripts/                  # check-supabase-access / check-supabase-roles
    └── src/
        ├── components/
        │   ├── admin/            # StopForm, AdminStopCard
        │   ├── auth/             # AuthProvider, RequireAdmin
        │   ├── dashboard/        # DashboardSummary, StopStatusCard, RefreshControl, ...
        │   ├── history/          # ReadingsChart (SVG), ReadingsTable, PeriodFilter, ...
        │   ├── layout/           # AppLayout, Header, MainNav
        │   └── ui/               # Button, Card, ConfirmDialog, TextField, ...
        ├── pages/                # Dashboard, Pontos, Histórico, 404, AdminLogin, AdminStops
        ├── hooks/                # useAuth, useAdminStops, useStops, useLatestReadings, useReadingsHistory, useNow, ...
        ├── services/             # supabaseClient, authService, stopsService, readingsApi, readingsService, errors
        ├── utils/                # stopValidation, formatters, connectivity, readings, historyPeriods, chartGeometry
                          # (testes *.test.js ao lado dos arquivos testados)
        ├── data/                 # Dados demonstrativos locais
        └── styles/
```

**Separação de responsabilidades:**
- `components/` e `pages/` cuidam da apresentação.
- `hooks/` cuida da lógica e do estado (`useState`, `useEffect`, contexto de sessão).
- `services/` cuida do acesso a dados e da tradução de erros.
- `utils/` reúne funções puras de validação, formatação, conectividade, normalização de leituras e geometria do gráfico.

## Modelo de dados e segurança (resumo)

- **`stops`** — pontos monitorados. **`readings`** — leituras de temperatura/umidade.
- **Visitantes:** apenas leitura de pontos ativos e suas leituras.
- **Administradores:** gerenciam pontos; não inserem leituras.
- **Leituras:** entrarão apenas por um endpoint de ingestão protegido (a implementar).

Detalhes em [docs/data-contract.md](docs/data-contract.md), [docs/architecture-decisions.md](docs/architecture-decisions.md), [docs/security-review.md](docs/security-review.md), [docs/deploy.md](docs/deploy.md) e [docs/etapa-3-proposta.md](docs/etapa-3-proposta.md). A revisão de segurança também traz o passo a passo para rodar os testes SQL em um Supabase **local** (Docker).

## O que já funciona

- Interface responsiva com Dashboard, Pontos, Histórico e página 404.
- Banco Supabase com tabelas, restrições, índices, RLS e 3 pontos demonstrativos.
- Listagem pública de pontos ativos, lida do Supabase (ou de dados locais quando não há configuração), com indicação da fonte.
- Login administrativo e CRUD completo de pontos, com validação, diálogos de confirmação e mensagens de retorno.
- CRUD e permissões **validados no Supabase remoto** com contas reais de teste (31/31: API e interface) e no Supabase local (SQL 50/50, papéis 14/14, interface 24/24). Detalhes em `docs/security-review.md`.
- **Dashboard:** resumo (pontos, contagens por conectividade e por estado ambiental), última medição, conectividade **provisória** (online/atrasado/offline, separada do estado ambiental), visão por ponto e evolução recente. Atualização automática (polling), pausada com a aba oculta. Mostra apenas o `environmental_status` gravado; sem leituras aparece "Sem dados", e estado ausente aparece "Não classificado".
- **Histórico:** filtros de ponto e período (24 h, 7 dias, 30 dias) refletidos na URL, gráfico SVG próprio com alternativa textual, tabela de leituras e limite de 500 registros com aviso de truncamento. Leituras de simulação são sinalizadas.
- **Testes automatizados** (utils e `readingsApi`, com `node:test`): `cd web && node --test`. Última execução registrada em `AI.md`.
- Acessibilidade básica verificada com axe-core (0 violações) e deploy na Vercel preparado e validado localmente ([docs/deploy.md](docs/deploy.md)), **ainda não publicado**.

## Pendente

- **Desativar o cadastro público** no painel do Supabase (*Authentication › Sign In / Providers*): hoje está ligado.
- Criar a(s) conta(s) administrativa(s) definitiva(s) da equipe pelo painel (passos na seção *Administradores*).
- Executar o deploy na Vercel (aguarda aprovação).
- Endpoint de ingestão para o ESP32 e leituras reais/simuladas.
- Limites ambientais (aguardando aprovação); o front-end não classifica, só exibe o estado gravado.
- Intervalo de envio do ESP32 e regra de conectividade definitivos (hoje provisórios: 60 s, 2× e 5×).
- Agregação SQL para períodos longos (hoje a consulta é limitada a 500 registros).
- Validação visual em navegador (375/768/1366 px, teclado, axe-core) e conferência do Dashboard/Histórico com Supabase configurado: **aceite humano**.
- Design definitivo e deploy.

> **Integração futura:** os branches `harness/G-20261111-4f0f88` e `harness/G-20261112-096aab` (não mesclados) também alteram `AI.md`/`docs`; ao integrá-los, podem surgir conflitos simples de documentação.
