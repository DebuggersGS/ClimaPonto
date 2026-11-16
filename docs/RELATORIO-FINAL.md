# Relatório final da release

Status: LOCAL_RELEASE_READY_WITH_BLOCKERS

Pendências humanas e externas: veja [BLOCKERS.md](../BLOCKERS.md). Os totais de testes E2E por navegador vêm do gate do harness (seção 5); o que foi de fato executado neste ambiente está nas seções 4 e 5.

## 1. Base, commits e pacote

| Item | Valor |
| --- | --- |
| Branch base | `harness/G-20261116-a1dfae` |
| HEAD base | `b61d184af3ca677ef32cdb5d6f0b5b8c2de05009` |
| Branch de trabalho | `harness/G-20261116-0865c5` |
| Commit do código verificado (T101) | `66b7019` (148 commits em `git rev-list --count HEAD`); os commits seguintes só alteram documentos, `release/MANIFEST.txt` e `release/SHA256SUMS` |
| Pacote | `release/ClimaPonto-GS-2026.2.zip` (fora do Git), gerado por `git archive` do último commit antes do commit do manifesto. O commit de origem é a primeira linha de `release/MANIFEST.txt`; o hash do ZIP está em `release/SHA256SUMS`. O HEAD final difere do commit do ZIP só por esses dois arquivos. |

Inventário medido em `web/src` e `web/e2e` (contagem dos arquivos no commit de código):

- **Rotas** (`App.jsx`): `/` (Visão geral), `/pontos` (Explorar), `/analises`, `/historico`, `/laboratorio`, `/relatorios`, `/admin/login`, `/admin/pontos` (protegida por `RequireAdmin`; `/admin` redireciona), apelidos `/visao-geral` e `/explorar` (redirecionam), `*` (404).
- **Páginas (7):** Dashboard, Stops, History (serve Histórico, Análises e Relatórios por parâmetro `view`), Lab, AdminLogin, AdminStops, NotFound.
- **Componentes:** 69 arquivos `.jsx` em `components/` (admin, auth, charts, dashboard, history, layout, palette, stops, ui); há ainda 6 arquivos `.js` auxiliares nessas pastas, que não são componentes.
- **Hooks:** 14 hooks `use*` em `hooks/` (mais `authContext.js`).
- **Serviços:** 14 em `services/`. **Utils:** 22 em `utils/`.
- **Testes unitários (`node:test`):** 29 arquivos `*.test.js` em `web/src`, entre eles `services/stopsApi.test.js`, `utils/releaseArtifacts.test.js` e `components/layout/navItems.test.js`.
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

## 3. Mudanças da release

- **T1 (`271b1c3`):** `web/src/services/stopsApi.test.js`, 9 testes `node:test` com cliente Supabase falso, sem rede: listar, criar, atualizar, ativar/desativar, excluir, zero linhas afetadas gerando `AppError` de tipo `permission`, tradução de erro e `countStopReadings`. Comprova o mapeamento das chamadas do cliente, **não** a escrita no Supabase remoto.
- **T2 (`b060943`):** ícones lucide-react decorativos na navegação (hoje parte do novo `MainNav.jsx`).
- **T101 (reorganização real da interface):** barra lateral retrátil no desktop (a partir de 1280 px) e menu móvel acessível; sete seções (Visão geral, Explorar, Análises, Histórico, Laboratório, Relatórios, Administração); metodologia recolhida em `<details>` ("Metodologia e premissas") no Dashboard, em Análises e em Relatórios; Laboratório e Relatórios passam a ser páginas próprias. Todas as rotas antigas continuam válidas. Decisões em [ARQUITETURA-E-DECISOES.md](ARQUITETURA-E-DECISOES.md). Specs E2E adaptados (nomes e caminhos) sem remover casos, e novos casos em `navegacao.spec.mjs`.

### Matriz antes → depois

| Funcionalidade anterior | Nova localização | Teste de regressão |
| --- | --- | --- |
| Dashboard (`/`, rótulo "Dashboard") | "Visão geral", mesma rota `/` | `navegacao.spec.mjs`, `dashboard.spec.mjs`, `visual-premium.spec.mjs` |
| Pontos (`/pontos`) | "Explorar", mesma rota (apelido `/explorar`) | `pontos.spec.mjs`, `mapa.spec.mjs`, `ficha-ponto.spec.mjs`, `favoritos.spec.mjs` |
| Insights e Comparador | Visão geral (inalterado) | `insights.spec.mjs`, `filtros.spec.mjs` |
| Regra provisória de conectividade (nota sempre visível no Dashboard) | recolhida: "Metodologia e premissas" no Dashboard, Análises e Relatórios | `navegacao.spec.mjs` (metodologia recolhida e por teclado) |
| Análises do período (perfis, linha do tempo, qualidade), antes dentro do Histórico | `/analises` | `historico-perfis.spec.mjs`, `qualidade.spec.mjs` |
| Histórico (leituras, evolução, tabela, CSV) | `/historico` (inalterado; mantém os botões de exportação) | `historico.spec.mjs`, `historico-exploracao.spec.mjs`, `conexao.spec.mjs` |
| Exportação CSV e relatório-resumo | `/relatorios` (e continuam no Histórico) | `historico-perfis.spec.mjs`, `historico-exploracao.spec.mjs` |
| Laboratório de sensores, antes no fim de Pontos | `/laboratorio` (só no modo mock; erro de dados mostra erro, não cenários) | `laboratorio.spec.mjs` |
| Paleta Ctrl+K | global; lista as seis seções públicas | `palette.spec.mjs`, `commandSearch.test.js` |
| Administração (rótulo "Gerenciar") | "Administração", rota `/admin/pontos` | `admin.spec.mjs`, `admin-qualidade.spec.mjs`, `filtros.spec.mjs` |
| Navegação em barra superior | barra lateral (desktop) / menu móvel | `navegacao.spec.mjs`, `filtros.spec.mjs`, `qualidade.spec.mjs` |

## 4. Gates executados nesta tarefa (T101, no ambiente do agente)

- `npm --prefix web run lint`: saída 0, 0 erros, 2 avisos preexistentes `set-state-in-effect` (`useLatestReadings.js`, `useReadingsHistory.js`).
- `npm --prefix web run build`: concluído. Chunks (kB, gzip entre parênteses): `MethodologyNote-*.js` (contém o Recharts) 384,21 (112,71); `index-*.js` 261,46 (82,61); `ReadingSourceBadge-*.js` 152,35 (51,86); `useDocumentTitle-*.js` 44,91 (15,34); `EmptyState-*.js` 35,12 (12,98); `DashboardPage-*.js` 33,65 (10,54); `HistoryPage-*.js` 30,55 (9,66); `components-*.js` 29,81 (10,92); `AdminStopsPage-*.js` 12,72 (4,49); `AdminLoginPage-*.js` 2,81 (1,38); `LabPage-*.js` 2,55 (1,21); `useNow-*.js` 2,29 (0,97); `FeedbackMessage-*.js` 0,83 (0,50); CSS 57,15 (10,61). Nenhum aviso de chunk acima de 500 kB.
- Testes unitários (`node --test "src/**/*.test.js"` em `web/`): 399 testes, 399 aprovados, 0 falhas, 0 pulados. `stopsApi.test.js`: 9 aprovados.
- Lighthouse e Core Web Vitals: **não medidos**.

## 5. Testes E2E e verificação visual

- **Não foram executados pelo agente**: o sandbox não tem navegador (Chromium/Firefox/Playwright indisponíveis e sem rede). Por isso, **não há total de aprovados/pulados por navegador para o commit desta tarefa**; o gate E2E do harness (Chromium e Firefox, modo mock) os produz. Não se afirma aprovação.
- Última execução real conhecida, anterior à T101 (HEAD `b78e7ea`, registrada em `AI.md`): 472 aprovados, 0 inesperados, 0 flaky, 32 pulados (Chromium 252 aprovados / 0 pulados; Firefox 220 aprovados / 32 pulados, o axe-core é pulado no Firefox em páginas com gráficos).
- A T101 alterou specs existentes (caminhos e rótulos) e acrescentou casos em `navegacao.spec.mjs` (barra lateral recolhida/expandida com `aria-expanded`, persistência, teclado, menu móvel em 375 px, acesso a cada seção, axe e screenshots em claro/escuro); os `test.skip` condicionados ao Firefox (axe-core) continuam, com motivo registrado, e os novos casos de axe seguem o mesmo padrão.
- **Screenshots antes/depois (AC9): não capturados.** Sem navegador no sandbox, não foi possível gerar capturas reais em 1366 e 375 px, claro e escuro, nem corrigir problemas visuais a partir delas. As capturas `nav-lateral-*`, `nav-lateral-recolhida-*` e `nav-movel-aberta-*` são geradas pelo gate E2E (`snap()`) na galeria do harness; ninguém as revisou ainda. Caminhos externos ao ZIP: a galeria de artefatos do objetivo no estado do harness. A conferência estética em 375, 768 e 1366 px, nos dois temas, é pendência humana.

## 6. Dados mock x real

- Modo `mock`: dataset fictício determinístico (8 cenários, semente `20261112`), leituras `simulation`/`test`; login e CRUD só em memória, com aviso na interface. Os E2E rodam nesse modo.
- Modo `supabase`: banco `climaponto-gs-2026` com pontos demonstrativos (`is_demo`). Não há leituras reais de ESP32: o endpoint de ingestão não existe.
- Nunca há mistura de fontes nem fallback para mock em erro. O Laboratório só mostra cenários no modo mock.
- Esta release não fez escrita remota, push, deploy nem envio.

## 7. Alertas não implementados

Os alertas da interface (`stopAlerts.js`, `AlertsPanel`) são calculados no cliente a partir das leituras e do estado gravado. Não existe notificação externa (e-mail, push, SMS), alerta persistido no banco nem limiar ambiental aprovado: o front-end exibe o estado gravado, não classifica.

## 8. Limitações e pendências externas

- Pendências externas (GitHub privado e permissões, deploy, envio no Teams, CRUD remoto com usuário de teste): [BLOCKERS.md](../BLOCKERS.md).
- Mapa esquemático SVG (pontos remotos sem coordenadas); consulta de histórico limitada a 500 registros; axe-core pulado no Firefox em páginas com gráficos; sem testes de componentes React; sem Lighthouse; sem imagens de referência aprovadas (`toHaveScreenshot`).
- Barra lateral só a partir de 1280 px: entre 1024 e 1279 px vale o menu móvel, para não espremer o mapa e a ficha.
- O E2E novo e os adaptados nunca rodaram contra esta interface; falhas de seletor ou de layout só aparecerão no gate.
