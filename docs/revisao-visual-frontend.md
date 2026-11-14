# Revisão visual do front-end

Objetivo G-20261114-4ef93c, tarefa T4. Este documento registra só o que foi observado nas capturas; nada aqui é medição de sensor.

## Método

- Capturas feitas pelo gate E2E do harness (Playwright), em **Chromium e Firefox**, com a aplicação em **modo mock** (dados fictícios locais, sem rede).
- Larguras avaliadas: 375 px (mobile) e 1366 px (desktop); também existem capturas de tablet, não revisadas em detalhe.
- Páginas: Dashboard, Histórico e Pontos.
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

## Verificações desta tarefa

- `npm run lint`: sem avisos novos (permanecem dois avisos `set-state-in-effect` preexistentes em `useReadingsHistory.js` e `useLatestReadings.js`).
- `npm run build`: concluído.
- `node --test` nos `*.test.js` de `web/src`: 228 testes, 228 aprovados.
- O comportamento com movimento reduzido e a ausência de rolagem horizontal em 375 px com sessão **não foram executados** nesta tarefa; dependem do gate E2E.

## Depois

_A preencher pela T7 com as capturas e resultados do gate após as correções._
