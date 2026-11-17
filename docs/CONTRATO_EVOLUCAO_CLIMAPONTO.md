# PROMPT MESTRE — PRÓXIMA FASE CLIMAPONTO V3

> **Documento integral a entregar ao Claude na próxima execução**. LER POR COMPLETO. Os itens 0–30 são um contrato cumulativo: bibliotecas, produto, mapa real, marca própria, Supabase, cenários hospedados, navegação inteligente, microinterações e Ponto 360°. A seção V3 esclarece que “responsividade com efeitos” se refere prioritariamente a respostas animadas ao mouse, foco, toque, clique, seleção e navegação. **Não começar nova rodada antes de confirmar último objetivo concluído e HEAD validado. Não anunciar release final sem comprovação.**

> Nota operacional: não basta passar apenas o caminho deste documento se ele estiver fora do sandbox do harness. O conteúdo integral deverá ser incorporado ao objetivo ou disponibilizado **dentro da área do projeto explicitamente autorizada**, com verificação de acesso antes de iniciar. Os arquivos de identidade visual do ZIP acompanham este contrato e também devem ser copiados para área permitida quando forem integrados. Não iniciar de um branch apenas porque se chama "mais recente".

---

# CLIMAPONTO — Contrato de Redesign e Evolução de Produto

**Contexto:** Global Solution FIAP 2026.2, aplicação existente React + Vite + Tailwind + Supabase. O objetivo é entregar o produto final, não um protótipo visual isolado. Data de preparação: 16/11/2026.

## 0. Objetivo inegociável

Transformar a interface atual em um produto geoespacial e analítico de alto nível, com UX clara, responsiva, acessível e demonstração acadêmica honesta. Há liberdade para **criar páginas, componentes e funcionalidades**, **redesenhar integralmente** as existentes e reorganizar navegação/arquitetura. **Não remover capacidades já implementadas ou substituir funcionamento real por mock.** O resultado precisa ser perceptivelmente superior, além de uma troca de ícones.

Os testes automatizados passando **não equivalem** a aprovação visual nem validam dados remotos. Usar inspeção renderizada e screenshots para decidir.

## 1. Evidência de problema da versão atual

No screenshot fornecido, a página Explorar mostra grade abstrata com marcadores MOCK-XX, não um mapa geográfico. A busca e filtros ocupam uma faixa horizontal extensa, a área em torno do gráfico/grade fica subutilizada, e não há painel contextual útil no recorte. O redesign deve resolver primeiro o núcleo de exploração e depois as demais superfícies. Essa avaliação diz respeito à imagem fornecida; inspecionar o aplicativo inteiro antes de inferir falhas de outras páginas.

## 2. Tecnologias selecionadas, com decisões e alternativas

### Fundamentais

1. **shadcn/ui** (https://ui.shadcn.com/): adotar como fundação de design system; componentes sob controle do projeto. Usar seletivamente Sidebar, Button, Sheet, Dialog, Select/Combobox, Tabs, Tooltip, Skeleton, Popover, DropdownMenu, Drawer/Vaul, Toast/Sonner, DataTable quando necessário. Inspecionar package.json, CSS e componentes atuais e evitar duplicar abstrações. **O projeto em .jsx pode usar shadcn/ui com `tsx:false`** (https://ui.shadcn.com/docs/javascript); NÃO reescrever app inteira em TypeScript.
2. **MapLibre GL JS + react-map-gl/maplibre** (https://maplibre.org/maplibre-gl-js/docs/ ; https://visgl.github.io/react-map-gl/docs): criar mapa geográfico real, estilizado, interativo, responsivo. Integrar com pontos com latitude/longitude válidas, estilo de tiles transparente e termos de uso. Implementar marcadores selecionáveis, clustering quando houver densidade, popovers/detalhes, filtro sincronizado, zoom-to-fit, estados vazios e falha de tiles. Mapa deve carregar com tiles na prévia real, não só um div vazio ou grade. Priorizar as camadas nativas de MapLibre (`heatmap`, `circle`, `symbol`, clusters), sem trazer `deck.gl` prematuramente.
3. **Fornecedor de tiles candidato: OpenFreeMap** (https://openfreemap.org/) ou provedor de tiles atual já licenciado. OpenFreeMap declara oferta pública gratuita sem chave e requer atribuição; verificar disponibilidade e termos de uso efetivos, CSP e política de rede antes da decisão final. Não expor credenciais de fornecedores comerciais.
4. **Motion for React** (https://motion.dev/docs/react): animação de entrada/saída, painéis, filtros, seleção, sidebar, drawer, feedback e transição de rotas, só onde ajuda a compreender a interface. Suportar `prefers-reduced-motion` e evitar animação excessiva.
5. **Recharts, preferencialmente via componentes Chart do shadcn/ui** (https://ui.shadcn.com/docs/components/base/chart): linhas/áreas para histórico térmico e tendências, comparativos entre pontos, escalas, tooltips, legenda, estados sem leituras. Inspecionar gráficos atuais; reutilizar bibliotecas já instaladas quando suficiente.

### Condicionais, só se houver motivo claro

- **TanStack Table** (https://tanstack.com/table) para tabelas grandes, ordenação, filtros, seleção, exportação consistente, se a tabela existente não der conta.
- **TanStack Query** (https://tanstack.com/query/v5) para dados do Supabase/API se o aplicativo ainda sofrer com carregamento, cache, erros e refetch duplicados.
- **Apache ECharts** (https://echarts.apache.org/en/) SOMENTE se gráfico específico (matrix heatmap, visualizações multivariadas) for difícil/ruim com Recharts. Não manter ECharts e Recharts para o mesmo tipo de gráfico sem justificativa.
- **deck.gl** (https://deck.gl/docs/api-reference/aggregation-layers/heatmap-layer) SOMENTE se volume de dados, análises espaciais avançadas ou camadas GPU comprovadamente exigirem algo que MapLibre nativo não faz.
- **Lucide** para ícones, **Sonner** para feedback, **Vaul/Drawer** para experiência mobile, conforme dependências existentes.

Não instalar bibliotecas somente para aumentar o número no package.json. Antes de qualquer download/npm install, verificar permissões de rede do ambiente e obter autorização conforme política do harness. Não usar CDN fora da CSP ou contornar restrições de segurança.

## 3. Experiência de produto desejada

### Explorar — prioridade máxima

- Desktop: mapa geográfico como elemento principal, ocupando parte dominante da área útil; controles discretos e acessíveis; painel lateral contextual de ponto selecionado (temperatura mais recente com carimbo de data, umidade quando disponível, estado, histórico curto, ação de favoritar e explorar análise). Painel recolhível para maximizar mapa.
- Mobile: mapa como superfície principal, busca fácil de alcançar, filtros compactos, drawer/bottom sheet para detalhes; sem overflow horizontal e com teclado e toque adequados.
- Filtros em barra compacta ou popover, claramente sincronizados com mapa e contagem; não deixar 2–3 barras de chips gigantes competindo com mapa.
- Marcadores comunicam severidade e disponibilidade com cor **e forma/ícone**, não apenas cor. Clusters para escalas grandes. Tooltip, teclado, foco visível, texto de status e legenda.
- Camadas geográficas: pontos e, opcionalmente, heatmap térmico **apenas quando há coordenadas e medições suficientes para inferência espacial responsável**. Explicitar interpolação/limitações; nunca inventar leituras nem chamar distribuição artificial de calor real.
- Na ausência de lat/lng válidas no modelo de dados: investigar fonte pública com licença, dados reais existentes ou uma migração proposta; NUNCA inventar posições dos MOCK-XX para fingir mapa real. Pode apresentar mapa-base real sem marcadores de localização desconhecida e estado explicativo; no modo demo, dados sintéticos devem ser inequivocamente rotulados.
- Tratamento de falha de rede/tiles e CSP; atribuição OpenStreetMap/provedor; não exigir token secreto no frontend.

### Visão geral / Análises

- Cards de KPIs com hierarquia forte, densidade inteligente e variação apenas quando calculável.
- Gráfico temporal de temperaturas/umidade por ponto, janela temporal selecionável, hover sincronizado, seleção de séries e comparação; não traçar linhas se faltarem dados válidos.
- Separar indicadores operacionais (online/offline/sem dados) de inferências climáticas (calor/alerta). Evitar status fictício sem origem definida.
- Vistas claras para séries vazias, dados incompletos, horário da última medição, erro e carregamento.

### Histórico, Relatórios, Laboratório e Administração

- Reformular conforme inspeção real, eliminando duplicação e rotas vazias. Exibir filtros e tabelas quando agregam valor, e experiências de configuração, dados ou evidências quando cabível.
- Preservar operações de CRUD e autorizações existentes, sem simular gravação remota ou liberar rotas admin de forma incorreta.
- Não criar novas páginas apenas por estética; criar se resolver jornada real.

### Direção visual

Produto minimalista e expressivo, com referência de qualidade de Apple, Linear e software de monitoramento profissional: tipografia editorial precisa, margens consistentes, superfícies equilibradas, camadas de profundidade discretas, temas claro/escuro, estados interativos, iconografia coerente e movimento com propósito. Nada de glow excessivo, gradientes onipresentes, centenas de cards, marketing landing-page dentro do app ou 'dashboard genérico'. Melhorar responsividade em 375, 768 e 1366 px.

## 4. Fluxo de execução — não repetir execução superficial

1. INVENTARIAR ANTES DE MUDAR: listar páginas, componentes existentes, package.json, limites do schema de geolocalização, fonte real/demo dos dados, histórico e testes. Estabelecer o que pode ser preservado e o que precisa evoluir.
2. PROPOSTA VISUAL VERIFICÁVEL: especificar hierarquia de Explorar no desktop/mobile e demais telas, quais recursos serão realocados, quais novos componentes terão comportamento real. Priorizar objetivos por impacto; não reduzir contrato de forma silenciosa devido a orçamento. Se inviável, bloquear e informar a restrição explicitamente.
3. IMPLEMENTAR DE VERDADE: mapa com base geográfica, interações reais, painel de detalhes, filtros, mobile. Depois evoluir visão geral/analytics com gráficos e shadcn, preservando funcionalidades. Em tarefas grandes, realizar commits locais incrementais; não push, merge, deploy, alterações remotas ou bypass de permissões.
4. ABRIR NO NAVEGADOR: verificar Playwright renderizado após alterações; screenshots desktop 1366, tablet 768, celular 375 nos temas escuro e claro; analisar alinhamentos e erros e corrigir. Confrontar screenshots do antes e do depois, não aceitar texto 'ficou melhor' sem evidência. Se automação de screenshots estiver proibida, registrar o bloqueio em vez de afirmar sucesso.
5. GATES: lint, build, unitários e E2E Chromium/Firefox, responsividade, teclado e acessibilidade, contrastes, `prefers-reduced-motion`, CSP, comportamento offline, CRUD, RLS e fronteira de permissões. Não alterar testes para mascarar falhas.
6. ARTEFATOS: documentação dos componentes adotados e motivo; matriz FIAP atualizada, README/AI.md, screenshots referenciadas, relatório com HEAD e números reais, ZIP limpo e verificado com SHA256. Validar conteúdo do ZIP. Não afirmar produção pronta sem URL de deploy e validação de integração real.

## 5. Critérios objetivos de aceite

- [ ] Página Explorar mostra **mapa-base geográfico verdadeiro**, navegável, com estilos e atribuição válidos; nenhuma grade abstrata com pontos colocados arbitrariamente como substituto.
- [ ] Marcadores refletem **coordenadas válidas** e dados rotulados; ao selecionar, painel contextual funcional. Dados sem geolocalização não têm posição inventada.
- [ ] Filtros modificam de verdade contagem, lista, marcadores e detalhes; favoritos persistem conforme implementação existente.
- [ ] Desktop usa área disponível com painel contextual; mobile inclui drawer/painel adequado e funciona a 375px, sem overflow.
- [ ] shadcn/ui está incorporado em **componentes reais e usados**, não só dependência instalada; estilos consistentes; se incompatível, justificação técnica documentada e alternativa equivalente.
- [ ] Gráficos reais, legíveis e responsivos com estados sem dados e sem linhas/valores inventados.
- [ ] Motion aplicado a transições com propósito e respeita redução de movimento; sem animações que prejudiquem usabilidade.
- [ ] Ações, formulários e CRUD preservados; backend remoto não é mascarado por mocks. Falhas são visíveis e recuperáveis.
- [ ] Capturas e evidências de cada mudança substancial, desktop/mobile/dark/light, com análise e correções documentadas.
- [ ] Gates de CI/testes/revisões sem regressão nem teste silenciado; auditoria FIAP e pacote de entrega coerentes com HEAD atual.

## 6. Segurança, autonomia e autorização

Autonomia alta para redesenhar, refatorar, criar e reorganizar. Sem exclusão não justificada de funcionalidades; sem alteração de credenciais, rede, Supabase remoto, GitHub remoto, Vercel, política do harness, limites ou bypass de revisão. Instalação de novos pacotes depende de acesso de rede permitido e aprovação conforme regras. Preservar separação demo/produção; não criar dados meteorológicos, geográficos ou projeções como fatos. Qualquer dependência humana vai para BLOCKERS.md, com passos precisos e sem afirmar que o projeto já foi submetido.

## 7. Documentação de referência verificada (consulta pública)

- https://ui.shadcn.com/docs/installation/vite
- https://ui.shadcn.com/docs/javascript
- https://ui.shadcn.com/docs/components/base/sidebar
- https://ui.shadcn.com/docs/components/base/chart
- https://ui.shadcn.com/docs/components/base/data-table
- https://maplibre.org/maplibre-gl-js/docs/examples/
- https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/
- https://maplibre.org/maplibre-gl-js/docs/examples/create-a-heatmap-layer/
- https://visgl.github.io/react-map-gl/docs
- https://openfreemap.org/
- https://motion.dev/docs/react
- https://motion.dev/docs/react-use-reduced-motion
- https://tanstack.com/query/v5
- https://echarts.apache.org/en/
- https://deck.gl/docs/api-reference/aggregation-layers/heatmap-layer

**Nota:** O texto especifica o trabalho desejado, não atesta que qualquer alteração de código tenha sido aplicada. A branch/harness deve ser inspecionada para identificar o último HEAD validado antes de iniciar nova execução.

---

# EXPANSÃO MESTRE — ClimaPonto: produto completo, identidade e experiência real

**Esta expansão é parte vinculante do contrato de redesign acima.** Consolida pesquisa adicional de produto, tecnologia, informação geográfica, experiência, branding, engenharia, demonstração e critérios de entrega. Foi preparada em 16/11/2026 para **A PRÓXIMA execução, SOMENTE após a rodada atual encerrar e seu HEAD ser revisado**. Não é uma declaração de que qualquer item abaixo já esteja implementado.

## 8. Norte do produto, não apenas direção visual

### 8.1 Missão e diferenciação

ClimaPonto deve ser reconhecível como plataforma de **inteligência climática urbana orientada aos pontos de ônibus e à experiência do cidadão**, não como template de dashboard genérico. Seus três objetivos conectados são:

1. **Entender:** localizar pontos reais, ler o que sabemos sobre condições térmicas, distinguir medição/estimativa/simulação, descobrir histórico e qualidade da informação.
2. **Comparar e decidir:** comparar períodos e localidades, priorizar investigação e comunicar risco ou falta de evidência sem extrapolação científica.
3. **Operar e demonstrar:** acompanhar integridade de dados, administrar pontos com segurança, verificar integração e contar história convincente ao professor, com estado real hospedado e reproduzível.

Não confundir escopo acadêmico com promessa de solução de saúde pública validada. Não declarar temperaturas de paradas específicas com precisão que a fonte não possui. Todo score, indicador ou alerta deve declarar sua metodologia e suas limitações.

### 8.2 Princípios de qualidade

- **Produto-first, evidência-first.** Cada nova dependência precisa atender uma necessidade concreta. Cada tela precisa servir uma jornada real.
- **Design editorial, não decoração.** Densidade informacional equilibrada; texto preciso, respiro, contraste e affordances. Nada de excesso de glassmorphism, brilhos, emojis, animações aleatórias, 3D gratuito ou dezenas de cards.
- **O mapa não é a verdade sozinho.** Sempre oferecer visão em lista/tabela, detalhes textuais e informação de fonte/atualização.
- **Honestidade de origem.** Campo de origem explícito e visível: `sensor_observado`, `fonte_publica_observada`, `modelo_meteorologico`, `cenario_demonstrativo` ou `ausente`. Não igualar previsão de modelo a leitura de sensor.
- **Prioridade para o deploy real.** O que só funciona no mock ou na máquina do dev não satisfaz o aceite do professor.
- **Autonomia ampla, governança rigorosa.** A equipe de agentes pode redesenhar/refatorar/criar novas funcionalidades; não pode omitir silenciosamente grandes exigências por custo ou falta de tempo, nem declarar entrega concluída quando houver bloqueios.

## 9. Arquitetura de informação e jornadas redesenhadas

Avaliar a navegação atual antes de implementar; os nomes abaixo são hipóteses de produto, não necessidade de sete links idênticos na sidebar. O autor do redesign pode agrupar, combinar ou renomear se houver melhoria demonstrável, sem perder recursos.

### 9.1 Dois contextos de uso

- **Cidadão/visitante:** mapa, busca de pontos, condições disponíveis, histórico legível, comparações, favoritos locais, explicação de fontes e limitações, acessibilidade mobile.
- **Operador/administrador:** monitor de qualidade/integridade, painel de fontes e sincronização, CRUD protegido, trilha de auditoria, documentos/relatórios e cenário de demonstração restrito.

Roles não devem ser fingidos por estado frontend: aplicar permissões no backend com RLS/grants e testar negativo. Não expor administração/credenciais só porque a interface o esconde.

### 9.2 Estrutura navegável proposta

- **Visão geral:** manchete situacional e KPIs contextualizados (quantos pontos no catálogo, quantos com leitura recente, quantos sem dados, atualizado em...), favoritos e atalhos. Uma ideia principal acima da dobra, sem 15 cards redundantes.
- **Explorar mapa:** mapa verdadeiro, camadas e detalhes, lista sincronizada, filtros práticos, geolocalização opcional autorizada pelo navegador, busca, comparação e favorito.
- **Análises:** tendências temporais com brush e eixos, cruzamento de fontes, comparação A/B por mesmo período/unidade, exportação de dados filtrados, metodologia visível.
- **Histórico:** tabela temporal rica, filtros e paginação, detalhe auditável da leitura, tratamento de fuso/intervalo, estados sem leitura.
- **Laboratório:** hipóteses e cenários comparáveis, visualização de limite e fonte; nunca usar uma hipótese sintética para alimentar KPIs reais.
- **Relatórios:** relatórios com resumo, dados, método, referências, data de geração, PDF via impressão CSS e CSV seguro; se não houver dados para um relatório, explicar por quê.
- **Gestão:** CRUD, autenticação, papéis, monitor de integração, qualidade, eventos e guias de recuperação quando houver falha. Disponível apenas a autorizados.
- **Sobre os dados:** página contextual/discoverable com fontes, licença, última atualização, cobertura, definição de alertas, limites e distinção entre observação e modelo.

### 9.3 Microjornadas obrigatórias

1. Buscar um ponto pelo código/nome/bairro -> vê exatamente um resultado -> centraliza no mapa -> abre painel -> consulta histórico -> compara com outro ponto.
2. Aplicar filtros combinados no mapa -> contagem, lista, marcadores e URL ou estado compartilhável permanecem sincronizados -> limpar filtro restaura resultado sem reload brusco.
3. Alternar período no gráfico -> dados e números do KPI atualizam de forma coerente e conservam unidades/atualização.
4. Usuário admin cria, edita, ativa e desativa ponto no **Supabase real** sob RLS; visitante vê o resultado autorizado; exclusão/arquivamento exige confirmação e possibilidade de recuperação quando suportado.
5. Usuário encontra ponto sem medições -> vê informação pública da parada, disponibilidade, explicação e orientação; nunca um gráfico falso.
6. Operador percebe leitura antiga -> vê a idade do dado e possível causa, sem o sistema afirmar que a cidade está mais fria ou quente do que foi medido.
7. Usuário no celular faz a mesma tarefa sem abrir menus aninhados ou perder contexto.

## 10. Mapa de verdade e geointeligência útil

### 10.1 Mapa e localização

- **Base MapLibre GL JS** com estilo profissional claro/escuro, controle de zoom, bússola, reset de vista, navegação por teclado e atribuição. Usar `react-map-gl/maplibre` se realmente facilitar a integração.
- Centro inicial e limites calculados das coordenadas reais carregadas, com fallback geográfico explícito para São Paulo, **não coordenadas arbitrárias para cada MOCK**.
- Camada de pontos com marcador **próprio ClimaPonto** e variação visual de estado, tooltip ao hover/foco, popup ou drawer e feedback de seleção.
- Agrupamento (cluster) com contagens verdadeiras, seleção de cluster que faz zoom, legenda simples, opção de mostrar somente favoritos e lista alternativa com navegação por teclado.
- Busca por nome, bairro e código; filtros de fonte/status/recência, com contagens verdadeiras.
- Mapa ocupa espaço útil de verdade; filtros em popover/barra compacta, painel de contexto recolhível; **bottom sheet mobile** acessível com ação de fechar e posição preservada.
- Camadas opcionais com significado: base das paradas reais, estado de disponibilidade, estimativa meteorológica regional com label distinto, limites territoriais públicos, camadas de árvores/sombra apenas se dados confiáveis forem autorizados e licenciados.
- Seleção de intervalo temporal sincroniza marcadores/visão apenas quando há séries temporais válidas. **Nada de heatmap interpolado a partir de 2–8 pontos e apresentado como temperatura da cidade.**
- Comparação geográfica com slider antes/depois **somente para séries comparáveis de mesma natureza**; plugin candidato `@maplibre/maplibre-gl-compare`.
- Desenho de raio/área para filtrar pontos por região, via **Turf.js** (e `terra-draw` somente se houver jornada concreta); cálculo da distância em linha reta explícito, não chamar de rota caminhável.
- Se houver muitos pontos e estudos de densidade, investigar **H3 hexágonos** para cobertura/coleta, não para fabricar calor. Não adotar H3 antes de ter dado suficiente.
- Tratamento completo de WebGL não suportado, falha de tiles, rede lenta, fornecedor indisponível e fallback de lista — nunca tela vazia. Monitorar peso e uso de provedores. Limites/licença/atribuição confirmados.

### 10.2 Origem de dados geográficos reais — candidatos pesquisados

- **GeoSampa**, dados geográficos oficiais da Prefeitura de São Paulo: https://novogeosampa.prefeitura.sp.gov.br/ . Investigar camadas publicadas e termos antes de selecionar arborização, equipamentos, área verde ou paradas.
- **ARTESP GTFS**, conjunto público com paradas/rotas metropolitanas e arquivo `stops.txt`, atualizado no portal: https://dadosabertos.artesp.sp.gov.br/dataset/gtfs . Selecionar pontos dentro da região coberta e validar integridade e licença; o fato de ser metropolitano não prova que representa todas as paradas da SPTrans municipal.
- **Overture Maps**, classifica paradas no conjunto `base/infrastructure` subtipo transit, classe `bus_stop`, não no dataset de `places`: https://docs.overturemaps.org/guides/base/infrastructure/ . Avaliar licença ODbL quando derivado de OSM e cobertura real para SP. Opção alternativa à base municipal/metropolitana.
- **Turf.js**, cálculos espaciais client-side: https://turfjs.org/docs/getting-started . Atenção a ordem GeoJSON: **[longitude, latitude]**.
- **Supabase PostGIS**, opcional se busca espacial por milhares de registros justificar índice e consultas por raio: https://supabase.com/docs/guides/database/extensions/postgis . Não migrar schema sensível sem revisão e autorização.

**Condição de aceite:** ponto real do cadastro mostra coordenada rastreável à base identificada. Se catálogo atual tiver registros MOCK sem lat/lng, não atribuir coordenadas inventadas. Registros sintéticos de cenário serão separados e marcados como sintéticos.

## 11. Camada climática e inteligência interpretável

### 11.1 Fontes possíveis e limitação importante

- Dados existentes de sensores do projeto, se realmente persistidos e assinados pela aplicação; conservar `device_id`, timestamp, unidade, fonte e estado de leitura.
- **Open-Meteo**, API gratuita para uso não comercial com atribuição, fornece previsão e dados históricos de reanálise: https://open-meteo.com/ e https://open-meteo.com/en/docs/historical-weather-api . É **modelo/grade meteorológica** e não mede a temperatura sob o abrigo de cada parada; nunca dar falsa precisão de microclima.
- Outras fontes públicas meteorológicas a verificar em investigação específica (INMET/centros oficiais), somente após conferir disponibilidade, formato, atualidade, termos e cobertura; não prometer integração não examinada.
- Leitura externa deverá ser capturada com data `observed_at`, `fetched_at`, `source`, `source_type`, unidade, precisão/granularidade e política de expiração. Não usar `Date.now()` para falsificar a hora de observação.
- Uma fonte meteorológica regional pode **contextualizar** um ponto de parada, mas não provar que duas paradas próximas têm condições diferentes.

### 11.2 Funcionalidades analíticas propostas

- **Linha do tempo interativa** com períodos 24h/7d/30d ou intervalos disponíveis, brush, tooltips que mostram unidade/horário/fonte, zoom e legendas acessíveis.
- **Comparador de pontos A/B** com mesmo intervalo/fonte/variável; variação real, sem tratar registros incompletos como 0; possibilidade de visualizar lado a lado no mapa.
- **Radar de integridade:** cobertura temporal, percentual de amostras válidas, idade do último valor, fontes indisponíveis, flags de anomalia e lacunas explícitas; sem números fabricados para preencher o vazio.
- **Narrativas automáticas determinísticas**, baseadas em cálculos documentados, por exemplo: “A estação X registrou valores entre A e B no período disponível”. Nunca texto que extrapole (“o bairro todo está mais quente”) sem suporte.
- **Mapa temporal** ou animação de evolução somente quando a densidade dos dados legitimar comparação e interpolação; caso contrário manter seleção temporal nos pontos existentes.
- **Análise de cobertura geográfica**, diferenças de quantidade de pontos com dados por bairro/área, e não “mapa de calor urbano” se não houver densidade térmica.
- **Eventos e alertas** com estado, severidade, hora, fonte, método e histórico; limiares documentados, e gestão protegida. Evitar alarmismo e aconselhamento médico individual.
- **Exportações CSV** sanitizadas contra fórmula em planilhas; relatório imprimível/PDF com fonte, intervalo, quantidade, método, unidades, carimbo de geração, limites e créditos.
- **Resumo de localidade** que se adapta a realmente disponível: dados de parada / temperatura regional de modelo / dados de sensor / nenhuma leitura. Não repetir métricas irrelevantes.
- **Visão de confiabilidade e proveniência** com legenda 'Observado', 'Estimado/modelado', 'Demonstrativo' e 'Indisponível'. Esse recurso é um diferencial de qualidade do ClimaPonto.
- **Comparação de cenários de mitigação** (ex.: sombreamento) SOMENTE no Laboratório com parâmetros explicitamente hipotéticos, sem apresentar cálculo simples como previsão de temperatura validada.
- **Priorização explicável**: se existir score, escrever fórmula, pesos, fontes, confiança e limitações; não chamar sugestão de política pública comprovada.
- **Heat Index** somente se fonte, fórmula, condições de aplicação, umidade e contexto justificarem; nota sobre limitações (índice para sombra/vento fraco, não equivalente a exposição direta ao sol): https://www.weather.gov/ . Sem promessas de risco individual clínico.

## 12. Cenários REALMENTE APRESENTÁVEIS no deployment final

O pedido do usuário exige **cenários que funcionem no mesmo ambiente que o professor abrirá, não mockup estático nem screenshots inventadas**. Há duas modalidades distintas:

**A. Operação com dados reais (sempre preferida)**
- App hospedado, React real, Supabase real, autenticação e RLS real, CRUD real, mapa real e pontos com coordenadas de fonte rastreável.
- Se não houver sensor em produção, deixar explícita a ausência de leitura; meteorologia de modelo externo aparece como contexto regional, nunca leitura IoT do ponto.

**B. Cenários didáticos demonstrativos (quando um evento raro não ocorrer naturalmente)**
- Usar a **mesma aplicação e banco hospedados**, em dataset/tenant `demo` protegido, com registros reais de cadastro ou eventos **explicitamente sintéticos** que levem à visualização de alerta, falta de dados etc.
- Um seletor claro `Dados observados` | `Cenários demonstrativos`, com distintivo permanente e legenda na URL/relatórios. Não injetar registros de cenário em agregados reais. Fonte e origem explícitas. Não criar alertas públicos de emergência reais a partir de dados hipotéticos.
- Se não for possível isolar com RLS/tenant/dataset, criar a experiência demonstrativa **sem persistir leituras sintéticas na base real**: interação simulada nomeada, ligada a um conjunto explícito e inteiramente separado, mas o produto e suas demais funcionalidades continuam operando no deployment real. Não trocar silenciosamente a app inteira por mock.

### Catálogo de demonstração com passos reproduzíveis

| ID | Cenário no site final | Evidência/ação que o professor deve conseguir executar | Fonte válida |
|---|---|---|---|
| S01 | Explorar uma parada existente | Busca -> mapa -> detalhe -> localização comprovável | GTFS/GeoSampa/Outros, licença checada |
| S02 | Acompanhamento de condição disponível | Valor com unidade, fonte e data; modelo rotulado se for o caso | Sensor real ou API externa permitida |
| S03 | Leitura antiga | Aviso de idade da última atualização, sem dizer 'ao vivo' | Timestamp real ou cenário demo marcado |
| S04 | Sem medições | Empty state claro, sem linha ou KPI fictício | Ausência real no Supabase |
| S05 | Ponto inativo/offline | Status calculado com regra conhecida; trajetória de auditoria se existe | Evento real ou demo isolada |
| S06 | Alerta térmico | Estado, limite e fonte; se sintético, aviso permanente | Dados observados válidos ou cenário etiquetado |
| S07 | Comparar dois pontos | Gráficos e séries iguais e diferenças calculadas, ou estado 'não comparável' | Séries efetivas com unidade consistente |
| S08 | Filtros combinados | Bairro + fonte + status + período afetam lista, mapa e métricas | Banco e UI real |
| S09 | Favoritos e navegação | Favoritar, navegar, retornar, favorito persistido conforme regra | Browser/local ou usuário autenticado, indicado |
| S10 | Exportar evidência | CSV/relatório gerado conforme filtros com carimbo e fontes | Dados realmente consultados |
| S11 | CRUD administrativo | Criar/editar/desativar/excluir um registro próprio para teste | Supabase remoto com role admin |
| S12 | RBAC negativo | Visitante não altera cadastro; acesso não autorizado é bloqueado no backend | RLS/grants testados |
| S13 | Falha da fonte externa | Estado de indisponibilidade + retry + timestamp de cache, sem silent fallback | Modo de teste controlado ou falha reproduzível sem prejudicar serviço |
| S14 | Dispositivo móvel | Mesma jornada em 375px com drawer, teclado e mapa | URL de produção |
| S15 | Acessibilidade | Navegação por teclado/ARIA, alto contraste e reduced motion | Interface real |
| S16 | História CitizenTech | Página ou roteiro 'problema -> evidência -> decisão', links para fontes | Aplicativo real |

**Requisitos do catálogo:** `docs/CENARIOS-DEMONSTRACAO.md` com URL, login de papel sem expor senha, passos, dados/fonte, reset, critérios do que observar, distinção real/demonstração, capturas de evidência, limitações e responsável. S01–S16 são alvos, nunca rotular 'concluído' sem teste fim a fim no deployment. O professor não deve depender de um developer acionando comando local para cada cenário. Se a conta admin não puder ser pública, entregar roteiro seguro de apresentação sem compartilhar credenciais.

### Decisão de governança dos dados de demonstração

Antes de criar datasets/roles/jobs/contas no Supabase remoto, apresentar **plano de migrations + seed + rollback + custos + segurança** e obter autorização explícita. Nada de writes remotos, `service_role` exposto, cadastramento público liberado ou dados sintéticos anônimos misturados ao catálogo real. O professor pode visitar a URL pública de leitura sem virar administrador.

## 13. Identidade visual e marca própria — OBRIGATÓRIO

### 13.1 Conceito aprovado para avaliação visual

A marca proposta não usa ônibus ou termômetro emoji. É um **pin/cartografia formando letra C**, com **onda térmica âmbar** e **três barras de dados em ciano**, sinalizando lugar + calor urbano + observabilidade. Wordmark “ClimaPonto”, com 'Clima' em navy no tema claro (claro no tema escuro) e 'Ponto' em teal. Direção: tecnológica, cidadã, confiável e memorável, sem estética infantil.

**Arquivos disponibilizados separadamente no pacote `CLIMAPONTO_IDENTIDADE_VISUAL_V1.zip`:**

- `climaponto-brand/climaponto-logo-light.png` — logo horizontal claro.
- `climaponto-brand/climaponto-logo-dark.png` — logo horizontal para tema escuro.
- `climaponto-brand/climaponto-mark-transparent.png` — marca símbolo isolada.
- `climaponto-brand/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `favicon-64x64.png`.
- `climaponto-brand/apple-touch-icon.png`, `pwa-192x192.png`, `pwa-512x512.png`.
- `climaponto-brand/climaponto-og-image.png` — apresentação ao compartilhar link.
- `climaponto-brand/fonte-gerada-logo.png` — imagem original criada.
- `climaponto-brand/README-MARCA.md` — instruções, ressalvas de legibilidade em tamanhos pequenos.

**A versão final pode lapidar a marca** após ver em produção, mas deverá manter o conceito distintivo e apresentar proposta final consistente, não voltar a usar um emoji. Se o ícone pequeno não for legível, gerar variante simplificada do símbolo para 16/32px. O PNG original é raster; SVG pode ser redesenhado manualmente se necessário, sem fingir que uma conversão bitmap é vetor original.

### 13.2 Aplicações, não apenas gerar arquivo

- Wordmark no desktop e símbolo adaptado na sidebar recolhida, mobile header e loading skeleton; alt text correto e contraste adequado.
- Favicon do navegador (incluindo tabs pequenas), bookmark, `apple-touch-icon`, ícones PWA quando houver PWA, `theme-color` e Open Graph/social image. Verificar o resultado real no Chrome e Firefox e nas duas cores de tema.
- Design tokens únicos: navy quase preto, superfícies em camadas, teal/ciano para dados disponíveis, âmbar para atenção térmica, coral/vermelho somente para indicadores de severidade fundamentados. Cores não bastam sem texto/forma.
- Tipografia de sistema ou fonte web licenciada e com carregamento confiável; hierarquia consistente de headings/tamanho/altura de linha. Não introduzir font files sem revisão de licença nem comprometer LCP.
- Componentes de marca: marcador no mapa, badge de proveniência, empty states ilustrados de maneira discreta, favicons, ícones de estados e template do relatório.
- Tela de apresentação/landing opcional SOMENTE se não criar barreira ao app; priorizar uso real e acesso imediato ao produto.

### 13.3 Identidade ética e polimento

- Criar um pequeno `docs/BRAND-GUIDE.md` com paleta/tokens, variações, exemplos de bom/mau uso e acessibilidade.
- Não usar emojis como ícones definitivos da UI; usar sistema coerente (Lucide ou conjunto já existente).
- Não copiar logotipos de aplicativos conhecidos, layouts proprietários ou conteúdos sem licença.

## 14. Biblioteca, design system e novas escolhas investigadas

### 14.1 Adotar efetivamente quando agregam valor

| Tecnologia | Decisão | Uso comprovável |
|---|---|---|
| `shadcn/ui` + base de primitives | Obrigatório salvo impedimento técnico documentado | Sidebar, dialog, drawer, popover, tooltip, tabs, forms, skeleton, table |
| `MapLibre GL JS` + `react-map-gl/maplibre` | Obrigatório no mapa real | Tiles/atribuição, clusters, markers/camadas e painel sincronizado |
| `Motion` (`motion/react`) | Alta | Animações responsivas com reduced motion e sem prejudicar performance |
| `Recharts` via shadcn Charts, se adequado | Alta | Séries de tempo, legendas, tooltips, comparador com brush |
| `React Hook Form` + `Zod` | Alta para forms admin complexos, se atual falhar | CRUD com validação e erros acessíveis |
| `TanStack Query` | Adotar se cache/refetch/erros trouxerem ganho concreto | Supabase/API remotos com invalidação de cache após CRUD |
| `TanStack Table` | Condicional | Histórico/admin com filtros/ordenação/paginação server-side |
| `Turf.js` módulos específicos | Condicional | Distância, raio, polígono e interseção geográfica; documentação do cálculo |
| `PostGIS` | Condicional | Consultas geoespaciais indexadas se escala justificar |
| `H3` | Experimental com dado real suficiente | Agregação de cobertura espacial, não falsa meteorologia |
| `maplibre-gl-compare` | Condicional | Swipe temporal para dados geograficamente comparáveis |
| `vite-plugin-pwa` | Condicional | App instalável/caching offline **seguro**, com design de cache controlado |
| `Lucide` e `Sonner` | Coerência | Ícones e feedback acessíveis, sem dependência duplicada |

Evitar instalar `GSAP`, `React Three Fiber`, `Three.js`, `Lenis`, `deck.gl`, `ECharts`, várias libs de animação, ou pacotes de efeitos de marketing, salvo justificativa específica, desempenho medido e aceite. `3D` não torna um sistema de monitoramento automaticamente melhor.

**Documentação atual investigada:**
- https://ui.shadcn.com/docs/components/base/sidebar
- https://ui.shadcn.com/docs/forms/react-hook-form
- https://maplibre.org/projects/gl-js/
- https://makewithmaplibre.com/plugins/maplibre-gl-compare/
- https://recharts.github.io/en-US/api/Brush/
- https://turfjs.org/docs/getting-started
- https://h3geo.org/docs/highlights/aggregation/
- https://github.com/vite-pwa/vite-plugin-pwa

### 14.2 Qualidade da experiência de interação

- **Cmd/Ctrl+K** com busca global e ações rápidas para quem usa desktop; navegação por teclado e foco visível. Se já existir comando equivalente, aperfeiçoar em vez de duplicar.
- **Skeletons** representando a estrutura real durante carregamento; transições curtas em filtros e seleção; toast com ação/reversão quando seguro.
- **Empty states contextuais:** nenhum ponto no filtro, sem coordenadas, sem medição, fonte indisponível, permissão negada, sem conexão e primeira visita são situações distintas.
- **Persistência inteligente:** filtros/período/tema podem ser mantidos na URL ou armazenamento apropriado; não guardar credenciais/sessões inseguras.
- **Onboarding leve** 'entenda em 30 segundos' ou walkthrough de 3 passos descartável; sem popups incessantes.
- **Feedback de dados atualizados** e carimbo de atualização estável; nunca animação de “ao vivo” quando não há ingestão real.
- **Atalhos do teclado** com ajuda visível, não sequestrar teclas quando há formulário em foco.
- **Mobile-first genuíno:** padrões de toque, botões com alvo suficiente, bottom sheet sem engolir mapa, filtros popover, contraste em telas claras, sem overflow.

## 15. Plataforma real, pipeline e observabilidade

### 15.1 Integração em produção

1. Frontend React/Vite servido por **deploy público real**, ambiente configurado, CSP atualizada para domínios dos tiles e da API, sem dependência de localhost.
2. Supabase real com modelos/migrações, leitura e CRUD testados com permissões efetivas; RLS e grants por papel, desativar signup se não desejado, sem secrets no client.
3. Ingestão externa: **preferir processamento backend protegido** (Supabase Edge Function com cron e Vault/secret server-side) se houver gravação; cache com limites/rate-limit e trilha da fonte. Open-Meteo pode ser fetch read-only direto apenas se CORS/licença/limites/CSP permitirem e o resultado tiver proveniência.
4. Atualização de dados via `TanStack Query` ou estratégia atual; Realtime somente se houver eventos reais que justifiquem assinatura e se limites RLS/escala comportarem.
5. Painel interno **Saúde dos dados**: status última sincronização, contagem de registros com localização, amostras recentes, registros rejeitados, erros de origem, última execução e indicador do modo do dataset, sem expor logs com informações privadas.
6. Não cadastrar fake 'sensores online'. Se não houver sensores físicos ativos, a aplicação pode informar 'Integração IoT demonstrada em contexto acadêmico; sem ingestão contínua no momento'.

### 15.2 Segurança, custos e recuperação

- Todo write remoto depende de permissão do usuário; scripts devem ser idempotentes, revisados e com rollback; não sobrescrever dados antigos sem backup. Criar contas e cenários com privilégios mínimos e descrever sua remoção.
- Nunca colocar `service_role`/secret/public password em Vite env, código, README, screenshots ou ZIP. Publishable key no browser somente com RLS/grants corretos.
- Validar políticas `anon` vs `authenticated` vs `admin`, inclusive leitura negativa e mutations recusadas. Não liberar acesso por flag de frontend.
- Sanitizar campos e CSV, evitar XSS, injeções em filtros, vazamento de email, URLs externas não confiáveis e dependências com vulnerabilidades conhecidas.
- Mapa e APIs externas podem ter indisponibilidade: timeouts, retry com limite, cache stale rotulado, fallback de lista real e mensagens de recuperação, sem trocar por fake silenciosamente.
- Logs de ingestão devem ocultar tokens, ter IDs de correlação e timestamps; monitor de erro client-side não deve enviar dados pessoais sem consentimento.
- Avaliar limites gratuitos de Open-Meteo/Supabase/tiles, rate limits e atribuição. Não assumir 'grátis ilimitado' nem contar com cupom/promo/preview.

**Fontes técnicas:**
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/functions/schedule-functions
- https://supabase.com/docs/guides/realtime/limits
- https://open-meteo.com/

## 16. Polimento, acessibilidade, velocidade e robustez

- **WCAG 2.2 AA como referência**: contraste de texto e elementos, foco visível, tamanho de alvos, navegação por teclado, descrição dos gráficos e mapa textual alternativo, não usar cor isoladamente, reduced motion. Ver https://www.w3.org/TR/wcag/ .
- Design responsivo real em 320/375/390/768/1024/1366/1440px; sem cortes, zoom do browser a 200%, landscape e touch.
- Gráficos: títulos, unidades, legenda, fonte, leitura por tooltip e tabela acessível alternativa; diferenças de cores distinguíveis em daltonismo.
- Performance medida: lazy loading de mapa/visuais pesados, divisão de bundle por rota se útil, consultas paginadas, evitar re-render integral por hover, imagens otimizadas, caching seguro. Não inventar Lighthouse 95, medir de verdade.
- Objetivos aspiracionais onde medidos no deploy: LCP até 2,5s, CLS até 0,1 e INP até 200ms em condições apropriadas; registrar hardware/rede/limitações.
- Testes Vitest/RTL/E2E/playwright em Chromium/Firefox (e WebKit quando disponível), axe, gestão de erro, offline, regressão de CRUD e respostas reais. Capture screenshots/visual regression (`toHaveScreenshot`) no mesmo ambiente para evitar flakiness e teste interação do mapa.
- Inspecionar **screenshots reais com percepção visual** em claro/escuro e três tamanhos; reprovar se nova navegação criar vazios gigantes, filtros invasivos, sobreposição de tooltip/drawer ou mapa cortado.
- Testar favicons reais no browser, estados de erro/empty, teclado e leitura. Não usar screenshots como substituto do teste funcional.
- Headers/CSP/CORS corretos para tiles e fornecedores; nunca desativar segurança para 'fazer funcionar'.

**Documentação:** https://playwright.dev/docs/test-snapshots , https://www.w3.org/TR/wcag/ .

## 17. Roteiro de demonstração do professor — narrativa de 3 a 5 minutos

Preparar também jornada curtíssima que qualquer avaliador consiga reproduzir sem terminal:

- **Abertura (20s):** marca ClimaPonto, objetivo cidadão, transparência sobre dados, data da última atualização.
- **Geografia (40s):** escolher ponto de parada real no mapa, ver sua origem/localização, estado e filtros sincronizados.
- **Evidência (50s):** abrir histórico/gráfico de temperatura efetivamente disponível ou demonstrar honestamente ausência de sensor, separar o contexto meteorológico da leitura de rua.
- **Comparação e relatório (50s):** comparar pontos com dados válidos, exportar CSV/relatório, ler legenda/método.
- **Cenários (40s):** trocar claramente para 'cenário demonstrativo', apresentar estado de alerta/atraso/sem dados sem fingir evento real.
- **Gestão segura (40s):** exibir autenticação e um CRUD controlado no backend com usuário autorizado; visitante não consegue editar.
- **Fechamento (20s):** qual problema o produto ajuda a observar, quais limitações restam, e uma visão de evolução sem promessas vagas.

**Esses tempos são sugestão de roteiro, não limite obrigatório de pitch acadêmico.** Ajustar conforme tempo oficial de cada disciplina e não usar esta sequência para contrariar exigências da FIAP.

## 18. Artefatos de entrega, aceite e rigor de evidências

### 18.1 Entregáveis concretos esperados da próxima execução

- Aplicativo React/Vite revisado, testado e integrado em branch nova desde o HEAD aprovado do objetivo atual.
- Assets de branding incorporados e visíveis, favicon navegável, ícone de aplicativo, OG social e design tokens documentados.
- MapLibre operacional com dados geográficos de origem rastreável; se indisponível, blocker claro, não fantasiar mapa de verdade.
- Seção de análises e comparação realmente utilizável quando dados disponíveis; lidar com lacunas sem simular números.
- Catálogo de cenários acessível no deploy e documentado; cenários observados vs demonstrativos claramente separados.
- CRUD real, RLS e integração com API externa comprovados em sandbox e, após autorização, em Supabase remoto com evidências e rollback seguro.
- Documentos em `docs/`: `ARQUITETURA.md`, `FONTES-E-METODOLOGIA.md`, `CENARIOS-DEMONSTRACAO.md`, `BRAND-GUIDE.md`, `QA-VISUAL.md`, `MATRIZ-FIAP.md`, `RELATORIO-FINAL.md`, `CHECKLIST-SUBMISSAO.md`, `BLOCKERS.md` onde necessário, atualizando existentes em vez de duplicar.
- README e AI.md honestos com entradas/saídas, prompts, ferramentas e revisão humana.
- Screenshots antes/depois com contexto/versão e verificação visual, desktop/mobile/dark/light, screenshots do ambiente **hospedado** após autorização.
- ZIP acadêmico limpo, sem `.env`, chaves, dependências `node_modules`, sessões, cookies ou segredos; validação de integridade e SHA256.
- Link de deploy real, GitHub privado com acesso docente e comprovação de operações administrativas **quando o usuário autorizar e concluir credenciais e permissões**.

### 18.2 Critérios adicionais de rejeição automática de uma suposta 'release final'

- Mapa ainda é grade cartesiana fictícia, ou tiles não carregam no deploy.
- Valores aparecem como 'sensor ao vivo' quando são previsão/modelo ou exemplo sintético.
- Não houve integração de marca/favicons ou o favicon é emoji genérico.
- Biblioteca foi somente instalada mas não resulta em melhoria funcional/renderizada.
- Cenários só funcionam com `VITE_DATA_MODE=mock` na máquina do desenvolvedor; professor não consegue reproduzir no site.
- Interface apresenta pagelets vazios, duplicados, navegação inflada ou UX pior apesar de mais componentes.
- Testes unitários dizem que API CRUD funciona mas não há teste remoto/admin real e isso é omitido na documentação.
- ZIP/documentação apontam HEAD antigo ou contagens inventadas, ou contêm arquivos sensíveis.
- Revisores reprovam mudanças substanciais ou o planejamento omite silenciosamente recursos do contrato.
- Não há `docs/CENARIOS-DEMONSTRACAO.md` com teste e roteiro real ou não há distinção entre datasets.
- O projeto não cumpre a rubrica FIAP aplicável por disciplina, mesmo que visualmente impressionante.

## 19. Execução responsável para não repetir os erros do harness

**Não começar agora.** Esperar o status terminal da rodada atual, coletar HEAD/branch, revisar alterações, testes, code review e arquivo ZIP. Só então construir o próximo goal, com briefing completo dentro do sandbox PERMITIDO (nada de contrato necessário fora do repo/área autorizada).

### Etapas com gates internos e orçamento conhecido, mas escopo mantido

1. **Inventory/gap analysis**: auditar componentes, rotas, modelos, banco, APIs, arquivos, marca e dados. Relatar lacunas, dependências e esforço honesto. Não produzir plano que reduza silenciosamente a missão.
2. **Foundation**: implementar marca, tokens, primitives shadcn, navegação, estados base, layouts e controle de modos de dados.
3. **Geospatial**: mapa MapLibre real, ingestão geográfica autorizada, filtros e painel de detalhes, mobile.
4. **Climate & analytics**: fonte meteorológica com proveniência, histórico/comparação/reportes, confiabilidade.
5. **Professor scenarios**: conjunto de cenários replicável no deploy, isolamento/segurança, roteiro/contas autorizadas.
6. **Remote verification & polish**: visual inspection, testes, auditorias code/security, relatório, pacote e preparação de deploy.

Estas são etapas de um **mesmo contrato de produto final**, mas podem exigir mais de uma execução controlada de agentes. **Não aumentar budgets nem alterar harness sem autorização expressa.** Se a capacidade acabar, parar em blocker com progresso e plano para retomar; não aceitar 'só alguns ícones' como final. O revisor não deve ser desativado; critérios visuais e de ambiente real são parte do gate.

### Acesso externo e aprovação humana

A frase 'quero o ambiente real' define o resultado desejado, **não autoriza automaticamente alterações potencialmente destrutivas, publicações, criação de usuários, importação de milhares de linhas, deploy público, mudanças de DNS/segurança ou custos**. Fazer plano de migração e autorização pontual, com verificação e rollback, em vez de prometer realizar silenciosamente. Não solicitar confirmação para cada pequena refatoração local.

### Política de conclusão

Só declarar `PROFESSOR_READY` quando houver evidência da **URL real**, autenticação/CRUD, datas e fontes verdadeiras, cenários reproduzíveis, testes, relatório FIAP e ZIP condizente com commit final. De outro modo, declarar `LOCAL_READY_PENDING_REMOTE` ou `BLOCKED` com causas objetivas, sem maquiagem.

## 20. Pesquisa adicional e proveniência das ideias

### Fontes oficiais / técnicas consultadas

- MapLibre GL JS — mapa, clusters, animações, heatmaps, terreno: https://maplibre.org/projects/gl-js/
- shadcn/ui — sidebar e RHF/Zod: https://ui.shadcn.com/docs/components/base/sidebar ; https://ui.shadcn.com/docs/forms/react-hook-form
- Open-Meteo — APIs meteorológicas, licença não comercial e histórico por reanálise: https://open-meteo.com/ ; https://open-meteo.com/en/docs/historical-weather-api
- ARTESP — GTFS com localizações de pontos de parada e limites conhecidos: https://dadosabertos.artesp.sp.gov.br/dataset/gtfs
- GeoSampa — fonte municipal de dados espaciais: https://novogeosampa.prefeitura.sp.gov.br/
- Overture Maps — infraestrutura de trânsito e licenciamento: https://docs.overturemaps.org/guides/base/infrastructure/ ; https://docs.overturemaps.org/guides/places/
- Turf — geoprocessamento em navegador: https://turfjs.org/docs/getting-started
- H3 — agregação espacial hexagonal: https://h3geo.org/docs/highlights/aggregation/
- Supabase — PostGIS, RLS, segredos, jobs e limites realtime: https://supabase.com/docs/guides/database/extensions/postgis ; https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/functions/schedule-functions ; https://supabase.com/docs/guides/realtime/limits
- MapLibre Compare — ferramenta de comparação espacial: https://makewithmaplibre.com/plugins/maplibre-gl-compare/
- Vite PWA — ícones e app instalável quando justificado: https://github.com/vite-pwa/vite-plugin-pwa
- Playwright — comparação de screenshots reais: https://playwright.dev/docs/test-snapshots
- W3C — acessibilidade WCAG 2.2: https://www.w3.org/TR/wcag/
- NWS — limites do índice de calor: https://www.weather.gov/

### Diferenciação entre fatos e propostas

As ferramentas e APIs descritas acima existem e oferecem as capacidades documentadas. **Nenhuma pesquisa comprova que já estão integradas ao repositório do ClimaPonto, que suas cotas/custos são adequados para este projeto, ou que todos os dados de São Paulo necessários podem ser obtidos sem permissão.** Essas verificações fazem parte da próxima auditoria. O conjunto de recursos é uma **especificação de produto desejado**; não é relatório de implementação.

## 21. Ordem final de precedência e instruções para o próximo executor

1. Segurança, honestidade científica, integridade de dados, regras de autorização e rubrica FIAP são inegociáveis.
2. Interface, experiência, identidade e cenário real são parte explícita do aceite, não extras opcionais a serem descartados silenciosamente.
3. Liberdade criativa para propor **mais soluções úteis ainda não listadas**, com aceitação quando resolvem jornada real e custo/risco são proporcionais. Não se limitar aos itens que o usuário mencionou: pensar na experiência de um professor, estudante, cidadão, administrador e desenvolvedor fazendo manutenção.
4. Reusar o existente quando bom, mudar quando necessário; **não remover funcionalidades reais** sem substituição superior e testes equivalentes.
5. Não tratar prioridade como licença para omitir as demais partes: backlog residual e blockers precisam ser explícitos e aprovados pelo humano; encerrar como final só quando metas de aceite cumpridas.
6. Escopo visual não é alcançado apenas com tokens, layouts cosméticos, ícones ou dependências instaladas; comprovar melhorias com interfaces renderizadas, screenshots e tarefas reproduzíveis.
7. Não executar nova rodada até receber novo comando explícito, após a conclusão e verificação da rodada atualmente em execução.

**Conclusão:** a entrega desejada é uma plataforma ClimaPonto única e consistente: marca própria, mapa geográfico verdadeiro, análises responsáveis, dados reais rastreáveis, cenários demonstráveis no ambiente hospedado, UI refinada, testes fortes e material acadêmico auditável. A próxima execução deve produzir o produto, não apenas uma demonstração de que sabe instalar bibliotecas.

---

# V3 — ADENDO VINCULANTE: MICROINTERAÇÕES PREMIUM, NAVEGAÇÃO INTELIGENTE E PÁGINA DE PONTO 360°

**Natureza:** instrução de produto que complementa integralmente os itens 0–21 acima, sem substituí-los. **Este adendo corrige uma interpretação anterior:** quando o responsável pede “mais responsividade com efeitos”, a exigência principal é **interatividade animada e microinterações elegantes em resposta a hover, foco, clique, seleção, abertura, atualização e navegação**. Responsividade de layout para mobile/tablet continua necessária, mas NÃO é o foco exclusivo nem substitui os efeitos. O sistema deve parecer vivo, com movimento intencional, contido e profissional, sem sobrecarregar a interface.

## 22. Mandato visual e de interação — refazer o que precisa ser refeito

O autor da implementação tem liberdade efetiva para **criar, mover, alterar, combinar, substituir e redesenhar páginas, menus, filtros, componentes e fluxos**, e para adicionar funcionalidades úteis que não constem desta lista, desde que preserve capacidades anteriores e requisitos FIAP. O objetivo não é marcar caixas numa lista; é alcançar **coerência visual e experiência de produto de alta qualidade**. Não limitar o trabalho a ícones, mudança de CSS superficial ou instalação de bibliotecas. Não construir dezenas de novas páginas vazias. Cada alteração relevante exige demonstração na aplicação real renderizada.

### 22.1 Problemas observados nos prints recentes — corrigir globalmente

- **Filtros grudados:** há dois segmentos de chips (“Todos / Normal / Atenção / Crítico” e “Todos / Online / Atrasado / Offline / Sem dados”) praticamente encostando nas bordas, sem hierarquia entre grupos. Reprojetar barras de filtros com **gaps perceptíveis entre grupos**, margens, altura padronizada, labels de agrupamento, disposição compacta e possibilidade de `Popover`/`Sheet` para filtros avançados. Se houver chips ativos, mostrar contador e opção clara de remover/limpar. Evitar rolagem horizontal inesperada e excesso de divisórias. Ajustar o problema em **todas as telas**, não só Explorar.
- **Busca retangular fora da linguagem visual:** aplicar cantos generosamente arredondados, tokens globais de radius consistentes com inputs, filtros e botões; adicionar ícone de busca coerente, foco visível, botão de limpar quando houver texto, placeholder apropriado e estados hover/focus/loading. Evitar alterações que prejudiquem legibilidade. O critério é harmonia com o app inteiro, não simplesmente `rounded-full` em tudo.
- **Sidebar atual:** ocupa grande altura com pouca função contextual, agrupamento grosseiro/contorno desconexo, marca ainda associada a pictograma genérico de ônibus no print. Revisar geometria, alinhamentos, densidade, hierarquia, estados ativo/hover e conteúdo do rodapé; integrar a marca própria entregue no pacote.
- **Excesso de informação na mesma tela:** várias áreas possuem KPIs, gráficos, filtros, textos e tabelas simultâneos. Fazer auditoria de densidade em cada rota; manter somente a informação prioritária acima da dobra; organizar o restante em seções relevantes, subtelas de detalhes, tabs bem justificadas, accordions e disclosure progressivo. **Não ocultar dados importantes em interações invisíveis** nem criar navegação desnecessariamente profunda.
- **Espaçamentos e superfícies inconsistentes:** definir escala única de espaçamentos, radius, pesos tipográficos, largura de conteúdo, alinhamento de cards, alturas de campos e estados de borda; validar uso em todas as páginas claro/escuro. Evitar contornos duplicados (“card dentro de card dentro de card”) e áreas enormes vazias por acidente.

### 22.2 Sistema de movimento e feedback — obrigatório, com propósito

Implementar um **motion design system** leve, consistente e testado. Recomenda-se Motion (`motion/react`) + CSS transitions simples quando melhor; animação não deve ser implementada em todas as tags cegamente. Criar tokens documentados de duração, curvas, distância e intensidade, ajustáveis e respeitando `prefers-reduced-motion`. Parâmetros iniciais sugeridos, sujeitos a inspeção visual: hover/focus ~120–180 ms, mudanças de estados ~160–240 ms, painéis/nav ~200–300 ms. Preferir transform/opacity e evitar animar propriedades que gerem reflow pesado em listas/mapa; limitar simultaneidade.

**Inventário mínimo de microinterações a projetar e verificar:**

1. **Sidebar:** expansão suave no hover deliberado; recolhimento suave ao sair da região, sem flicker, sobreposição indevida ou perda de foco; item ativo com indicador deslizante discreto; grupos aninhados com disclosure animado; ícones e textos que entram de forma elegante; tooltips quando recolhida; feedback de clique, pin/unpin e estado persistente.
2. **Navegação e rotas:** transições sutis de entrada/saída que preservam scroll quando apropriado, não interrompem interação, não refazem mapa sem necessidade, e respeitam modo de movimento reduzido.
3. **Botões, ações e ícones:** hover com ênfase de cor/borda/elevação quase imperceptível, tap/press com escala muito pequena, spinner de ação em andamento e sucesso/erro compreensível; evitar que controles se desloquem ao passar o mouse.
4. **Busca e filtros:** focus ring elegante, transição de abertura dos filtros, chip ativo com estado claramente perceptível, indicador de contagem e limpeza animada sem salto; resultados atualizam com fade/reordenação discreta, sem mudar o foco inesperadamente.
5. **Cards e listas:** hover que revela ação contextual útil quando houver e também seja acessível por foco/clique; destaque da linha selecionada; skeletons fiéis ao layout, não shimmer exagerado; mudança de favoritos com feedback curto.
6. **Mapa:** marcadores respondem a hover/foco, seleção com `flyTo` ou transição controlada, abertura de painel com motion e zoom sem enjoo; agrupamentos reagem com feedback; sem pulsar eternamente todos os marcadores. Pulso/alerta só em evento verdadeiro e com reduced motion alternativo.
7. **Gráficos:** crosshair/tooltip sincronizado, linha/série destacada no hover, entrada suave de dados disponíveis, transição ao mudar período e seleção de legenda, brush quando útil; não animar valores inexistentes nem mexer na escala de modo enganoso.
8. **Diálogos, menus, drawers e accordions:** abrir/fechar suaves, foco gerenciado, backdrop moderado, Escape, clique externo e retorno do foco; sem animações que bloqueiem interação.
9. **Estados e feedback:** snackbar/toast com hierarquia, animação curta para sucesso e erro, retry claro, empty state deliberado, confirmação de ação destrutiva e reversão quando apropriada.
10. **Indicadores e KPIs:** contagem/valor pode interpolar somente após atualização real de dado, com unidade e período corretos; nunca usar animação de número para sugerir atualização ao vivo que não existe.
11. **Ações no detalhe de ponto:** transição elegante entre tabs, gráficos, tabelas e painel de qualidade; deep link preserva contexto; indicador ativo acompanha a navegação sem pulo.
12. **Preferências:** tema claro/escuro com transição contida que não produza flash branco, memória das escolhas não sensíveis e alternativa sem animação.

**Teste de microinterações:** registrar vídeo curto ou evidências reproduzíveis em `docs/INTERACOES-E-MOVIMENTO.md` para sidebar hover/pin, chip/filtro, foco na busca, seleção do mapa, gráfico, drawer, notificação e navegação. Inspecionar em navegador real com mouse e **teclado**, e testar touch sem efeitos hover presos. Verificar `prefers-reduced-motion: reduce` e performance em máquina intermediária. Indicadores de interação devem ser acessíveis sem depender exclusivamente do movimento.

## 23. Sidebar — redesenho de navegação com interação inteligente

A sidebar deve transmitir a identidade do ClimaPonto e servir como **sistema de navegação orientado a tarefas**, não coleção decorativa de links. Especificar o comportamento abaixo como norte de projeto, com liberdade de melhorar o desenho final:

- **Modo compacto:** faixa estreita com ícones reais, marca simplificada, tooltip legível ao foco/hover e indicador ativo.
- **Hover-to-expand inteligente:** quando o ponteiro permanece brevemente sobre a sidebar compacta, ela expande suavemente, preferencialmente em sobreposição que **não cause repaginação brusca do mapa/dashboard**. Evitar expansão acidental ao simplesmente cruzar a região; usar pequeno delay apenas quando agrega, e zona segura de saída para não recolher ao mover para submenu. Não interceptar campos/conteúdo sem indicação; escolher overlay/reflow conforme testes visuais reais.
- **Pin/unpin manual:** botão de fixar aberto/compacto, com feedback e persistência local apropriada. Habilitar também clique e teclado; preferências não são dependentes apenas de `:hover`.
- **Sem mouse:** em touch usar drawer acessível e ação explícita de abrir; no teclado, acessibilidade plena por Tab, Enter, setas quando semanticamente aplicável e Escape. O usuário não perde navegação se preferir movimento reduzido.
- **Menu contextual e agrupado:** área *Explorar* (Visão geral, Mapa/Pontos, Detalhe do ponto via seleção), *Investigar* (Análises, Comparar, Histórico, Laboratório), *Compartilhar* (Relatórios), *Operar* (Administração e saúde de dados — somente autorizado). Os agrupamentos e rótulos são sugestões; validar rotas e evitar mais itens do que o usuário precisa ver. Possibilidade de submenu/accordion, preferências de expansão.
- **Atalhos úteis e progressivos:** acesso rápido a **favoritos**, **recentemente vistos** (somente se já houver histórico local/real), **último ponto consultado**, **buscar ponto** e **comparar selecionados**. Não fingir contagens nem ocupar sidebar inteira com itens estáticos. Evitar colocar todos esses recursos ao mesmo tempo no estado recolhido.
- **Command palette Ctrl/Cmd+K:** busca global por pontos e comandos reais “Ir ao mapa”, “Ver ponto X”, “Abrir relatórios”, “Limpar filtros”, etc., aproveitando `cmdk`/shadcn Command se houver sentido. Atalhos não funcionam quando foco está editando texto; ajuda descoberta na interface.
- **Rodapé deliberado:** tema, status da fonte/dataset e atualização mais recente (somente se real), ajuda/sobre dados e conta/admin quando necessário. Remover grande área vazia quando possível, mas sem colocar um mini-dashboard dentro da sidebar.
- **Animações:** active-pill deslizante, fade do texto e label ao expandir, grupo acordeão, tooltips, seção recolhível, estados hover/press/focus. Nada de tilt 3D, brilho permanente, reações exageradas ou sidebar que expande/recolhe sem cessar.
- **Acessibilidade:** o conteúdo extra acionado por hover/focus deve ser dispensável, alcançável pelo ponteiro e persistente até o usuário sair/fechar (WCAG 1.4.13). Evitar autoexpansão que encubra de forma permanente conteúdos cruciais, e manter foco sem sumiço inesperado.
- **Design:** wordmark ClimaPonto no modo aberto e símbolo otimizado no modo ícones; badges/status somente quando informativos e verdadeiros; coerência com design tokens.

### 23.1 Critérios de aceite específicos da sidebar

- Modo recolhido e expandido testados com ponteiro, clique, keyboard-only e toque; pin persiste sem inconsistência.
- Sidebar não cobre botões críticos nem desloca mapa causando jank no hover; não pisca ao entrar/sair de submenus.
- Navegação conserva a rota/URL, seleção, foco e dados; ícone de sidebar não volta a ser emoji/ônibus genérico.
- Itens admin só acessíveis conforme papel e **backend** não concede operações por esconder/exibir link.
- Vídeo/screenshot da interação real comprova a transformação, não apenas print do estado estático.

## 24. Página nova de Análise Profunda — “Ponto 360°”

**Criar uma rota de detalhe por ponto que tenha valor real**, acessível por clique no mapa, busca, favoritos, histórico e links compartilháveis. Nome final a escolher (ex.: **Detalhe do ponto**, **Ponto 360°**, **Observatório do ponto**), sem marketing artificial. A tela será um **dashboard analítico muito completo para UM ponto explicitamente escolhido**, não repetição da Visão geral com filtros extras.

### 24.1 Estrutura funcional sugerida

1. **Cabeçalho de identidade:** nome/código do ponto, endereço/bairro quando existirem, coordenadas e proveniência, última atualização, status confiável, favoritar, compartilhar link e “voltar ao mapa”. **Se localização estiver ausente, indicar isso sem inventar endereço.**
2. **Resumo do estado atual:** temperatura, umidade, qualidade/idade do dado, status operacional, amostras no período; mostrar só métricas disponíveis e com origem/unidade/timestamp. Se houver meteorologia regional, card separado e rotulado “Estimativa regional”. Não usar um painel gigante de `—`.
3. **Séries temporais ricas:** gráfico principal de temperatura ao longo do tempo; escolher janelas com dados (24h, 7d, 30d, custom), brush, tooltip preciso com fonte, destaque de lacunas. Umidade/variáveis existentes como séries ou tabs; unidades e eixos legíveis; opção de tabela subjacente.
4. **Comparativo:** selecionar segundo ponto para comparação lado a lado por mesmo período/unidade/fonte; identificar incompatibilidades; navegação para modo comparador dedicado quando a complexidade justificar.
5. **Qualidade e proveniência:** linha de integridade (atualização, cobertura, amostras válidas/ausentes, último sync, origem, tipo observação/modelo/demo), metodologia e flags calculadas por regras explícitas.
6. **Eventos/alertas:** timeline somente de eventos reais armazenados ou demonstração rotulada, com regra/limiar e data; sem inventar notificações.
7. **Mapa de contexto:** mini-mapa geográfico com marcador real e opção de abrir mapa completo; não duplicar um mapa enorme na página de análises.
8. **Dados brutos e histórico:** tabela paginada/virtualizada quando necessário, ordenável, exportação CSV segura, cópia de referência, filtros e fuso explicitado.
9. **Resumo interpretativo:** pequenas conclusões **determinísticas e verificáveis** sobre os dados disponíveis, nunca IA alucinando causalidade climática ou risco individual.
10. **Ações úteis:** exportar relatório do ponto, comparar, favoritar, link permanente, alternar fonte e período. Sem 12 botões primários simultâneos.

### 24.2 Arquitetura para não poluir a tela

- **Primeira dobra**: identidade do ponto + 2–4 indicadores úteis + gráfico principal ou empty state contextual. O restante por **tabs ou seções claramente organizadas**, usando disclosure progressivo. Não colocar todas as séries, eventos, tabelas e metadados abertos ao mesmo tempo.
- Possível estrutura: **Visão**, **Medições**, **Comparação**, **Qualidade**, **Eventos e histórico**. Combinar ou renomear conforme uso real, não forçar cinco abas vazias.
- URL estável como `/pontos/:id` (adaptar às rotas atuais), estado de filtro/período compartilhável sem vazamento de tokens. Carregamento por id; não aceitar id inexistente como dado vazio silencioso.
- Dados reais via cliente/API atual; derivação de métricas em módulos puros testados, tratamento de loading/error/empty/partial, limpeza de subscriptions e cache invalidado após CRUD.
- Motion nos tabs, seleção da série, tooltips, legenda, foco e ações; **gráficos não devem roubar scroll** e tabelas não podem quebrar mobile.

### 24.3 Critérios de aceite da página de ponto

- Selecionar um ponto no mapa e clicar “Ver análise detalhada” abre a rota correta com dados vinculados ao ID verdadeiro; botão Voltar preserva navegação ou oferece fallback.
- Ponto com observações válidas apresenta gráfico/tabela com origem e carimbo; ponto sem observações mostra empty state honesto sem gráfico fabricado.
- Gráficos, filtros de período e CSV usam **mesma consulta e intervalo**; comparação entre pontos exige fontes e unidades comparáveis.
- UI testada em desktop e celular com estado positivo, vazio, falha e demo identificada.
- Testes automatizados do data adapter, cálculos, auth e deep link; visual tests do dashboard real em ambos os temas.

## 25. Despoluição informacional e arquitetura editorial em TODAS as páginas

Antes de criar páginas novas, fazer **auditoria de conteúdos por rota** e uma **matriz de responsabilidade de cada tela**: o que a pessoa precisa decidir aqui? O que é essencial, secundário, avançado e administrativo? Migrar conteúdos redundantes para locais próprios sem removê-los. Fixar um padrão de **título curto + uma ação primária + contexto/fonte + conteúdo principal + detalhes sob demanda**. Evitar ter mais de um filtro global completo por tela ou duplicar o mesmo KPI sem razão.

**Proposta de redistribuição, adaptável à auditoria:**

- **Visão geral**: panorama simples, 3–5 KPIs fundamentados, CTA claro “Explorar pontos”, tendência breve e qualidade de atualização resumida. Não replicar filtros do mapa, timeline integral e gestão num mesmo viewport.
- **Explorar**: mapa verdadeiro como protagonista; busca compacta de bordas arredondadas; filtro essencial em linha com gaps e painel “Mais filtros”; lista sincronizada acessível; detalhe rápido em side panel. Detalhe profundo fica no Ponto 360°, não na sidebar do mapa.
- **Pontos / Ponto 360°**: visão individual e investigação profunda, com tabs e narrativas sobre dados verificáveis.
- **Análises**: comparação entre localidades, séries agregadas sob metodologia, cobertura e tendências. Não repetir a página individual sem motivo.
- **Histórico**: consulta temporal/tabela e filtros de recorte precisos, paginação, exportação; não exibir mini-dashboard redundante em cada linha.
- **Laboratório**: cenários hipotéticos explicitamente rotulados, controles de parâmetros, metodologia, reset e comparações; nunca alimentar KPIs reais.
- **Relatórios**: geração e visualização de relatórios com fontes, período e limitações; modelos imprimíveis e CSV seguro.
- **Administração**: gestão CRUD protegida, indicadores de qualidade, integrações, alertas e auditoria, preferivelmente área secundária só para operador; não misturar controles admin no caminho cidadão.
- **Sobre os dados**: fonte/proveniência, definição de status, FAQ de interpretação, disponibilidade, cobertura e licenças acessíveis por link contextual.

**Inspirações de organização úteis**: layout Bento contido só quando melhora escaneabilidade; cabeçalhos e filtros sticky quando não roubarem espaço; ações secundárias em menu contextual; mini-timeline “última atualização” quando real; comparador como modo e não card infinito; breadcrumbs discretos em investigação profunda; sumário de painel lateral em vez de lista enorme. Não adicionar páginas por preencher sidebar.

**Métrica editorial de aceite:** identificar ao menos cinco lugares da interface onde o antes exigia excesso de leitura/scroll/controles e mostrar que o depois deixa a decisão principal mais rápida, **sem perder acesso às informações**. Criar `docs/MATRIZ-DE-CONTEUDO-E-UX.md` com antes/depois por rota e screenshots reais.

## 26. Mais melhorias para elevar o produto de verdade (não apenas as ideias do usuário)

Pesquisar e propor as melhores possibilidades com julgamento de produto. Integrar as que gerem benefício verificável, não tudo ao mesmo tempo como acúmulo de funcionalidades:

1. **Busca universal orientada à tarefa** (Ctrl/Cmd+K): pontos, páginas, favoritos, ações autorizadas, últimas pesquisas, atalhos; resultados agrupados e teclado.
2. **Contexto persistente**: último ponto consultado, filtros de análise, período, sidebar pin e tema preservados na URL/armazenamento quando apropriado; não salvar dados privados em localStorage.
3. **Comparação A/B contextual**: adicionar segundo ponto a partir do mapa ou do detalhe; painel de comparação com critérios transparentes, fonte comum, mesma unidade e período.
4. **Timeline de mudanças do ponto**: evolução de leituras/status e eventos realmente registrados, com gaps; ótima página para contar a história da cidade sem inventar temporalidade.
5. **Indicador de confiança como primeiro cidadão**: qualidade dos dados e proveniência visível de forma simples; legível sem clicar em muitas áreas. “Saber que não sabemos” é valioso.
6. **Estado de atualização útil**: carimbo absoluto e relativo (ex.: “última observação às ...”), botão de atualizar/retry real e indicação de stale/cached; sem spinner eterno nem “ao vivo” falso.
7. **Favoritos inteligentes**: persistência já suportada, seção pessoal de acesso rápido e painel de comparação de favoritos; não introduzir login artificial para um favorito local.
8. **Histórias cidadãs reprodutíveis**: fluxo guiado curto “encontre -> compare -> entenda -> exporte” no site final. Botão 'Como explorar' opcional e descartável, nunca tutorial forçado.
9. **Proveniência em cada gráfico e exportação**: fonte, período, resolução, data, tipo observado/modelado/demo e limitações científicas. O relatório é tão confiável quanto sua legenda.
10. **Operação observável**: saúde de fontes, registros sem coordenadas, erros de ingestão, cobertura geográfica, falhas por permissão; separar do painel cidadão.
11. **Modo demonstração na MESMA implantação**: cenários S01–S16 já definidos, separados por origem/segurança e **sem criar dados falsos em indicadores reais**. Também testar as microinterações, filtro espaçado, hover da sidebar e a nova página de ponto num conjunto de cenários identificados.
12. **Deep links compartilháveis** para ponto, período e seleção no mapa, sem tokens sensíveis ou IDs privados.
13. **Experiência de falha refinada**: tile provider fora, internet lenta, WebGL ausente, leitura ausente, autorização negada e API indisponível; fallback em lista/detalhe, nunca canvas vazio com aparência de sucesso.
14. **Qualidade dos formulários admin**: validação de lat/lng, campos dependentes, feedback de salvamento, confirmação de exclusão, edição não destrutiva, proteção RLS real e reversão se backend suportar.
15. **Relatório por ponto**: exportação imprimível com gráfico, fonte, carimbo e recorte; se PDF programático exigir dependência sem ganho, CSS print bem desenhado.
16. **Detalhe da estética**: logotipo real, favicon em 16/32px, meta OG, tokens de cor, marca em pins do mapa, gráficos, sidebar e relatórios; contraste alto, sem emoji de ônibus.
17. **Progressive enhancement**: funcionamento sem WebGL/hover/animação, telas pequenas, teclado, reduced motion e Firefox; experiências premium não podem quebrar o essencial.
18. **Perfis de avaliação FIAP**: demonstrar hook customizado, componentes reutilizáveis, CRUD remoto, testes, acessibilidade, IA usada de forma auditável, URL final e guia do professor. Não confundir a experiência do usuário com o relatório acadêmico.

## 27. Biblioteca e implementação das novas interações

**Stack preferencial, sem dependências gratuitas:**

- **shadcn/ui** (sidebar, command, sheet/drawer, tooltip, popover, scroll-area, toggle-group, button, tabs, skeleton, separator, breadcrumb, switch, form, sonner) como sistema de primitives, selecionadas caso a caso. `tsx:false` quando JS/JSX atual recomendar.
- **Motion** (`motion/react`) para estados `whileHover`, `whileTap`, `whileFocus`, transições `AnimatePresence`, `layout`/`layoutId` e `useReducedMotion` quando apropriado. Não usar Motion para simples cor CSS se não houver ganho.
- **MapLibre + react-map-gl/maplibre** para mapa, seleção, clusters/camadas, transições de câmera e fallback em lista; não substituir mapa por canvas decorativo.
- **Recharts/shadcn Charts** para gráficos de séries temporais e comparação; destacar cursor/tooltip com unidade, legenda e fonte, sem usar dados de preenchimento inventados.
- **TanStack Table**, **TanStack Query**, **React Hook Form/Zod**, **Turf** apenas quando necessidades reais justificarem. Se já houver funcionalidades equivalentes, não duplicar bibliotecas nem reescrever toda a arquitetura.
- **Lucide** para ícones consistentes, **Sonner** para avisos acessíveis, **cmdk/shadcn Command** para paleta. Não introduzir simultaneamente três sistemas de toast, dois de ícone e dois de chart.
- **CSS & Tailwind** continuam fundamentais para interação leve; motion budget, layout e perf dependem de boa engenharia, não de pacotes.

**Pesquisa de capacidade documentada** (checar versões e integrações antes de instalar):
- https://motion.dev/docs/react-gestures ; https://motion.dev/docs/react-layout-animations ; https://motion.dev/docs/react-hover-animation
- https://ui.shadcn.com/docs/components/base/sidebar ; https://ui.shadcn.com/docs/components/base/command
- https://www.w3.org/TR/wcag/#content-on-hover-or-focus ; https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html

## 28. Cenários adicionais da release — complementar S01–S16

| ID | Cenário reproduzível na aplicação hospedada | Evidência obrigatória |
|---|---|---|
| S17 | Sidebar colapsa, expande com hover intencional, fixa por clique, restaura estado | Teste real mouse/teclado/touch e curto vídeo de interação, sem jank |
| S18 | Pesquisa e filtros com espaçamento, busca arredondada e estados animados | Desktop/mobile, modo claro/escuro; busca e contagem afetam resultados reais |
| S19 | Selecionar um ponto do mapa e abrir Ponto 360° | URL real por ponto, gráficos com dados verdadeiros ou empty state honesto, exportação e histórico quando disponíveis |
| S20 | Comparar dois pontos com fontes e períodos coerentes | Comparação calculada ou informação explícita de incompatibilidade; jamais gráfico fake |
| S21 | Falha de mapa/serviço sem perda de jornada | Fallback acessível em lista, retry, data freshness e atribuição preservada |
| S22 | Acessibilidade das microinterações | Teclado, foco, sem hover obrigatório, reduced motion e WCAG hover/focus |
| S23 | Auditoria de densidade visual por tela | Screenshots reais antes/depois e matriz de redistribuição sem perda funcional |

O professor não deve precisar de terminal local, `VITE_DATA_MODE=mock`, devtools ou código oculto para reproduzir os cenários. Quando são demonstrativos, rotular **visivelmente** e isolar dos dados observados no mesmo produto e deployment. Provisionar usuários/datasets remotos requer autorização específica do responsável.

## 29. Protocolo de implementação e revisão — impedindo outra entrega rasa

1. **Primeiro verificar a conclusão da rodada anterior:** coletar `status`, branch, HEAD, tasks, code/security review, gate report e ZIP. Não usar `G-20261116-0865c5` como baseline automaticamente se não estiver `delivered`/aprovado. Selecionar último HEAD confiável e registrar o motivo.
2. **Inventário real de dependências, esquema, UI e marcas:** não supor que nada do pacote foi integrado nem que tudo já existe. Abrir cada página e inspecionar versões reais. Verificar layout atual dos prints recentes.
3. **Plano de execução que cubra o contrato INTEGRAL:** dividir em tarefas com dependências explícitas, critérios de aceite, ordem de execução e custo/risco estimados; preservar objetivos de mapa real, marca, Supabase, cenários, Ponto 360°, sidebar, microinterações e despoluição. Se não couber em uma execução ou no orçamento, registrar blockers e retomar por fases **sem chamar a parte executada de release final**. Pedir autorização antes de elevar limites/gastos; não desativar reviewers.
4. **Design system e primeiro impacto:** integrar identidade, tokens, espaçamento, buscas, filtros, microinterações-base e sidebar; screenshots reais comparativas.
5. **Produto geoespacial e detalhe:** mapa MapLibre real e dados geográficos rastreáveis; Ponto 360°, timelines, comparação, proveniência, gráficos; tempo/fonte coerentes; nenhum fake como valor observado.
6. **Ambiente real e jornadas:** integrar Supabase/API, dataset real, cenários demostrativos isolados; preparar migrações e implantações somente conforme autorizações; executar CRUD/RLS reais após aprovações.
7. **QA por rota e cenário:** lint/build/unit/E2E Chromium/Firefox, visual snapshots, foco, hover, reduced motion, mobile, CSP, offline, segurança, PDF/CSV, integrações e regressão de funcionalidades antigas. Inspecionar vídeos ou screenshots, não apenas confiar em texto.
8. **Revisão de produto autêntica:** comparar antes/depois; reprovar se sidebar só recebeu ícones, busca segue retangular, filtros continuam grudados, Explorar mostra grade fictícia, página Ponto 360° é cópia da Visão geral, ou cenários só rodam no mock.
9. **Finalizar documentação e entrega:** `docs/INTERACOES-E-MOVIMENTO.md`, `docs/MATRIZ-DE-CONTEUDO-E-UX.md`, `docs/CENARIOS-DEMONSTRACAO.md`, branding, QA visual, matriz FIAP, relatório com HEAD/contagens verdadeiras, checklist, README e AI.md; ZIP com SHA e sem secrets. Deploy só autorizado e testado no URL efetivo.
10. **Conclusão honesta:** `PROFESSOR_READY` somente com todas as exigências e evidências do deploy; `LOCAL_READY_PENDING_REMOTE` para implementação local estável mas sem etapas externas; `BLOCKED` com próximos passos e responsáveis se acesso/rede/orçamento impedirem finalização. Nenhum relatório de sucesso fictício.

### 29.1 Autorizações e integridade inegociáveis

- O objetivo de trabalhar no ambiente real é prioridade do produto, **não equivale a permissão para push, merge, deploy, mudar autenticação, alterar RLS, criar contas/salvar segredos, popular Supabase, executar migrations remotas ou comprometer recursos pagos sem autorização**.
- Não solicitar confirmação para cada escolha visual local, componente, tipo de transição ou refatoração segura. Solicitar apenas para ações remotas/sensíveis, mudanças de limite de orçamento ou decisões com custo/risco relevante.
- Não assumir que a promoção do Fable ou assinatura cobre qualquer custo específico. Conferir modelo real nos logs, consumo e políticas antes de rodar; não ocultar trocas de modelo.
- Materiais da FIAP: preservar ao menos 8 componentes reutilizáveis, `useState`/`useEffect`, pelo menos 2 hooks customizados, separação UI/serviço/API, API externa com CRUD comprovável, 15+ commits significativos e README/AI.md; preservar o que os testes comprovam, revalidar checklist acadêmico e outras disciplinas somente com evidência recebida. Não criar falsa documentação.

## 30. Critérios de aceite adicionais — checklist vinculante

- [ ] Filtros visualmente separados, hierarquia clara e comportamentos corretos em **todas** as rotas que os usam.
- [ ] Busca com radius consistente e estados hover/focus/clear/loading; não ficou só “um input mais arredondado”.
- [ ] Sidebar hover-expand sem flicker, pin/unpin, teclado/touch, indicador ativo animado, identidade real, hierarquia contextual e controles acessíveis.
- [ ] >= 8 padrões distintos de microinteração úteis foram realmente integrados e exercitados; respeitam `prefers-reduced-motion` e não causam regressões de performance/a11y.
- [ ] Ponto 360° é uma rota real ligada à seleção de ponto e com dados, provenance, histórico, gráficos, comparador e export conforme disponíveis; states vazios autênticos.
- [ ] Mapa geográfico MapLibre real com dados rastreáveis ou blocker honesto; nenhuma grade MOCK representada como mapa real.
- [ ] Biblioteca shadcn e Motion têm uso visível e funcional, não estão apenas no package.json.
- [ ] Pelo menos 5 melhorias de densidade/organização por rota documentadas com antes/depois e jornada preservada.
- [ ] Identidade visual/favicons aplicados, marca testada em 16/32px; nada de emoji de ônibus como logo final.
- [ ] S01–S23 reportados individualmente com `verified`, `not_applicable` justificado ou `blocked`, nunca assumidos por texto.
- [ ] Navegadores, viewport, tema, teclado, foco, reduced motion, falhas de rede, RLS/CRUD e integridade de dados foram testados e evidenciados onde possíveis.
- [ ] A versão hospedada ao professor é real e reproduzível, com fonte observada/modelada/demo visível e dados reais separados de cenários sintéticos.
- [ ] Contagens de componentes, commits, testes, revisões e arquivo ZIP correspondem ao HEAD final e são verificadas, não estimadas.

**Diretriz final:** transforme a aplicação no melhor ClimaPonto possível dentro das evidências, restrições e autorizações reais. **Mais inteligência de produto, qualidade da interação, profundidade por ponto e clareza — não mais ruído visual.**

---

# 31. VALIDAÇÃO FINAL DE COMPLETUDE E PREPARAÇÃO DA EXECUÇÃO (V4)

Este adendo prevalece apenas onde torna explícita a intenção já contida nas seções 0–30. **Não remove, substitui ou enfraquece nada do briefing integral.**

## 31.1 Os pedidos explícitos do responsável são todos mandatórios

O responsável pediu, cumulativamente:

1. Liberdade para melhorar ou mudar de lugar o que existe, além de **criar novas páginas, componentes e funcionalidades**; preservar todas as capacidades e compromissos FIAP.
2. Ir muito além das ideias citadas: pesquisa, crítica de produto, iniciativa de design, recursos úteis e bibliotecas apropriadas, **sem adicionar ruído ou dependências gratuitas**.
3. Produto final com **dados, navegação, CRUD, permissões e cenários reproduzíveis no ambiente efetivamente hospedado** para o professor; demo claramente rotulada e isolada de observações reais, sem trocar toda aplicação para mock.
4. Mapas geográficos verdadeiros em lugar da grade fictícia; dados e coordenadas verificáveis, fallback honesto quando ausentes.
5. Branding próprio aplicado de ponta a ponta: símbolo/wordmark, logo claro/escuro, favicon legível em 16 e 32px, ícones de aplicativo e Open Graph, **sem ônibus emoji como logo**.
6. Espaçamento correto **em todas as páginas**: filtros não grudados; busca bem arredondada e consistente; sistema de layout, tipografia, radius e estado visual coerente.
7. **Microinterações são o sentido principal de “responsividade com efeitos” no pedido**: reações cuidadosas a hover, focus, click/tap, press, seleção, navegação, mudança de dados, accordion, drawer e tooltip. Adaptar layout para mobile continua necessário, mas não substitui microinteração.
8. Sidebar dinâmica: hover-expand intencional, pin/unpin, indicação animada de ativo, submenus organizados, ações rápidas contextuais, favoritos/recentes quando disponíveis, teclado, toque, reduced-motion e sem flicker.
9. **Ponto 360°**: seleção exata do ponto e dashboard profundo por ponto com os dados de verdade, séries, comparação, proveniência, qualidade, eventos válidos, tabelas e exportações; tudo organizado por abas/seções, sem despejar tudo numa tela.
10. **Menos poluição visual**: redistribuir conteúdo entre rotas/abas/drawers, informação essencial primeiro, detalhes por demanda; reduzir barras redundantes de filtro e blocos repetitivos.
11. Implementação real e demonstrável de shadcn/ui, Motion e MapLibre; Recharts ou chart library pertinente; avaliar TanStack e outros só com caso de uso, testes e licenças.
12. Catálogo **S01–S23** documentado e checado um por um, com URL do deployment final e modo de demonstração segura, identificando os que dependem de credenciais, dados ou autorização.
13. Revisão FIAP, testes de regressão, E2E, a11y, dark/light, screenshots antes/depois, ZIP, README, AI.md, documentação, histórico Git e revisão de código/segurança.

**Um objetivo não está cumprido porque aparece no plano, porque a dependência foi instalada ou porque a tela está visualmente parecida. Cada item exige prova implementada e testada, ou impedimento declarado.**

## 31.2 Não iniciar sobre branch duvidosa

O último objetivo conhecido é `G-20261116-0865c5`. Consultar o seu `status` e o SHA da branch. **Só usar como base se estiver efetivamente `delivered` com verificações e revisões aprovadas.** Se não estiver, parar e solicitar avaliação humana da baseline; não fazer fallback automático para outra branch e não assumir HEAD. Ao planejar novo goal, verificar `baseRef` e `baseRefHead`; `base: null` antes de `plan set` não prova erro de base.

O contrato de 89KB precisa estar **integralmente no objetivo ou numa worktree autorizada e acessível ao planejador**. Não referenciar apenas arquivo em `/home/harness` fora da sandbox, causa de bloqueio já observada. Os assets de branding também precisam estar na nova worktree/branch, não só no Downloads do Windows ou no diretório pessoal Linux. Confirme acesso **antes de gastar rodada**.

## 31.3 Capacidade e autorização

A missão é maior que uma rodada comum; construir um plano completo com etapas pequenas e gates, orçamento aprovado e trabalho retomável sem sacrificar escopo. **Não aumentar nem desabilitar limites, revisores, políticas ou permissões sem autorização.** Se o teto for insuficiente, entregar progresso parcial identificado como parcial e solicitar autorização, nunca chamar de final. Uso efetivo de Fable deve ser verificado em logs; variável de ambiente só solicita modelo.

Para atingir o resultado no domínio real apresentado ao professor, identificar quais operações dependem de autorização: `push`, `merge`, `deploy`, testes CRUD remotos, migrações, seed de cenários, criação de contas, RLS e acesso dos professores. Preparar plano de segurança/rollback e pedir autorização específica antes de executar cada classe de mudança remota. **A solicitação de resultado em ambiente real não concede automaticamente permissão de escrita remota.**

## 31.4 Portões finais que não podem ser contornados

- Comparação de screenshots e vídeo curto de interação de sidebar/filtros/mapa/Ponto 360° na aplicação realmente renderizada.
- Funcionalidades preservadas e novas jornadas concluídas, não só teste de presença de componentes.
- Mapa com tiles carregando e origem de coordenadas verificada; modo sem WebGL acessível.
- API/Supabase e RLS comprovados em ambiente autorizado; dados observados/modelados/demo diferenciados na **mesma implantação**.
- S01–S23 com resultado individual (`verified`, `blocked`, `not_applicable` com justificativa); sem declarações genéricas de sucesso.
- Código sem secrets, SHA do ZIP e do HEAD final corretos, testes de navegador e a11y registrados, code/security review aprovados após última alteração.
- Professor abre **uma URL real** e consegue reproduzir jornadas sem `localhost`, `VITE_DATA_MODE=mock`, terminal ou atalhos de desenvolvedor. Cenários didáticos permitidos desde que explicitamente etiquetados e segregados.
- Status final `PROFESSOR_READY` somente com provas de todas as exigências; caso contrário, `LOCAL_READY_PENDING_REMOTE` ou `BLOCKED` e lista curta das ações humanas faltantes.

**Se houver conflito entre impressionar visualmente e inventar resultado científico, preservar a integridade dos dados. Se houver conflito entre entregar rápido e declarar uma entrega falsa, preservar a verificação.**
