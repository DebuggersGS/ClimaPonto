# Cenários de demonstração S01–S23

Status da release: LOCAL_READY_PENDING_REMOTE. Nenhum deploy, push, escrita no Supabase remoto ou aceite visual humano ocorreu; por isso **nenhum cenário foi verificado em URL de produção**.

## Como ler os status

- `verified`: existe teste no repositório que cobre o cenário. Foram executados pelo agente apenas os testes unitários (`node --test`). Os specs E2E (`web/e2e/*.spec.mjs`) foram escritos ou adaptados, mas **não foram executados pelo agente**; onde a evidência é E2E, o status vale com a ressalva "depende do gate E2E do harness, ainda pendente".
- `blocked`: depende de deploy, Supabase remoto, admin real, rede, dados rastreáveis ou aceite humano. O motivo está em [BLOCKERS.md](../BLOCKERS.md).
- `not_applicable`: nenhum cenário nesta rodada.

## Como reproduzir localmente (modo demonstrativo)

1. Em `web/`, `npm run dev` com `VITE_DATA_MODE=mock` (8 pontos `MOCK-01` a `MOCK-08`, semente fixa; leituras `simulation`/`test`). Todo dado aparece com o selo **Demonstrativo**.
2. Login administrativo do modo mock: credenciais fictícias exibidas na própria tela `/admin/login`, sem senha real. Não há conta admin pública no remoto.
3. Reset: recarregar a página (o mock é em memória; favoritos ficam em `localStorage`).
4. Responsável: Enrico (equipe ClimaPonto). URL de deploy: **não existe** (ver BLOCKERS).

## Tabela

| ID | Cenário | Status | Evidência (arquivo) / justificativa | Passos |
| --- | --- | --- | --- | --- |
| S01 | Explorar parada existente com localização comprovável | blocked | O mapa MapLibre e a busca existem (`explorar-mapa.spec.mjs`, `explorar-filtros.spec.mjs`), mas as coordenadas dos pontos são ilustrativas: não há GTFS/GeoSampa com licença checada. Localização não comprovável. | Explorar, buscar "MOCK-01", abrir o painel |
| S02 | Condição disponível com unidade, fonte e data | blocked | Valor com unidade, origem e carimbo aparece no demonstrativo (`ponto-360.spec.mjs`), mas não há sensor real nem API externa (Open-Meteo não integrada). | Ponto 360, aba Visão geral |
| S03 | Leitura antiga sem dizer "ao vivo" | verified | `utils/stopAlerts.test.js` (leitura antiga vira alerta de conectividade "desatualizado"); `e2e/alertas.spec.mjs`. Dado demonstrativo. | Visão geral, abrir Alertas |
| S04 | Sem medições: estado vazio honesto | verified | `e2e/ponto-360.spec.mjs` ("ponto sem leituras"), `e2e/ficha-ponto.spec.mjs` (MOCK-04 "Sem dados"). Depende do gate E2E. | Abrir `/pontos/MOCK-04` |
| S05 | Ponto offline com regra conhecida | verified | `utils/stopAlerts.test.js` e `utils/connectivity.test.js`: regra provisória 5 × intervalo de envio, explicitada no texto do alerta. Regra ainda não definida para o dispositivo real. | Visão geral, Alertas |
| S06 | Alerta térmico com estado, limite e fonte | verified | `utils/stopAlerts.test.js`, `e2e/alertas.spec.mjs`. Limiar ambiental aprovado não existe: o front-end exibe o estado gravado. Cenário etiquetado como demonstrativo. | Visão geral, abrir Alertas |
| S07 | Comparar dois pontos | verified | `utils/stopComparison.test.js` (inclui "não comparável" com motivo); `e2e/ponto-360.spec.mjs` (A/B). | Ponto 360, aba Comparar |
| S08 | Filtros combinados | verified | `utils/stopFilterParams.test.js`, `utils/stopFilters.test.js`; `e2e/explorar-filtros.spec.mjs` (lista e URL). Período e métricas fora do Explorar são cobertos por `historico.spec.mjs`. | Explorar, combinar bairro, origem e status |
| S09 | Favoritos e navegação | verified | `utils/favoriteStops.test.js`; `e2e/favoritos.spec.mjs`, `e2e/explorar-filtros.spec.mjs`. Persistência em `localStorage` (sem usuário). | Favoritar, recarregar, "Somente favoritos" |
| S10 | Exportar evidência CSV | verified | `utils/readingsCsv.test.js`; `e2e/ponto-360.spec.mjs` e `e2e/historico-exploracao.spec.mjs` (nome, cabeçalho, origem). Dados demonstrativos. | Ponto 360, Medições, Exportar CSV |
| S11 | CRUD administrativo remoto | blocked | Exige Supabase remoto com papel admin e autorização. Local: `services/stopsApi.test.js` (cliente falso) e `e2e/admin.spec.mjs` (mock em memória). | Não executável sem autorização |
| S12 | RBAC negativo no backend | blocked | RLS é testada só no banco local (`supabase/tests/rls_policies.test.sql`), não executada nesta rodada nem no remoto. Na interface, `e2e/admin.spec.mjs` cobre o redirecionamento ao login. | Pendente no remoto |
| S13 | Falha da fonte externa com retry | blocked | Sem fonte externa integrada. Parcial: `e2e/conexao.spec.mjs` (offline) e `?mock=erro` em `admin.spec.mjs`; sem timestamp de cache. | Pendente |
| S14 | Jornada móvel em 375 px na produção | blocked | Exige URL de produção. Localmente: `e2e/sidebar.spec.mjs`, `explorar-mapa.spec.mjs` e `ponto-360.spec.mjs` incluem 375 px (não executados pelo agente). | Pendente |
| S15 | Acessibilidade | verified | `e2e/qualidade.spec.mjs` (axe, teclado), `e2e/movimento-reduzido.spec.mjs`, `e2e/interacoes.spec.mjs`. Depende do gate E2E; axe é pulado no Firefox em páginas com gráfico (limite conhecido). | Tab, tema escuro, movimento reduzido |
| S16 | História CitizenTech | blocked | Não há página ou roteiro: o termo "CitizenTech" não é definido no repositório. | Pendente de decisão da equipe |
| S17 | Sidebar: hover, pin, estado | verified | `utils/sidebarState.test.js`; `e2e/sidebar.spec.mjs` (atraso de intenção, pin persistido, teclado, Esc, drawer). Vídeo de interação não gravado. | Desktop >= 1280 px, passar o mouse e fixar |
| S18 | Busca e filtros espaçados e animados | verified | `e2e/explorar-filtros.spec.mjs` e `e2e/interacoes.spec.mjs` (limpar busca, Esc, foco). Aparência (raio, espaçamento) não conferida por humano. | Explorar, buscar e limpar |
| S19 | Mapa para Ponto 360° | verified | `e2e/ponto-360.spec.mjs` (URL, abas, vazio, CSV, voltar); `utils/geoMap.test.js`, `utils/stopMap.test.js`. | Explorar, abrir painel, "Abrir ponto" |
| S20 | Comparação coerente de pontos | verified | `utils/stopComparison.test.js`; `e2e/ponto-360.spec.mjs`. Sem gráfico fictício: incompatibilidade vira mensagem. | Ponto 360, Comparar |
| S21 | Falha do mapa sem perder a jornada | verified | `e2e/explorar-mapa.spec.mjs` (blocos abortados, sem WebGL, retry, lista de reserva, atribuição). Sem rede real. | Bloquear tiles e recarregar |
| S22 | Acessibilidade das microinterações | verified | `utils/motionTokens.test.js`; `e2e/interacoes.spec.mjs`, `e2e/sidebar.spec.mjs` (sem hover obrigatório, teclado, movimento reduzido). | Ativar movimento reduzido no sistema |
| S23 | Densidade visual por tela | blocked | Há matriz textual em `docs/MATRIZ-DE-CONTEUDO-E-UX.md`, mas não há capturas antes/depois reais. Veja [QA-VISUAL.md](QA-VISUAL.md). | Pendente de aceite humano |

Contagem: 15 verified, 8 blocked, 0 not_applicable.
