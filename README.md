# ClimaPonto

Protótipo de monitoramento inteligente de condições ambientais em pontos de ônibus de São Paulo — **Global Solution FIAP 2026.2**.

O objetivo é coletar leituras de temperatura e umidade com ESP32, processar estados ambientais (ex.: calor extremo) e apresentá-los em uma aplicação web, ajudando a identificar pontos de ônibus com condições desconfortáveis ou de risco para quem espera o transporte.

> **Situação atual:** Etapa 3C. Banco Supabase com tabelas, permissões (RLS) e 3 pontos **demonstrativos**; área administrativa com login e CRUD de pontos; Dashboard e Histórico com novo design system (tokens, movimento e gráficos Recharts) e **modo demonstração** com dados fictícios determinísticos. Ainda **não há leituras reais** no Supabase remoto (0 leituras): com o Supabase, as telas mostram "Sem dados" até a ingestão existir. O aceite estético humano e o gate E2E depois da correção de layout de "Última medição" (T102) estão **pendentes** (ver *Pendente*). Checklist dos requisitos de front-end: [docs/requisitos-fiap-frontend.md](docs/requisitos-fiap-frontend.md); revisão visual: [docs/revisao-visual-frontend.md](docs/revisao-visual-frontend.md).

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
- [Recharts](https://recharts.org/) 3 (gráficos), [motion](https://motion.dev/) 14 (animações), [lucide-react](https://lucide.dev/) (ícones), `clsx` + `tailwind-merge` + `class-variance-authority` (composição de classes e variantes). Justificativa em `docs/architecture-decisions.md` (decisão 32)
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

Sem configurar o Supabase, a aplicação funciona com **dados demonstrativos locais** (modo `auto`, veja *Modos de dados*). Para usar o banco, siga a seção de configuração do Supabase.

### Modos de dados

A fonte de dados é escolhida por `VITE_DATA_MODE` em `web/.env.local` (não versionado). Valores: `mock`, `supabase` ou `auto` (padrão, também usado se o valor estiver ausente ou inválido).

| Valor | Comportamento |
| --- | --- |
| `mock` | Usa só o dataset fictício local; o Supabase **não** é consultado. |
| `supabase` | Usa só o Supabase. Sem `VITE_SUPABASE_*`, o modo efetivo é "não configurado": toda consulta falha com erro explícito e **os dados mock não são usados**. |
| `auto` | Supabase se estiver configurado; caso contrário, mock. |

Regras: nunca há mistura de fontes, e um erro do Supabase **nunca** cai para o mock (sem fallback em erro). O modo efetivo é sinalizado de forma persistente no cabeçalho ("Modo demonstração", "Dados do Supabase" ou "Supabase não configurado").

**Autenticação e escritas demonstrativas (só no modo efetivo `mock`):** a tela de login mostra o aviso "Acesso demonstrativo" e duas contas **fictícias**:

| Conta | E-mail | Senha |
| --- | --- | --- |
| Administrador (demonstração) | `admin.demo@climaponto.example` | `demo-admin-2026` |
| Leitor sem acesso administrativo (demonstração) | `leitor.demo@climaponto.example` | `demo-leitor-2026` |

Essas credenciais **só valem no modo mock** (o Supabase as recusa) e **nada persiste**: a sessão e as alterações de pontos (criar, editar, desativar/reativar, excluir) ficam só na memória e somem ao recarregar a página. Em produção use `VITE_DATA_MODE=supabase` (decisão 36 e [docs/security-review.md](docs/security-review.md)).

No modo mock, dois parâmetros de URL permitem conferir estados: `?mock=erro` (toda consulta falha), `?mock=lento` (latência de 3 s, em vez de 250 ms) e `?mock=lento,erro` (ambos). Em outros modos, eles são ignorados.

**Cenários do dataset mock** (todos fictícios, determinísticos pela semente `20261112`; as leituras são de origem `simulation`, exceto onde indicado):

| Ponto | Cenário | O que demonstra |
| --- | --- | --- |
| MOCK-01 | Normal | Ponto online, estado ambiental normal e histórico completo. |
| MOCK-02 | Atenção | Online, estado ambiental registrado como atenção (calor elevado). |
| MOCK-03 | Crítico | Online, estado ambiental registrado como crítico (temperatura muito alta). |
| MOCK-04 | Sem dados | Ponto cadastrado que ainda não enviou nenhuma leitura. |
| MOCK-05 | Conectividade atrasada | Última leitura há poucos minutos: atrasado, ainda não offline. |
| MOCK-06 | Offline | Última leitura há horas, com o estado ambiental registrado preservado. |
| MOCK-07 | Histórico longo | 30 dias de histórico, para conferir 24 h, 7 dias e 30 dias. |
| MOCK-08 | Demonstrativo | Ponto `is_demo` com leituras de origem Teste. |

### Como validar no navegador

```bash
npm --prefix web run dev
```

Com `VITE_DATA_MODE=mock`, percorra Dashboard, Pontos e Histórico e confira em **375, 768 e 1366 px** (sem rolagem horizontal em 375 px). Use também `?mock=erro` e `?mock=lento`, teclado (foco visível), emulação de `prefers-reduced-motion: reduce` (as animações devem ser suprimidas) e rode o axe-core. As ferramentas de navegador ficam fora do repositório. Os testes E2E correspondentes (Chromium e Firefox, 375/768/1366 px, axe-core, movimento reduzido) **já foram escritos** e rodam no gate do harness; o último resultado registrado (evidência 0015, 286 aprovados, 0 falhas) está em `docs/revisao-visual-frontend.md`. O aceite estético humano também segue pendente.

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
- **Modo mock:** o login aceita as contas fictícias de *Modos de dados* e todas as escritas funcionam **em memória** (nada é salvo; a interface sinaliza o modo demonstração). Com o Supabase, valem as contas reais e o RLS.
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
| `node --test` | Executa os testes automatizados (executor nativo do Node, sem dependência nova; não há script no `package.json`). Passar a **pasta** como argumento (`node --test src/utils/`) falhou ao carregar; use `node --test` sem argumentos ou liste os arquivos `*.test.js` |
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
│   ├── requisitos-fiap-frontend.md  # Checklist dos requisitos de front-end com evidência
│   ├── revisao-visual-frontend.md   # Revisão visual (antes e depois)
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
        │   ├── charts/           # SeriesChart (Recharts), ChartTooltip
        │   ├── dashboard/        # DashboardHero, DashboardSummary, StopGrid, StopStatusCard, ...
        │   ├── history/          # ReadingsEvolution, ReadingsSummary, ReadingsTable, PeriodFilter, ...
        │   ├── layout/           # AppLayout, Header, MainNav
        │   └── ui/               # Button, Card, Badge, Section, MetricCard, EmptyState, Skeleton, ...
        ├── pages/                # Dashboard, Pontos, Histórico, 404, AdminLogin, AdminStops
        ├── hooks/                # useAuth, useAdminStops, useStops, useLatestReadings, useReadingsHistory, useNow, useDataMode, ...
        ├── services/             # dataSource (fonte única), dataSourceFactory, mockReadingsApi, readingsApi, stopsApi, supabaseClient, authService, errors
        ├── utils/                # dataMode, chartSeries, statusTones, cn, stopValidation, formatters, connectivity, readings, historyPeriods
                          # (testes *.test.js ao lado dos arquivos testados)
        ├── data/mock/            # Dataset mock determinístico (8 cenários)
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
- Listagem pública de pontos ativos, lida do Supabase ou do dataset mock conforme `VITE_DATA_MODE`, com o modo efetivo sempre sinalizado.
- **Design system (3C):** tokens em `styles/index.css`, `cn()` (clsx + tailwind-merge), variantes com `cva`, ícones lucide-react e animações com `motion` (`MotionConfig reducedMotion="user"`).
- **Modo demonstração:** dataset mock determinístico com 8 cenários, adaptador com a mesma interface da fonte real, `?mock=erro` e `?mock=lento`.
- Login administrativo e CRUD completo de pontos, com validação, diálogos de confirmação e mensagens de retorno.
- **Modo mock:** autenticação demonstrativa (contas fictícias) e CRUD de pontos em memória, para percorrer a área administrativa sem Supabase.
- **375 px:** valores de temperatura e umidade sem quebra entre número e unidade (espaço não separável e `whitespace-nowrap`; commit `de32ce0`). Confirmado no gate E2E 0030 (HEAD `cbbd4a8`).
- **Novos testes E2E** (`valores-375`, `movimento-reduzido`, `admin`, `admin-qualidade`, estados lento/erro/vazio e 404), executados na verificação final no HEAD `cbbd4a8`: lint e build ok; E2E (Chromium e Firefox) 190 aprovados, 0 falhas, 0 flaky, 4 pulados, 56 screenshots; unitários 228/228. Antes da aprovação houve 3 verificações reprovadas (11 falhas + 1 flaky; 1 falha; 6 falhas + 1 flaky), corrigidas em `a4968a3`, `51c6855`, `4a0c395`, `b37bf2d`, `bb51488` e `cbbd4a8`. Depois disso, a T104 alterou `AuthProvider.jsx` (recusa de conta sem papel admin não exibe mais "Sua sessão expirou") e `MainNav.jsx` (item ativo visível a 375 px), além de documentos: **nova verificação será feita**.
- **Busca, filtros e insights:** campo "Buscar pontos" (nome, código ou bairro) e contagem "Mostrando X de Y pontos" (região `aria-live`) no Dashboard e em Pontos; filtros por estado ambiental gravado e conectividade no Dashboard e por bairro em Pontos, cada um só com 2 ou mais valores nos dados; estado vazio com "Limpar filtros"; seção "Insights" no Dashboard (distribuição do estado gravado, maior e menor temperatura e umidade, pontos offline ou sem dados, leituras que não são medição real), com "Como foi calculado", sem limiares novos. Navegação principal sem rolagem interna, com alvos de 44 px e foco visível. Decisão 37 em `docs/architecture-decisions.md`.
- **E2E de busca e filtros** (`web/e2e/filtros.spec.mjs`): escritos, cobrindo busca, filtros, insights, estado vazio, limpar filtros, teclado, axe-core (Dashboard e Pontos com filtros e sem resultados), movimento reduzido e navegação a 375 px (visitante e admin mock). Executados pelo gate do harness no HEAD `c6a4867`: Chromium e Firefox, 241 aprovados, 0 falhas, 8 pulados, 1 flaky (Firefox, "filtro de período: 24 h, 7 dias e 30 dias" em `historico.spec.mjs`, spec preexistente). A alteração posterior (regra de visibilidade e filtro ativo, T102) será validada pelo próximo gate.
- **Premium 3.0 (G-20261115-739025):** Dashboard em grade Bento no desktop (Resumo/Última medição, Evolução/Insights), tema escuro automático por `prefers-color-scheme`, vidro discreto só em navegação e controles, hierarquia tipográfica refinada, sparklines de tendência (só com dados já carregados) e gráficos com tokens de tema. Decisão 38. Verificado até aqui: lint, build e `node --test` 266/266 (T1/T2). Detalhes em [docs/revisao-visual-frontend.md](docs/revisao-visual-frontend.md).
- **Fase 4 (mapa, favoritos, alertas e Command Palette):** `/pontos` com mapa esquemático SVG (sem mapa base), lista, ficha do ponto, favoritos (só códigos, `localStorage`) e laboratório de cenários mock; Histórico com perfis por hora/dia da semana, linha do tempo, qualidade das leituras e relatório CSV; painel de alertas (`AlertsPanel`), aviso de offline e Command Palette com `<dialog>` nativo. Decisão 39. Verificado localmente: lint (0 erros, 2 avisos preexistentes), build ok, `node --test` 368/368. **E2E (`web/e2e/mapa`, `favoritos`, `alertas`, `palette`, `laboratorio`, `ficha-ponto`, `pontos`, `historico-perfis`, `qualidade`, `conexao`) escritos, ainda não executados: pendente de verificação pelo gate.**

- Checklist dos requisitos: [docs/requisitos-fiap-frontend.md](docs/requisitos-fiap-frontend.md) e revisão visual: [docs/revisao-visual-frontend.md](docs/revisao-visual-frontend.md).
- CRUD e permissões **validados no Supabase remoto** com contas reais de teste (31/31: API e interface) e no Supabase local (SQL 50/50, papéis 14/14, interface 24/24). Detalhes em `docs/security-review.md`.
- **Dashboard:** resumo (pontos, contagens por conectividade e por estado ambiental), última medição, conectividade **provisória** (online/atrasado/offline, separada do estado ambiental), visão por ponto e evolução recente. Atualização automática (polling), pausada com a aba oculta. Mostra apenas o `environmental_status` gravado; sem leituras aparece "Sem dados", e estado ausente aparece "Não classificado".
- **Histórico:** filtros de ponto e período (24 h, 7 dias, 30 dias) refletidos na URL, gráficos Recharts por grandeza (agrupados em intervalos), resumo estatístico, tabela responsiva e limite de 500 registros com aviso de truncamento. Leituras de simulação e teste são sinalizadas.
- **Testes automatizados** (utils, serviços e dataset mock, com `node:test`): `cd web && node --test`. Última execução registrada em `AI.md`. Não há testes de componentes React.
- **Testes E2E em navegador real** (`web/e2e/*.spec.mjs`, modo mock): Dashboard, Histórico, Pontos, navegação, filtros, indicadores e cards por estado (normal, atenção, crítico, sem dados, atrasado, offline, demonstrativo), gráficos, `?mock=erro`, `?mock=lento`, larguras 375/768/1366 px, teclado, axe-core (temas claro e escuro), movimento reduzido, erros de console e screenshots desktop/mobile. Rodam pelo gate de navegador do Engineering Harness (Playwright, Chromium e Firefox, isolado e sem rede), que fornece o módulo `harness-e2e`: o projeto não ganhou dependência nova e os testes não rodam com `npm test`. Resultados em `AI.md`.
- Deploy na Vercel preparado e validado localmente ([docs/deploy.md](docs/deploy.md)), **ainda não publicado**. A interface redesenhada na 3C passou a ser verificada automaticamente pelos testes E2E acima (layout, teclado, axe-core e movimento reduzido); a aprovação estética continua com a equipe.

- **Fase 3 (Insights, comparador e exploração do Histórico):** Insights em Bento compacto com a metodologia ("Como foi calculado") recolhida por padrão; comparador de dois pontos no Dashboard (recolhido, mesma origem e período); Histórico com filtro de origem na URL (`origem`), resumo por dia recolhido e exportação CSV. Testes E2E escritos (`web/e2e/insights.spec.mjs`, `web/e2e/historico-exploracao.spec.mjs`; `filtros.spec.mjs` ajustado para abrir a metodologia antes de ler o texto), com screenshots anexados em 1366 e 375 px, claro e escuro. **Ainda não executados** pelo gate nesta tarefa (os navegadores E2E não estavam disponíveis ao agente); lint e build passam.

## Pendente

- **Desativar o cadastro público** no painel do Supabase (*Authentication › Sign In / Providers*): hoje está ligado.
- Criar a(s) conta(s) administrativa(s) definitiva(s) da equipe pelo painel (passos na seção *Administradores*).
- Executar o deploy na Vercel (aguarda aprovação).
- Endpoint de ingestão para o ESP32 e leituras reais/simuladas.
- Limites ambientais (aguardando aprovação); o front-end não classifica, só exibe o estado gravado.
- Intervalo de envio do ESP32 e regra de conectividade definitivos (hoje provisórios: 60 s, 2× e 5×).
- Agregação SQL para períodos longos (hoje a consulta é limitada a 500 registros).
- **Premium 3.0:** o gate 0015 (HEAD `c5e3399`) passou: 286 E2E aprovados, 0 falhas, 8 pulados (Chromium e Firefox; axe nos dois temas), unitários 266/266. Falta confirmar, no próximo gate, a correção da sobreposição de "Última medição" a 1366 px (T102); a comparação antes/depois está em `docs/revisao-visual-frontend.md`. Seletor manual de tema (claro/escuro) não existe.
- **Fase 3:** o briefing e os PNGs de referência em `/home/harness/climaponto-fase3` não puderam ser lidos (restrição de leitura); a conferência visual contra eles fica para um humano. O erro do comparador ("Tentar novamente") não tem teste E2E, pois `?mock=erro` também derruba a lista de pontos.
- **Aceite humano da interface 3C:** aprovação estética do design pela equipe e conferência com o Supabase configurado. A parte objetiva (375/768/1366 px, teclado, axe-core, reduced motion, console, hierarquia de títulos) já roda nos testes E2E; o offset `sm:top-20` da barra de filtros fixa do Histórico não tem teste específico.
- Referências visuais aprovadas (`toHaveScreenshot`) ainda não existem: hoje os testes geram screenshots para revisão, mas não comparam imagens entre versões.
- axe-core no Firefox está pulado (com motivo registrado no teste) nas páginas com gráficos: o Firefox derruba a página durante a análise no runner de testes; essas páginas são verificadas no Chromium.
- "Page crashed" intermitente do Firefox (axe do login escuro e medição no Dashboard): ocorreu em execuções intermediárias e passou na final; causa raiz não identificada.
- Sugestões de refatoração (revisão de código): extrair um componente `Select` em `components/ui` (hoje repetido em 3 lugares) e unificar o nome `neighborhood`/`neighborhoods` em `getStopFilterOptions`.
- Confirmar em captura a 375 px o item "Gerenciar" visível na navegação (T104).
- Sem teste automatizado para a regressão do aviso "Sua sessão expirou" após recusa de conta sem papel admin (não há teste de componentes; `web/e2e` fora do escopo da T104).
- **Enunciado oficial da FIAP** não está no repositório: o checklist segue a lista do objetivo. **"CitizenTech"** não está definido em nenhum documento do repositório, e uma **API pública de terceiros** (se o enunciado exigir) não foi implementada: decisões de produto da equipe. Ver `docs/requisitos-fiap-frontend.md`.
- Dashboard, Histórico e área administrativa são `lazy`; o chunk com o Recharts tem ~381 kB (111 kB gzip) e o build não emite mais aviso de chunk acima de 500 kB.
- `components/ui/icons.jsx` segue como camada sobre lucide-react, com consumidores a migrar para importar direto.
- 2 avisos de lint `set-state-in-effect` (`useReadingsHistory.js`, `useLatestReadings.js`), preexistentes.
- `useStops` não tem recarga: o "Tentar novamente" de Pontos remonta o componente por `key`, e o do Dashboard recarrega a página.
- `node --test src/utils/` (pasta como argumento) falha ao carregar; causa não investigada, por isso os testes são executados sem argumento ou por arquivo.
- **Fase 4, pendências:** seletor manual de tema e refinamento do hero; mapa com ruas (hoje só esquema SVG); os pontos do Supabase remoto têm coordenadas nulas (o mapa usa posições de fallback, sinalizadas); limites ambientais aprovados; previsões; notificações do navegador; aceite estético humano; resultados E2E em Chromium e Firefox (pendentes de verificação).

- Design definitivo (aprovação do Vini) e deploy.

> **Integração futura:** os branches `harness/G-20261111-4f0f88` e `harness/G-20261112-096aab` (não mesclados) também alteram `AI.md`/`docs`; ao integrá-los, podem surgir conflitos simples de documentação.
