# Relatório final da release

Status: LOCAL_RELEASE_READY_WITH_BLOCKERS

Pendências humanas e externas: veja [BLOCKERS.md](../BLOCKERS.md). Totais de testes e gates: relatório de verificação do harness (objetivo G-20261116-0865c5); este documento não os repete.

## 1. Base e inventário

| Item | Valor |
| --- | --- |
| Branch base | `harness/G-20261116-a1dfae` |
| HEAD base | `b61d184af3ca677ef32cdb5d6f0b5b8c2de05009` |
| Branch de trabalho | `harness/G-20261116-0865c5` |
| Commits (`git rev-list --count HEAD`) | 140 no HEAD `b060943`, antes dos commits de documentação da T3 |
| ZIP, `release/MANIFEST.txt`, `release/SHA256SUMS` | gerados pela T4 (não existem nesta tarefa) |

Inventário medido em `web/src` e `web/e2e` (arquivos de código, sem testes):

- **Rotas** (`App.jsx`): `/` (Dashboard), `/pontos`, `/historico`, `/admin/login`, `/admin/pontos` (protegida por `RequireAdmin`; `/admin` redireciona), `*` (404).
- **Páginas (6):** Dashboard, Stops, History, AdminLogin, AdminStops, NotFound.
- **Componentes:** 71 arquivos em `components/` (admin, auth, charts, dashboard, history, layout, palette, stops, ui).
- **Hooks:** 13 em `hooks/` (mais `authContext.js`), entre eles useStops, useLatestReadings, useReadingsHistory, useAuth, useAdminStops, useFavoriteStops, useCommandPalette, useDataMode.
- **Serviços:** 14 em `services/`.
- **Utils:** 22 em `utils/`.
- **Testes unitários (`node:test`):** 27 arquivos `*.test.js` em `web/src`, incluindo `services/stopsApi.test.js` (T1).
- **Specs E2E (21)** em `web/e2e`: admin, admin-qualidade, alertas, conexao, dashboard, favoritos, ficha-ponto, filtros, historico, historico-exploracao, historico-perfis, insights, laboratorio, mapa, movimento-reduzido, navegacao, palette, pontos, qualidade, valores-375, visual-premium.

## 2. Requisitos do edital

Rótulos: ATENDE / PARCIAL / NÃO ATENDE / NÃO VERIFICÁVEL. Detalhes por critério em [MATRIZ-FIAP.md](MATRIZ-FIAP.md). O enunciado oficial não está no repositório; a lista segue [requisitos-fiap-frontend.md](requisitos-fiap-frontend.md).

| Requisito | Classificação |
| --- | --- |
| React + Vite + Tailwind | ATENDE |
| 8 ou mais componentes | ATENDE |
| useState/useEffect e 2 ou mais custom hooks | ATENDE |
| Camadas (pages/components, hooks, services, utils) | ATENDE |
| CRUD real com API externa (Supabase) | PARCIAL: cliente coberto por teste com cliente falso; escrita remota não verificada nesta release |
| Aplicação funcional "CitizenTech" | NÃO VERIFICÁVEL: termo não definido no repositório |
| 15 ou mais commits, README e AI.md | ATENDE |
| GitHub privado, write dos professores, ZIP, deploy | NÃO VERIFICÁVEL |
| Prazo 19/11/2026 23h55 | NÃO VERIFICÁVEL (depende do envio) |

Nenhum requisito foi classificado como NÃO ATENDE.

## 3. Mudanças de T1 e T2

- **T1 (`271b1c3`):** `web/src/services/stopsApi.test.js`, 9 testes `node:test` com cliente Supabase falso, sem rede: listar, criar, atualizar, ativar/desativar, excluir, zero linhas afetadas gerando `AppError` de tipo `permission`, tradução de erro e `countStopReadings`. Reexecutado na T3: 9 aprovados, 0 falhas. Comprova o mapeamento das chamadas do cliente, **não** a escrita no Supabase remoto.
- **T2 (`b060943`):** única mudança de UX: ícones lucide-react decorativos (`aria-hidden`, ocultos abaixo de 640 px) em `MainNav.jsx`, com traço mais grosso no item ativo. Nenhuma rota, página ou capacidade foi movida, criada ou removida; a metodologia do Dashboard não foi recolhida. A interface não foi inspecionada renderizada e não há screenshots antes/depois.
- **Reorganização ampla de UX/navegação: PARCIAL / não realizada** (sidebar, páginas Explorar/Análises/Relatórios). Não foi feita por limite de orçamento da execução.

## 4. Verificações observadas na T3

- `npm run lint` (em `web/`): código de saída 0, 2 avisos preexistentes `set-state-in-effect` (`useLatestReadings.js`, `useReadingsHistory.js`).
- `npm run build`: concluído. Maior chunk `StopSelect-*.js` (Recharts): 382,67 kB (112,02 kB gzip); `index-*.js` 254,88 kB (80,68 kB gzip); CSS 55,56 kB (10,33 kB gzip).
- `node --test src/services/stopsApi.test.js`: 9 testes, 9 aprovados, 0 falhas.
- Suíte completa (`node --test` nos arquivos) e E2E Playwright em modo mock (Chromium e Firefox, pelo harness): totais e pulos no relatório do harness.
- Lighthouse e Core Web Vitals: **não medidos**.

## 5. Dados mock x real

- Modo `mock`: dataset fictício determinístico (8 cenários, semente `20261112`), leituras `simulation`/`test`; login e CRUD só em memória, com aviso na interface. Os E2E rodam nesse modo.
- Modo `supabase`: banco `climaponto-gs-2026` com pontos demonstrativos (`is_demo`). Não há leituras reais de ESP32: o endpoint de ingestão não existe.
- Nunca há mistura de fontes nem fallback para mock em erro.
- Esta release não fez escrita remota, push, deploy nem envio.

## 6. Alertas não implementados

Os alertas da interface (`stopAlerts.js`, `AlertsPanel`) são calculados no cliente a partir das leituras e do estado gravado. Não existe notificação externa (e-mail, push, SMS), alerta persistido no banco nem limiar ambiental aprovado: o front-end exibe o estado gravado, não classifica.

## 7. Limitações

Mapa esquemático SVG (pontos remotos sem coordenadas); consulta de histórico limitada a 500 registros; axe-core pulado no Firefox em páginas com gráficos; sem testes de componentes React; sem Lighthouse; sem imagens de referência aprovadas (`toHaveScreenshot`).
