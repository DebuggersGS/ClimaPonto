# Relatório final da release

Status: LOCAL_READY_PENDING_REMOTE

A implementação local está estável, mas as etapas externas (deploy, Supabase remoto com admin real, aceite visual humano) não foram feitas. `PROFESSOR_READY` **não** é declarado. Pendências: [BLOCKERS.md](../BLOCKERS.md). Cenários S01–S23: [CENARIOS-DEMONSTRACAO.md](CENARIOS-DEMONSTRACAO.md).

## 1. Base e branch

| Item | Valor |
| --- | --- |
| Branch de trabalho | `harness/G-20261117-cfedb6` |
| Base da rodada | `342755f` |
| HEAD final | consultar com `git rev-parse HEAD` na branch (não registrado aqui para não divergir do commit que contém este arquivo) |
| Pacote ZIP | não gerado nesta rodada; `release/MANIFEST.txt` e `release/SHA256SUMS` são da release anterior e não valem para este HEAD |

## 2. O que mudou nesta rodada (T1–T10)

Fonte: `git log --oneline 342755f..HEAD`.

- Marca própria (favicon, ícones, Open Graph, `Logo`) e guia em `docs/BRAND-GUIDE.md`.
- Cabeçalhos de segurança com CSP liberando `tiles.openfreemap.org` (`web/vercel.json`).
- Mapa MapLibre sob demanda (`react-map-gl`), com cluster, marcadores por estado (cor e forma), legenda, atribuição e lista de reserva quando falham WebGL, estilo ou tiles.
- Filtros de pontos sincronizados com a URL; Explorar com busca, filtros em linha e painel/sheet contextual.
- Rota `/pontos/:id` (Ponto 360°): visão, medições, comparação A/B e qualidade; estado vazio honesto; CSV.
- Sidebar compacta com hover de intenção, pin persistido, grupos, acessos rápidos e drawer no toque.
- Conjunto demonstrativo selecionável (`?dados=demonstracao`) com selo permanente "Demonstrativo".
- Primitives de UI (Base UI), tokens de movimento, paleta de comandos com ações reais.
- Dependências novas autorizadas pelo humano e instaladas pelo serviço confiável: `maplibre-gl` 6.19.0, `react-map-gl` 8.1.3, `@base-ui/react` 1.9.0 (`motion` já constava em `package.json`).

## 3. Inventário medido no HEAD desta documentação

- 90 arquivos `.jsx` em `web/src/components`; 17 hooks `use*` em `web/src/hooks`.
- 37 arquivos `*.test.js` em `web/src`; 27 specs E2E em `web/e2e`.
- 188 commits (`git rev-list --count HEAD`) na branch; contagem sujeita a aumentar com os commits desta tarefa.

## 4. Requisitos do edital

Rótulos: ATENDE / PARCIAL / NÃO ATENDE / NÃO VERIFICÁVEL. Detalhes em [MATRIZ-FIAP.md](MATRIZ-FIAP.md).

| Requisito | Classificação |
| --- | --- |
| React + Vite + Tailwind | ATENDE |
| 8 ou mais componentes | ATENDE |
| useState/useEffect e 2 ou mais custom hooks | ATENDE |
| Camadas (pages/components, hooks, services, utils) | ATENDE |
| CRUD real com API externa (Supabase) | PARCIAL: cliente coberto por teste com cliente falso; escrita remota não reverificada nesta rodada |
| Aplicação funcional "CitizenTech" | NÃO VERIFICÁVEL: termo não definido no repositório |
| 15 ou mais commits, README e AI.md | ATENDE |
| GitHub privado, write dos professores, ZIP, deploy | NÃO VERIFICÁVEL |
| Prazo 19/11/2026 23h55 | NÃO VERIFICÁVEL (depende do envio) |

Nenhum requisito foi classificado como NÃO ATENDE.

## 5. Cenários S01–S23

15 verified, 8 blocked, 0 not_applicable (tabela individual em `CENARIOS-DEMONSTRACAO.md`). "verified" significa que existe teste no repositório; os de natureza E2E dependem do gate ainda pendente.

## 6. Verificações executadas pelo agente (T11, na worktree)

- `node --test` sobre todos os `web/src/**/*.test.js`: 500 testes, 500 aprovados, 0 falhas, 0 pulados (antes da atualização de `releaseArtifacts.test.js`).
- `npm --prefix web run lint` e `node --test web/src/utils/releaseArtifacts.test.js`: lint sem erros (2 avisos preexistentes `set-state-in-effect`) e `releaseArtifacts.test.js` 13/13.
- `npm run build`: não executado na T11.
- **Não foram executados pelo agente:** os specs E2E (inclusive os novos `explorar-mapa`, `explorar-filtros`, `ponto-360`, `sidebar`, `interacoes`, `selo-demonstrativo` e os adaptados). A execução fica para os gates de verificação do harness, ainda não rodados no momento desta documentação. Nenhum resultado E2E é declarado aqui.
- Screenshots antes/depois: não geradas. Lighthouse e Core Web Vitals: não medidos.

## 7. Dados mock x real

- Modo `mock`: dataset fictício determinístico (8 pontos, semente `20261112`), leituras `simulation`/`test`, selo "Demonstrativo".
- Modo `supabase`: padrão observado; demonstrativo só por escolha explícita; sem fallback silencioso para mock.
- Coordenadas dos pontos demonstrativos são ilustrativas (sem GTFS/GeoSampa rastreável). Não há leituras reais de ESP32.
- Nenhum push, deploy, escrita remota, envio ou aceite visual humano ocorreu.

## 8. Alertas e limites

Alertas são calculados no cliente a partir do estado gravado; sem notificação externa nem limiar ambiental aprovado. Open-Meteo e GTFS não integrados. Consulta de histórico limitada a 500 registros.
