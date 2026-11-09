# ClimaPonto

Protótipo de monitoramento inteligente de condições ambientais em pontos de ônibus de São Paulo — **Global Solution FIAP 2026.2**.

O objetivo é coletar leituras de temperatura e umidade com ESP32, processar estados ambientais (ex.: calor extremo) e apresentá-los em uma aplicação web, ajudando a identificar pontos de ônibus com condições desconfortáveis ou de risco para quem espera o transporte.

> **Situação atual:** Etapa 2A — infraestrutura de dados. O banco Supabase está criado, com tabelas, permissões e 3 pontos **demonstrativos**. Ainda **não há leituras** de sensores, nem telas de cadastro/edição.

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

> **Atenção:** o projeto remoto `climaponto-gs-2026` tem aplicadas apenas as duas primeiras migrações (`…202656` e `…202658`). As três de `…230000` em diante foram testadas só localmente e aguardam revisão antes de ir para o remoto.

Depois, em *Authentication › Sign In / Providers*, desative **Allow new users to sign up**.

### Ambiente local e testes do banco

`supabase/config.toml` configura um Supabase **local** (`project_id = "climaponto-local"`), que não está vinculado ao projeto remoto. Requer Docker Desktop (no Windows, com WSL 2):

```bash
npx supabase@2.122.0 start
npx supabase@2.122.0 db reset    # apenas no ambiente local
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/rls_policies.test.sql
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

### Scripts disponíveis (dentro de `web/`)

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Versão de produção em `web/dist/` |
| `npm run preview` | Serve localmente a versão de produção |
| `npm run lint` | Analisa o código com Oxlint |
| `npm run check:supabase` | Testa pela API real o que um visitante pode e não pode fazer (requer `.env.local`) |

## Estrutura do projeto

```
GLOBAL-SOLUTION/
├── README.md
├── AI.md                         # Registro do uso de IA
├── docs/
│   ├── data-contract.md          # Contrato de dados (ESP32, Python, front-end)
│   ├── architecture-decisions.md # Decisões técnicas
│   └── security-review.md        # Revisão de segurança e testes
├── supabase/
│   ├── migrations/               # Esquema, restrições, índices, RLS
│   ├── seed.sql                  # Pontos demonstrativos
│   └── tests/rls_policies.test.sql  # Testes de permissões e restrições (SQL)
└── web/                          # Aplicação React (Vite)
    ├── .env.example
    ├── scripts/check-supabase-access.mjs
    └── src/
        ├── components/  layout/ e ui/   # Apresentação
        ├── pages/                       # Dashboard, Pontos, Histórico, 404
        ├── hooks/                       # useStops, useDocumentTitle
        ├── services/                    # supabaseClient, stopsService
        ├── data/                        # Dados demonstrativos locais
        └── styles/
```

**Separação de responsabilidades:** `components/` e `pages/` cuidam da apresentação; `hooks/` da lógica e do estado (`useState`, `useEffect`); `services/` do acesso a dados (Supabase ou dados locais).

## Modelo de dados e segurança (resumo)

- **`stops`** — pontos monitorados. **`readings`** — leituras de temperatura/umidade.
- **Visitantes:** apenas leitura de pontos ativos e suas leituras.
- **Administradores:** gerenciam pontos; não inserem leituras.
- **Leituras:** entrarão apenas por um endpoint de ingestão protegido (a implementar).

Detalhes em [docs/data-contract.md](docs/data-contract.md), [docs/architecture-decisions.md](docs/architecture-decisions.md) e [docs/security-review.md](docs/security-review.md). A revisão de segurança também traz o passo a passo para rodar os testes SQL em um Supabase **local** (Docker).

## O que já funciona

- Interface responsiva com Dashboard, Pontos, Histórico e página 404.
- Banco Supabase com tabelas, restrições, índices, RLS e 3 pontos demonstrativos.
- Listagem de pontos lida do Supabase (ou de dados locais, sem configuração), com indicação da fonte.
- Permissões de visitante verificadas pela API real (`npm run check:supabase`).

## Pendente

- Telas de CRUD de pontos e login de administradores (Etapa 2B).
- Endpoint de ingestão para o ESP32 e leituras reais/simuladas.
- Limites ambientais e de conectividade (aguardando aprovação).
- Histórico e indicadores no Dashboard.
- Design definitivo e deploy.
