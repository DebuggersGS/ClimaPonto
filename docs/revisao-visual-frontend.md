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

**Status: pendente da verificação final do harness** (a verificação final roda depois da T7). Até a data desta tarefa, nenhum gate E2E foi executado sobre o código final: não há screenshots "Depois", contagens de testes E2E nem aprovações a registrar. Nada abaixo foi observado em navegador.

### O que foi corrigido no código (confirmação visual pendente)

| Problema | Correção | Commit | Situação |
|---|---|---|---|
| Valores de temperatura e umidade quebravam entre número e unidade em 375 px | Separador não separável (U+00A0) em `formatters.js` e `whitespace-nowrap` com tamanhos responsivos nos valores | `de32ce0` | corrigido no código; confirmação visual pendente da verificação final (`valores-375.spec.mjs`) |
| Seletor de ponto do Histórico truncado | `sm:w-md` com `max-w-full` | `e60273d` | corrigido no código; confirmação visual pendente da verificação final |
| Rótulos do eixo X encostados no eixo Y | `tickMargin` e `padding` no eixo X | `e60273d` | corrigido no código; confirmação visual pendente da verificação final |
| E-mail do usuário no cabeçalho de 375 px | `max-w-32` no mobile | `e60273d` | corrigido no código; risco deduzido do código, confirmação pendente (`admin-qualidade.spec.mjs`) |
| Entradas animadas com movimento reduzido | `useReducedMotion` nos componentes de entrada | `9469be3`, `6f95a11` | corrigido no código; confirmação pendente (`movimento-reduzido.spec.mjs`) |

### Capturas que os specs T5/T6 geram (nomes de `snap`)

Para a execução final produzir, em Chromium e Firefox:

- Páginas (`qualidade.spec.mjs`, mobile 375 px e desktop 1366 px): `<pagina>-mobile` e `<pagina>-desktop`, com `<pagina>` conforme a lista `PAGES` do spec (Dashboard, Histórico, Pontos e 404).
- Área administrativa (`admin-qualidade.spec.mjs`): `login-mobile`, `login-desktop`, `admin-pontos-mobile`, `admin-pontos-desktop`.
- Estados (`<vp>` = `mobile`, `tablet` ou `desktop`, conforme `VIEWPORTS`): `estado-carregando-dashboard-<vp>`, `estado-erro-dashboard-<vp>`, `estado-carregando-historico-<vp>`, `estado-erro-historico-<vp>`, `estado-vazio-historico-<vp>`, `estado-carregando-pontos-<vp>`, `estado-erro-pontos-<vp>`, `estado-404-<vp>`.

As imagens não são copiadas para o repositório; ficam como artefatos do gate. A comparação "antes x depois" e a confirmação de cada linha acima só podem ser feitas depois dessa execução.
