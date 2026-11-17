# Matriz de conteúdo e UX por rota

Padrão adotado: título curto + uma ação primária + contexto/fonte + conteúdo principal + detalhes sob demanda.
O "antes" descreve o que havia no código; o "depois" descreve o código desta etapa. Não há capturas de tela nem medições aqui: a verificação visual cabe à etapa de testes.

## Visão geral (`/`)

| # | Antes (código) | Depois |
|---|---|---|
| 1 | Hero sem ação primária; só título, frase e atualização. | CTA "Explorar pontos" (link para `/pontos`) no hero, com foco visível e feedback de clique que respeita movimento reduzido. |
| 2 | Evolução recente, Insights e Comparação ocupavam a página inteira, em grade 8/4. | Três abas (Evolução 24 h, Insights, Comparar pontos) sob "Detalhes"; nenhuma capacidade removida. |
| 3 | Resumo com 4 KPIs (monitorados, com leituras, sem dados, demonstrativos) | Mantidos os 4 KPIs, todos derivados de `summarizeDashboard`, sem valores inventados. |
| 4 | Cartão do ponto levava só ao histórico (`/historico?ponto=`). | Link principal "Abrir ponto" para `/pontos/:codigo`; histórico vira ação secundária. Seta com microanimação desligada em movimento reduzido. |
| 5 | Filtros da lista no `StopFilterBar` compartilhado. | Sem alteração local: o componente é de outra tarefa (T7); ajustes de grupos/Popover chegam por ele. |

## Análises (`/analises`) e Histórico (`/historico`)

Mesmo arquivo (`HistoryPage`, com `view`).

| # | Antes | Depois |
|---|---|---|
| 1 | Filtros em `justify-between`, espaçados de forma irregular. | Grupo rotulado ("Ponto, origem e período") com gaps horizontal e vertical definidos. |
| 2 | Sem como voltar ao padrão de origem/período. | Botão "Limpar filtros" aparece só com filtro ativo. |
| 3 | Cabeçalho do contexto sem ligação ao ponto. | Link "Abrir ponto" para `/pontos/:codigo` no `HistoryHeader`. |
| 4 | Análises já usavam seções recolhíveis (`CollapsibleSection`). | Mantido: detalhes sob demanda sem remover perfis temporais, linha do tempo e qualidade. |
| 5 | Atalhos entre visões como links no cabeçalho. | Mantidos, preservando ponto, período e origem na URL. |

## Relatórios (`/relatorios`)

Mesmo arquivo (`HistoryPage`, `view="relatorios"`).

| # | Antes | Depois |
|---|---|---|
| 1 | Mesmos filtros desalinhados. | Mesmo grupo rotulado com gaps e "Limpar filtros". |
| 2 | Exportação de CSV e relatório imprimível em bloco sem contexto de ponto. | Contexto do ponto no `HistoryHeader` com acesso ao ponto; CSV e relatório permanecem. |
| 3 | Nota metodológica sempre visível. | Mantida (honestidade sobre a fonte dos dados). |

## Laboratório (`/laboratorio`)

`LabPage` não foi alterada: já tem título, selo de fonte, estados de erro/carregamento e aviso de que o conteúdo é simulado. O conteúdo vive em `components/stops/SensorLab`, fora do escopo desta tarefa (T7).

## Administração (`/admin/pontos`, `/admin/login`)

| # | Antes | Depois |
|---|---|---|
| 1 | "Novo ponto" ao lado dos filtros. | Ação primária no cabeçalho da página (some durante o formulário). |
| 2 | Pesquisa com `<input>` próprio de cantos pequenos. | `SearchField` (arredondado, botão limpar, Esc limpa). |
| 3 | Filtros sem agrupamento nem limpeza. | Grupo rotulado, gaps e "Limpar filtros" quando há filtro; contador "X de Y pontos" mantido. |
| 4 | Cartões estáticos. | Elevação sutil no hover via tokens (`duration-250`, `ease-out-soft`), só com `motion-safe`. |
| 5 | Confirmação de excluir/desativar. | Mantida (`ConfirmDialog`); nada do CRUD foi removido. |

## Não encontrada (`/*`)

Já seguia o padrão (título, mensagem, ação "Voltar para a Visão geral"); sem alteração.
