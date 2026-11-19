# Uso de Inteligência Artificial

Este documento registra, de forma transparente, como ferramentas de Inteligência Artificial foram usadas no desenvolvimento da aplicação web do ClimaPonto (Front-end Design e Web Development). Segue as cinco partes pedidas no enunciado; no fim estão a explicação da autoria dos commits e uma linha do tempo resumida do desenvolvimento. Os prompts representativos estão em [prompts.md](prompts.md).

## 1. Ferramentas utilizadas

| Ferramenta | Finalidade no projeto |
| --- | --- |
| **ChatGPT** (OpenAI) | Planejamento da arquitetura, priorização dos requisitos do enunciado, redação das instruções de cada etapa e revisão técnica das entregas (aprovar, pedir correções). |
| **Claude Code** (Anthropic), na extensão do VS Code e no terminal, com os modelos **Claude Opus 5.5** (planejamento, revisão e implementação) e **Claude Sonnet 5.5** (implementação de parte das tarefas entre 12 e 16/11) | Implementação: leitura do código, criação e edição de arquivos, comandos de terminal, execução de lint, build, testes unitários e testes em navegador, e diagnóstico de erros. |

O integrante responsável pela parte web (Enrico) conduziu o processo: escreveu ou repassou os pedidos, revisou os resultados, decidiu o que era aprovado e fez os testes de uso.

## 2. Interações realizadas

Exemplos representativos (os textos completos dos pedidos estão em [prompts.md](prompts.md)):

| Pedido do integrante | Resposta e resultado |
| --- | --- |
| Etapa 1: criar a base do front-end com React + Vite, Tailwind CSS e React Router, com estrutura de pastas e páginas iniciais. | A IA criou o projeto em `web/`, configurou o Tailwind 4, montou layout, navegação e páginas provisórias e rodou build e lint. |
| Etapa 2B: login administrativo e CRUD de pontos no Supabase, sem bibliotecas novas. | A IA implementou `stopsApi.js` (criar, consultar, atualizar, ativar/desativar e excluir), o hook `useAdminStops` e a tela de gestão; a primeira migração foi recusada pela integração por usar `DROP POLICY`, e a IA reescreveu com `ALTER POLICY`, aplicada após a aprovação do integrante. |
| "Corrigir integralmente os problemas da versão atual" (sidebar sobrepondo o conteúdo, logo cortado, cabeçalho grande, mapa que não carregava e tela preta ao clicar em "Abrir ponto"). | A IA reproduziu os erros no navegador e encontrou as causas: o *worker* do MapLibre não era servido pelo Vite (o mapa caía sempre no aviso de falha) e o minimapa do Ponto 360° passava um formato de dado diferente para a lista alternativa (exceção que apagava a página). Corrigiu as duas causas, redesenhou a barra lateral e o cabeçalho e criou testes de regressão. |
| "Achei que íamos entregar ele linkado com as outras matérias [...] preciso que você garanta que em todas as matérias todos os pedidos foram devidamente atendidos." | A IA leu os repositórios das outras disciplinas, mostrou que este README contradizia os demais (equipe, FIWARE, pontos P001 a P003), alinhou a documentação e importou no Supabase as leituras do ESP32 que passaram pelo FIWARE, mais uma série pública do Open-Meteo, sempre rotuladas como `simulation`. |
| Conferir o projeto contra os PDFs do enunciado da GS. | A IA extraiu os requisitos de Front-end Design e Web Development, comparou item a item com o código e apontou o que faltava (Ficha da CitizenTech e ODS no README, este AI.md nas cinco partes, `prompts.md`, deploy e ZIP). |
| "Pegue tudo o que está nesta organização do GitHub e bata contra o PDF da Global Solution [...] se atentar para coisas que faltam." | A IA clonou os cinco repositórios da equipe, instalou e testou cada parte do zero e listou o que faltava por disciplina. Nesta parte, apontou a falta do deploy e do acesso dos professores e sugeriu explicar a autoria dos commits e resumir este documento. |

## 3. Aplicação no projeto

Desenvolvido ou modificado com auxílio da IA, sempre com revisão do integrante:

- **Estrutura e camadas:** projeto Vite, organização `pages/`, `components/`, `hooks/`, `services/` e `utils/`.
- **Componentes:** biblioteca de interface em `web/src/components/ui/` (botões, cartões, selos, abas, popovers, painéis, campos de busca), layout (barra lateral, cabeçalho inteligente, menu móvel) e telas (Visão geral, Explorar com mapa, Ponto 360°, Histórico, Laboratório, área administrativa).
- **Hooks próprios:** `useStops`, `useAdminStops`, `useLatestReadings`, `useReadingsHistory`, `useStopFilters`, `useFavoriteStops`, `useHeadroom` e outros em `web/src/hooks/`.
- **Integração com API:** cliente Supabase e CRUD de pontos (`web/src/services/stopsApi.js`), modo demonstração com a mesma interface (`mockReadingsApi.js`), migrações e políticas de segurança (RLS) em `supabase/`.
- **Regras puras com testes:** formatação, conectividade, filtros, estatísticas, CSV, geometria do mapa (`web/src/utils/*.js` e `*.test.js`).
- **Testes:** testes unitários com `node:test` e testes em navegador real (Playwright) em `web/e2e/`.

## 4. Validação das respostas

Nada gerado pela IA foi aceito sem verificação:

- **Ferramentas automáticas a cada mudança:** `npm run lint` (Oxlint), `npm run build`, testes unitários (`node --test`, mais de 500) e testes em navegador real (Playwright, mais de 300 cenários no Chromium) cobrindo navegação, mapa, Ponto 360°, filtros, CRUD, teclado, acessibilidade (axe-core), temas claro e escuro e larguras de 375, 768 e 1366 px.
- **Reprodução antes de corrigir:** os defeitos foram reproduzidos no navegador (erros de console, requisições que falhavam, capturas de tela) antes de qualquer correção, e cada correção ganhou um teste que falharia se o erro voltasse.
- **Revisão humana:** o integrante abriu a aplicação, conferiu as telas e reprovou entregas que tinham testes verdes mas interface com defeito (sobreposição da barra lateral, mapa e tela preta).
- **Revisão cruzada:** o ChatGPT revisou as entregas de cada etapa e pediu ajustes de segurança (por exemplo, nenhuma chave secreta no front-end e permissões garantidas pelo banco).
- **Banco de dados:** testes de permissões (RLS) no Supabase local e validação do CRUD com contas de teste, sem alterar os pontos de demonstração.

## 5. Análise crítica

- **Benefícios:** acelerou muito tarefas repetitivas (componentes, testes, documentação) e ajudou a diagnosticar erros difíceis, como o *worker* do mapa que não era copiado pelo empacotador.
- **Limitações:** a IA chegou a declarar etapas como prontas com testes escritos mas nunca executados, e alguns testes tinham expectativas erradas; o mapa e a página do ponto passaram por uma rodada inteira com defeitos que só apareceram ao usar a aplicação de verdade. Testes "verdes" não substituem abrir o sistema e usar.
- **Dificuldades:** manter a IA dentro do escopo de cada etapa, evitar bibliotecas desnecessárias e conferir que os números de testes citados nos documentos eram reais.
- **Aprendizado:** a IA funciona melhor como copiloto: o grupo define o problema, pede evidência (comando executado, captura de tela, teste) e decide. Toda linha precisa ser entendida por quem entrega.

## Autoria dos commits

Nos 200 commits feitos até a publicação no repositório da equipe (18/11/2026), os autores aparecem assim:

| Autor no Git | Commits | O que significa |
| --- | ---: | --- |
| Enrico Vidal | 34 | Commits com o nome do Enrico. Também foram feitos com o Claude Code (etapas 1, 2A e 2B e as correções de 18/11), na extensão do VS Code ou no terminal. |
| Harness Agent | 159 | Commits gravados automaticamente pelo Claude Code quando o Enrico o executava por uma ferramenta de automação local (chamada "harness"). Ela dividia cada etapa em tarefas, rodava lint, build e testes e gravava um commit por tarefa. |
| Harness Maintenance (Claude Code) | 6 | O mesmo, em sessões de manutenção dessa ferramenta (13/11). |
| ClimaPonto Preparacao Automatizada | 1 | Commit automático que trouxe para o repositório o contrato de design e os arquivos da marca (17/11). |

**"Harness Agent" e os outros nomes automáticos não são outras pessoas:** são o Claude Code trabalhando a pedido do Enrico. Em todos os casos, o Enrico definiu o pedido, revisou o resultado e decidiu o que entrava na `main`. Os commits posteriores, de ajustes da entrega, têm autor Enrico Vidal. Os outros integrantes da equipe trabalharam nos repositórios das suas disciplinas (Edge, Python, DPS e Total Experience).

## Linha do tempo do desenvolvimento

| Data | Etapa | O que foi feito com a IA | Como foi verificado |
| --- | --- | --- | --- |
| 09/11 | 1 — Fundação | Projeto React + Vite em `web/`, Tailwind 4, React Router, layout responsivo e páginas iniciais. | Build, lint, rotas respondendo e conferência em navegador (um contraste abaixo do mínimo WCAG AA foi corrigido). |
| 09/11 | 2A — Banco e contrato de dados | Esquema Supabase (`stops` e `readings`), restrições, permissões (RLS), contrato de dados com o sensor e revisão de segurança. | Testes de permissões em SQL num Supabase local (Docker), sem alterar o banco remoto. |
| 10/11 | 2B — Login e CRUD | Login administrativo (Supabase Auth), CRUD de pontos e migrações aplicadas no banco remoto após aprovação do integrante; preparação do deploy. | CRUD validado no banco remoto com duas contas de teste, desativadas ao final. |
| 12/11 | 3B e 3C — Dashboard, Histórico e design | Dashboard, Histórico com gráficos (Recharts), design system, tema escuro e modo demonstração com dados fictícios sinalizados. | Lint, build e testes unitários do modo de dados e do conjunto demonstrativo. |
| 13/11 | 3D — Testes em navegador | Testes automatizados com Playwright em 375, 768 e 1366 px, teclado e acessibilidade; três defeitos encontrados e corrigidos. | Chromium e Firefox: 78 cenários aprovados, 0 falhas. |
| 14/11 | Finalização, busca e filtros | Login e CRUD em memória no modo demonstração, revisão visual, busca, filtros e insights. | Chromium e Firefox: 190 aprovados, 0 falhas; 228 testes unitários. |
| 15/11 | Visual, insights e novas funções | Novo visual do Dashboard, sparklines, comparador de pontos, mapa esquemático, favoritos, alertas e busca rápida (Ctrl+K). | 368 testes unitários e testes em navegador; correções de contraste e layout apontadas pelos testes. |
| 16/11 | Navegação | Barra lateral retrátil, menu móvel, seções Análises, Relatórios e Laboratório, e testes do CRUD com um cliente Supabase falso. | 399 testes unitários e 472 cenários em navegador aprovados, 0 falhas. |
| 17/11 | Mapa real e Ponto 360° | Mapa MapLibre com agrupamento e lista acessível, filtros na URL, página `/pontos/:código` e marca própria (logo e favicon). | 500 testes unitários e testes em navegador adaptados. |
| 18/11 | Correção definitiva e integração | Correção do mapa e da tela preta do Ponto 360°, nova barra lateral e cabeçalho, README com a Ficha da CitizenTech, pontos P001 a P003 e leituras (ESP32 via FIWARE e Open-Meteo) no Supabase. | Erros reproduzidos no navegador antes de corrigir, testes de regressão, instalação do zero com 503 testes aprovados e conferência pela API pública do Supabase. |
| 18/11 | Revisão final da entrega | Conferência dos cinco repositórios da equipe contra o PDF, este documento resumido e a autoria dos commits explicada. | Instalação e testes do zero de cada parte (Web, Python e DPS). |

## Princípios adotados

- O código gerado por IA é revisado pela equipe antes de ser aprovado.
- Este registro descreve apenas ações que realmente aconteceram; nenhum prompt ou teste é inventado.
- Dados demonstrativos e simulados são identificados como tal na interface e nunca apresentados como medição real.
