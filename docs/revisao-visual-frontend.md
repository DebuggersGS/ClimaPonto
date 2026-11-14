# Revisão visual do front-end

Objetivo G-20261114-4ef93c, tarefa T4. Este documento registra só o que foi observado nas capturas; nada aqui é medição de sensor.

## Método

- Capturas feitas pelo gate E2E do harness (Playwright), em **Chromium e Firefox**, com a aplicação em **modo mock** (dados fictícios locais, sem rede).
- Larguras avaliadas: 375 px (mobile) e 1366 px (desktop); também existem capturas de tablet, não revisadas em detalhe.
- Páginas: Dashboard, Histórico e Pontos. Na verificação final (gate 0030) também há capturas da página 404 (`estado-404-*`, `nao-encontrada-*`) e dos estados de carregamento, erro e vazio (`estado-carregando-*`, `estado-erro-*`, `estado-vazio-historico-*`).
- Leitura manual das imagens (`dashboard-mobile.png`, `historico-desktop.png`, `pontos-mobile.png`) e leitura do código dos componentes de estado (Skeleton, EmptyState, DashboardStates, estados do Histórico).

## Origem do "antes"

- Objetivo G-20261114-3bcf79, evidências `0012-gate-e2e-artifacts` e `0017-gate-e2e-artifacts` (ambas com gate e2e `ok: true`).
- HEAD base registrado no `evidence.jsonl` dessas duas execuções: `94f7f5be50c1a7a45201fdb94a8a7d78674c1d1b` (94f7f5b).
- As capturas não foram copiadas para o repositório.
- **Login e lista administrativa não têm "antes"**: não eram renderizáveis no modo mock na base (a autenticação demonstrativa e as escritas em memória do mock vieram depois).
- O `dashboard-mobile.png` tem 375x8035 px; ao ser reduzido para leitura, só a estrutura geral é distinguível. Detalhes finos do Dashboard em 375 px não foram avaliados pixel a pixel.

## Achados e correções

| Problema | Página / largura / navegador | Categoria | Correção ou motivo de não corrigir |
|---|---|---|---|
| Seletor de ponto truncado ("MOCK-01 — Av. Paulista × Rua d…") | Histórico, 1366 px, Firefox | espaçamento / usabilidade | Largura do contêiner ampliada de `sm:w-80` para `sm:w-md` com `max-w-full` (`web/src/pages/HistoryPage.jsx`). |
| Primeiro rótulo do eixo X ("21:27") encostado no rótulo do eixo Y ("20°C") | Histórico, 1366 px, Firefox | cards/gráficos/indicadores | `tickMargin={8}` e `padding` lateral no eixo X (`web/src/components/charts/SeriesChart.jsx`). |
| E-mail do usuário (ex.: `admin.demo@climaponto.example`) com até 160 px somado ao selo do modo de dados e ao botão "Sair" no cabeçalho de 375 px: risco de estouro | Cabeçalho, 375 px | mobile | Limite do e-mail reduzido para `max-w-32` no mobile (`sm:max-w-48`); o contêiner já tem `flex-wrap` (`web/src/components/layout/Header.jsx`). Sem captura "antes" com sessão: risco deduzido do código, não observado. |
| Entradas animam opacidade e deslocamento (`y`) mesmo com `prefers-reduced-motion: reduce`; `MotionConfig reducedMotion="user"` só desliga o transform e o stagger atrasa a exibição | Dashboard, Histórico, Pontos | movimento | `useReducedMotion()` em `Reveal`, `AnimatedList`, `SeriesChart`, `DashboardPage` (transição de fase), `HistoryPage` (fade), `MainNav` e `SegmentedControl` (indicador sem transição): renderização direta no estado final. Recharts já usava `isAnimationActive={!reducedMotion}`. |
| Pontos em 375 px: cartões legíveis, hierarquia título > código > bairro > descrição consistente | Pontos, 375 px, Chromium | tipografia / hierarquia | Sem problema observado; nenhuma alteração. |
| Histórico em 1366 px: hierarquia de títulos, cartões de Temperatura/Umidade, tabela e selos de origem consistentes | Histórico, 1366 px, Firefox | hierarquia / cards | Sem problema observado; nenhuma alteração. |
| Estados de carregamento, vazio e erro | Dashboard, Histórico | estados | Apenas leitura do código; não houve captura desses estados na revisão. Textos preservados por dependerem dos E2E. |

## Verificações desta tarefa (T4, antes da verificação final)

- `npm run lint`: sem avisos novos (permanecem dois avisos `set-state-in-effect` preexistentes em `useReadingsHistory.js` e `useLatestReadings.js`).
- `npm run build`: concluído.
- `node --test` nos `*.test.js` de `web/src`: 228 testes, 228 aprovados.
- Movimento reduzido e ausência de rolagem horizontal em 375 px com sessão não foram executados na T4; foram confirmados depois, no gate E2E (seção abaixo).

## Depois

**Fonte:** verificação final do harness no HEAD `cbbd4a8` (evidências 0027 lint, 0028 build, 0030 E2E, 0031 testes unitários). Os gates foram executados nesse HEAD; os commits posteriores (T104) alteram apenas `web/src/components/auth/AuthProvider.jsx`, `web/src/components/layout/MainNav.jsx` e documentação, e **uma nova verificação será feita** sobre eles. Os números abaixo valem para `cbbd4a8`.

### Resultado dos gates em `cbbd4a8`

| Gate | Resultado |
|---|---|
| lint (0027) | aprovado |
| build (0028) | aprovado |
| E2E (0030), Chromium e Firefox | 190 aprovados, 0 falhas, 0 flaky, 4 pulados (axe no Firefox nas páginas com gráficos, com motivo no teste); 56 screenshots (28 nomes x 2 navegadores) |
| testes unitários (0031) | 228/228 |

Artefatos: `/home/harness/claude-harness/state/climaponto/goals/G-20261114-4ef93c/evidence/0030-gate-e2e-artifacts` (`summary.json`, `gallery.html`). As imagens não são copiadas para o repositório.

### Ciclos de verificação até a aprovação

A verificação reprovou três vezes antes de aprovar; cada falha apontou um problema real ou de medição:

1. HEAD `122c82f`: 11 falhas e 1 flaky. Corrigidos: tendência do resumo quebrando em duas linhas (`a4968a3`, ícone no `dt` e texto em um único nó); título h2 "Pontos cadastrados" da lista administrativa sobreposto por estar `sr-only` (`51c6855`, h2 visível com a contagem ao lado); teste do bairro do MOCK-05 lia a lista filtrada (`4a0c395`, limpa a pesquisa antes).
2. HEAD `4a0c395`: 1 falha (Firefox "Page crashed" em `medir()` no Dashboard). `b37bf2d`: medição elemento a elemento, sem `Range` sobre o `sr-only`.
3. HEAD `b37bf2d`: 6 falhas (`medir()` contava 0 linhas na tendência) e 1 flaky (axe no login em tema escuro, Firefox, "Page crashed"). `bb51488`: TreeWalker sobre todos os nós de texto visíveis; `cbbd4a8`: topos de linha agrupados com tolerância de meio `font-size`.
4. HEAD `cbbd4a8`: aprovado (números acima).

O "Page crashed" do Firefox é intermitente (ocorreu também no axe do login escuro e passou na execução final): fica registrado como observação, sem causa raiz identificada.

### Problemas corrigidos e confirmação

| Problema | Correção | Confirmação no gate 0030 |
|---|---|---|
| Valores de temperatura e umidade quebravam entre número e unidade em 375 px | U+00A0 em `formatters.js` e `whitespace-nowrap` (`de32ce0`) | `valores-375.spec.mjs` aprovado nos dois navegadores (linhas = 1, sem estouro) |
| Tendência do resumo (ex.: "Caiu (−0,8 °C)") quebrava em duas linhas (achado da verificação) | Ícone no `dt` e texto em nó único `nowrap` (`a4968a3`, `ReadingsSummary.jsx`) | `valores-375`; `historico-desktop` (Firefox) mostra a tendência em uma linha |
| Título "Pontos cadastrados" sobreposto na lista administrativa (achado da verificação) | h2 visível, com a contagem ao lado (`51c6855`, `AdminStopsPage.jsx`) | `admin-qualidade.spec.mjs`; `admin-pontos-desktop` e `admin-pontos-mobile` (Chromium) |
| Seletor de ponto do Histórico truncado | `sm:w-md` com `max-w-full` (`e60273d`) | `historico-desktop` (Firefox): rótulo "MOCK-01 — Av. Paulista × Rua da Consolação" completo |
| Rótulos do eixo X encostados no eixo Y | `tickMargin` e `padding` (`e60273d`) | `historico-desktop` (Firefox): "17:02" separado de "20°C" |
| E-mail do usuário no cabeçalho de 375 px | `max-w-32` no mobile (`e60273d`) | `admin-qualidade.spec.mjs` (sem rolagem lateral nem obscurecimento); `admin-pontos-mobile`: e-mail truncado ("admin.demo@cl…") e botão "Sair" visíveis |
| Entradas animadas com movimento reduzido | `useReducedMotion` (`9469be3`, `6f95a11`) | `movimento-reduzido.spec.mjs` aprovado |

### Observado nas capturas do 0030 e situação

- `historico-desktop` (Firefox, aberto na revisão): hierarquia, cartões, gráficos, tabela e selos de simulação legíveis e consistentes.
- `dashboard-mobile` (Chromium, 375x3450): só a estrutura geral é distinguível quando reduzida; detalhes finos não foram avaliados.
- `admin-pontos-mobile` (Chromium): cartões empilhados sem corte, mas o item ativo **"Gerenciar" da navegação aparecia cortado na borda direita** da área rolável. Era comportamento preexistente (`overflow-x-auto` no `MainNav`; o gate não acusa rolagem da página). **Corrigido no código em T104** (`MainNav.jsx` rola só a navegação até o item ativo); **ainda sem confirmação em gate**: a captura citada é anterior à correção e a nova verificação deve confirmá-la.
- Recusa de conta sem papel admin podia exibir depois o aviso falso "Sua sessão expirou": corrigido em T104 (`AuthProvider.jsx`), sem teste automatizado (não há infraestrutura de teste de componentes e a pasta `web/e2e` está fora do escopo da T104); fica como pendência de teste.
- Estados (carregando, erro, vazio) e 404: há capturas `estado-*` para mobile e desktop; nesta revisão só `estado-vazio-historico-mobile` foi citado pelo revisor; os demais não foram avaliados imagem a imagem.

### Capturas geradas (nomes de `snap`)

- Páginas (`qualidade.spec.mjs`): `dashboard`, `historico`, `pontos` e `nao-encontrada`, em `-mobile` e `-desktop`.
- Administração (`admin-qualidade.spec.mjs`): `login-mobile`, `login-desktop`, `admin-pontos-mobile`, `admin-pontos-desktop`.
- Estados: `estado-carregando-`, `estado-erro-` (dashboard, historico, pontos), `estado-vazio-historico-` e `estado-404-`, em `mobile` e `desktop`.

A aprovação estética definitiva continua com a equipe (login e lista administrativa a 375 px; Histórico a 1366 px).
