# ClimaPonto

**CitizenTech da Global Solution FIAP 2026.2 (Engenharia de Software, 1º ano).** Aplicação web que mostra as condições de calor e umidade nos pontos de ônibus de São Paulo, para que quem espera o transporte (e quem cuida dessas pessoas) saiba onde e quando o calor vira risco.

## Ficha da CitizenTech

| Campo | Resposta |
| --- | --- |
| Nome da CitizenTech | ClimaPonto |
| Cidade e bairro | São Paulo (SP). Ponto piloto **P001 em Santana** (Zona Norte, endereço exato a confirmar), mais **P002 Interlagos** (Zona Sul) e **P003 Barueri** (Grande São Paulo), os mesmos pontos das outras disciplinas |
| Cidadão beneficiado | Quem espera o ônibus em ponto exposto ao sol: idosos, trabalhadores que dependem do transporte público, gestantes e pessoas com doenças agravadas pelo calor |
| Problema, em uma frase | Nos dias de calor extremo, quem espera o ônibus fica exposto sem saber quais pontos estão em condição de risco, e a cidade não tem esse dado por ponto |
| Como funciona | Um ESP32 com sensor DHT22 no ponto (simulado no Wokwi) mede temperatura e umidade, classifica o calor em *normal* (abaixo de 30 °C), *atenção* (30 °C a 34,9 °C) ou *crítico* (35 °C ou mais) e alerta no próprio ponto, mesmo sem internet. Com rede, envia as leituras por MQTT para o FIWARE (IoT Agent, Orion e STH-Comet), de onde a Central de Leituras em Python as coleta. Esta aplicação web guarda pontos e leituras no Supabase, no mesmo formato de leitura (ponto, temperatura, umidade, estado e origem), e mostra mapa, situação atual, histórico, comparações e alertas. A administração cadastra e mantém os pontos (CRUD) |
| O que cada parte faz | **Front-end Design e Web Development:** esta aplicação web (`web/`). **Edge Computing:** sensor, circuito e envio ao FIWARE ([ClimaPonto-Edge](https://github.com/DebuggersGS/ClimaPonto-Edge)). **Computational Thinking with Python:** Central de Leituras que busca as leituras no FIWARE e as analisa ([ClimaPonto-Python](https://github.com/DebuggersGS/ClimaPonto-Python)). **Differentiated Problem Solving:** modelagem matemática com dados do INMET ([ClimaPonto-DPS](https://github.com/DebuggersGS/ClimaPonto-DPS)). **Software & Total Experience Design:** jornada, requisitos e protótipo ([ClimaPonto-TotalEx](https://github.com/DebuggersGS/ClimaPonto-TotalEx)). **Storytelling:** pitch em vídeo |
| Link do repositório | https://github.com/DebuggersGS/ClimaPonto-Web (privado, organização da equipe DebuggersGS) |
| Indicador de impacto | Graus-hora acima de 30 °C por ponto, ou seja, o calor acumulado a que o passageiro fica exposto (referência: 331 °C·h em 12 meses na estação INMET de Santana, calculado no [ClimaPonto-DPS](https://github.com/DebuggersGS/ClimaPonto-DPS)). Na aplicação: horas por ponto em "atenção" ou "crítico" no Histórico, em Análises e no relatório CSV |
| ODS conectados | 3, 11 e 13 (detalhes abaixo) |

## ODS conectados

- **ODS 11 — Cidades e comunidades sustentáveis (meta 11.2):** torna mais seguro o uso do transporte público, informando a condição térmica de cada ponto de espera.
- **ODS 3 — Saúde e bem-estar (meta 3.d):** funciona como alerta precoce de risco à saúde pelo calor para quem fica exposto no ponto, principalmente idosos.
- **ODS 13 — Ação contra a mudança global do clima (meta 13.1):** dá dados por ponto para a adaptação da cidade às ondas de calor (onde instalar cobertura, sombra ou hidratação primeiro).

## Requisitos de Front-end Design e Web Development

A mesma aplicação atende às duas disciplinas (enunciado da GS, págs. 40–42 e 59–61).

| Exigência do enunciado | Onde está |
| --- | --- |
| React com Vite | React 19 + Vite 8 (`web/package.json`, `web/vite.config.js`) |
| Tailwind CSS | Tailwind 4 (`web/src/styles/index.css`, classes em todos os componentes) |
| Mínimo de 8 componentes reutilizáveis | 91 componentes em `web/src/components/`, sendo 30 de uso geral em `components/ui/` (Button, Card, Badge, Tabs, Popover, Sheet, SearchField, MetricCard...) |
| `useState` e `useEffect` | usados em 34 e 19 arquivos (ex.: `hooks/useStops.js`, `hooks/useNow.js`) |
| Mínimo de 2 custom hooks | 18 hooks em `web/src/hooks/` (ex.: `useStops`, `useAdminStops`, `useStopFilters`, `useReadingsHistory`, `useFavoriteStops`) |
| Lógica de negócio e acesso a dados fora da tela | camadas `pages/` e `components/` (tela) → `hooks/` (estado) → `services/` (dados) → `utils/` (regras puras, com testes) |
| API externa com CRUD completo | Supabase (API REST + Auth) em `web/src/services/stopsApi.js`: criar (`insert`), consultar (`select`), atualizar (`update`, inclusive ativar/desativar) e excluir (`delete`) pontos; tela em **Área administrativa › Gerenciar pontos** (`/admin/pontos`) |
| Funcionalidades ligadas ao tema (não só tela estática) | mapa interativo dos pontos, Ponto 360° (`/pontos/:código`), busca e filtros, histórico com gráficos e exportação CSV, comparação entre pontos, alertas, favoritos e busca rápida (Ctrl+K) |
| Git com 15+ commits significativos | histórico completo no repositório (mais de 180 commits no formato `tipo(escopo): descrição`) |
| `AI.md` na raiz | [AI.md](AI.md) (ferramentas, interações, aplicação, validação e análise crítica) e [prompts.md](prompts.md) |

## Equipe

Equipe **Debuggers**, turma 1ESPG.

| Integrante | RM | Responsabilidade principal |
| --- | --- | --- |
| Enrico Vieira de Almeida Vidal | 569217 | Front-end Design e Web Development (esta aplicação) |
| Guilherme De Rosa Peres | 569193 | Computational Thinking with Python e Differentiated Problem Solving |
| Vinícius Fuentes Cavalcanti | 570818 | Edge Computing & Computer Systems (ESP32 e FIWARE), Software & Total Experience Design e Storytelling |

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

### Dados em produção (Supabase)

No deploy (`VITE_DATA_MODE=supabase`), o banco tem os três pontos da equipe. **Nenhuma leitura vem de um sensor instalado num ponto real**, por isso todas têm origem `simulation` e os pontos são marcados como demonstrativos na interface.

| Ponto | Posição de referência | Leituras |
| --- | --- | --- |
| P001 Santana (piloto) | Estação INMET A701 Mirante de Santana | Série horária pública do [Open-Meteo](https://open-meteo.com/) (temperatura e umidade) de 19/10 a 18/11/2026, mais as **6 leituras do ESP32 (Wokwi) recebidas pelo FIWARE** em 17/11/2026, coletadas pela Central em Python (`dados/leituras.json` do ClimaPonto-Python) |
| P002 Interlagos | Estação INMET A771 Interlagos | Série horária pública do Open-Meteo, no mesmo período |
| P003 Barueri | Estação INMET A755 Barueri | Série horária pública do Open-Meteo, no mesmo período |

O estado de cada leitura segue as regras da equipe, iguais às do ESP32 e do Python: normal abaixo de 30 °C, atenção de 30 °C a 34,9 °C e crítico a partir de 35 °C. Os limites são de demonstração, não índices clínicos nem alertas oficiais. Como não há envio contínuo, a última leitura de cada ponto aparece como **offline** com o passar do tempo, e o estado registrado continua visível. Para ver todos os estados (incluindo crítico e sem dados), use o conjunto **demonstrativo** pelo seletor no cabeçalho ou rode localmente com `VITE_DATA_MODE=mock`.

### Como validar no navegador

```bash
npm --prefix web run dev
```

Com `VITE_DATA_MODE=mock`, percorra Visão geral, Explorar, Ponto 360°, Histórico e a área administrativa em **375, 768 e 1366 px**, nos temas claro e escuro. Use também `?mock=erro` e `?mock=lento` (estados de erro e carregamento), o teclado (foco visível) e a opção do sistema "reduzir movimento".

Os testes E2E de `web/e2e/` (Playwright: navegação, mapa, Ponto 360°, filtros, CRUD, acessibilidade com axe-core e larguras de tela) rodam com o executor de testes da equipe, que fornece o módulo `harness-e2e` (navegadores, bloqueio de rede externa e auditorias); por isso não há dependência de testes no `package.json`. Os testes unitários rodam direto com `cd web && node --test`.

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
ClimaPonto-Web/
├── README.md
├── AI.md                         # Uso de Inteligência Artificial (exigido pelo enunciado)
├── prompts.md                    # Prompts representativos enviados às ferramentas de IA
├── docs/
│   ├── data-contract.md          # Contrato de dados (ESP32, Python, front-end)
│   ├── architecture-decisions.md # Decisões técnicas
│   ├── security-review.md        # Revisão de segurança e testes do banco
│   └── deploy.md                 # Deploy na Vercel
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
    ├── e2e/                      # Testes em navegador real (Playwright)
    └── src/
        ├── components/
        │   ├── admin/            # StopForm, AdminStopCard
        │   ├── auth/             # AuthProvider, RequireAdmin
        │   ├── charts/           # SeriesChart (Recharts), ChartTooltip
        │   ├── dashboard/        # DashboardHero, DashboardSummary, StopGrid, StopStatusCard, ...
        │   ├── history/          # ReadingsEvolution, ReadingsSummary, ReadingsTable, PeriodFilter, ...
        │   ├── layout/           # AppLayout, Header (menu móvel), Sidebar, MainNav, navItems
        │   ├── map/              # Mapa MapLibre e lista alternativa
        │   ├── point360/         # Abas do Ponto 360°
        │   ├── stops/            # Explorar: filtros, lista, ficha do ponto
        │   └── ui/               # Button, Card, Badge, Section, MetricCard, EmptyState, Skeleton, ...
        ├── pages/                # Dashboard, Pontos, Histórico (também Análises e Relatórios), Laboratório, 404, AdminLogin, AdminStops
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

Detalhes em [docs/data-contract.md](docs/data-contract.md), [docs/architecture-decisions.md](docs/architecture-decisions.md), [docs/security-review.md](docs/security-review.md) e [docs/deploy.md](docs/deploy.md). A revisão de segurança também traz o passo a passo para rodar os testes SQL em um Supabase **local** (Docker).

## O que já funciona

- **Visão geral (`/`):** resumo dos pontos, última medição, alertas, evolução das últimas 24 h, insights e comparação entre dois pontos.
- **Explorar (`/pontos`):** mapa geográfico real (MapLibre + OpenFreeMap/OpenStreetMap, com atribuição), marcadores por estado ambiental (forma e cor), agrupamento, lista alternativa acessível, busca, filtros sincronizados com a URL, ficha do ponto e favoritos.
- **Ponto 360° (`/pontos/:código`):** visão, medições, comparação A/B e qualidade dos dados de um ponto, com período na URL e exportação CSV. Ponto inexistente mostra aviso e caminho de volta.
- **Histórico, Análises e Relatórios:** filtros de ponto, origem e período, gráficos, resumo por dia, perfis por hora e dia da semana, tabela e CSV.
- **Laboratório:** cenários demonstrativos para testar a interface sem sensor.
- **Área administrativa (`/admin/pontos`):** login e CRUD completo de pontos (criar, editar, ativar/desativar e excluir), com validação e confirmação.
- **Interface:** barra lateral compacta que expande ao passar o mouse e pode ser fixada, cabeçalho que se esconde ao rolar a página, tema claro e escuro automáticos, layout para 375, 768 e 1366 px, navegação por teclado e respeito a "reduzir movimento".
- **Transparência dos dados:** o modo de dados (Supabase ou demonstração) aparece sempre no cabeçalho; leituras de simulação e teste são identificadas e nunca apresentadas como medição real.
- **Qualidade:** `npm run lint` (0 erros), `npm run build`, 500+ testes unitários (`node --test`) e 28 arquivos de testes E2E em navegador real (Playwright, modo demonstração), incluindo acessibilidade (axe-core) e as larguras acima.

## Pendente

- **Ingestão automática do FIWARE:** o ESP32 envia ao FIWARE, mas ainda não há uma ponte automática FIWARE → Supabase. O servidor FIWARE da equipe só fica ligado nos testes, muda de IP a cada vez e responde só em HTTP, que o navegador bloqueia num site HTTPS. Por isso a aplicação não consulta o FIWARE direto; as leituras do ESP32 coletadas pela Central em Python foram importadas no Supabase (ver *Dados em produção*). Essa ponte é o próximo passo.
- **Coordenadas:** P001 a P003 usam a posição das estações INMET de referência, e os pontos do modo demonstração têm posições ilustrativas. Os endereços exatos dos pontos ainda serão confirmados.
- **Regras provisórias:** limites ambientais e regra de conectividade (60 s de intervalo de envio) são provisórios e estão descritos em "Fontes e metodologia".
- Detalhes técnicos e histórico das etapas: [docs/](docs/) e [AI.md](AI.md).
