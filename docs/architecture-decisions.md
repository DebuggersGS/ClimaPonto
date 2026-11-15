# Decisões arquiteturais — ClimaPonto

Registro curto das decisões técnicas do front-end e da infraestrutura de dados, com o status de cada uma na revisão técnica.

| # | Decisão | Status |
| --- | --- | --- |
| 1 | React 19 + Vite + Tailwind CSS 4, JavaScript/JSX, npm | Aprovada (Etapa 1) |
| 2 | React Router para navegação | Aprovada (Etapa 1) |
| 3 | Oxlint como linter (padrão do template Vite) | Aprovada (Etapa 1) |
| 4 | Supabase como backend (PostgreSQL + API REST + Auth) | Aprovada (Etapa 2A) |
| 5 | Repositório GitHub privado `climaponto-gs-2026` | Aprovada (Etapa 2A) |
| 6 | Tabelas `stops` e `readings`; ponto com leituras não pode ser excluído, apenas desativado | Aprovada (Etapa 2A) |
| 7 | Campo `is_demo` em `stops` | Aprovada (Etapa 2A) |
| 8 | Restrições como `CHECK` em vez de `ENUM` | Proposta |
| 9 | Faixas de plausibilidade no banco, não limites ambientais | Proposta |
| 10 | Conectividade calculada e separada do estado ambiental | Aprovada (Etapa 2A); regra 2×/5× **provisória** |
| 11 | Administradores via `app_metadata.role = 'admin'` | Aprovada (Etapa 2A) |
| 12 | Grants explícitos + RLS | Proposta |
| 13 | Ingestão por Edge Function com credencial por dispositivo | Aprovada como **direção** (fechamento 2A); não implementada |
| 14 | Fallback para dados locais só sem configuração | Proposta |
| 15 | Classificação ambiental no ESP32, validada pelo backend | Aprovada (Etapa 2A) |
| 16 | Dispositivo identifica o ponto por `stop_code` | Aprovada (Etapa 2A) |
| 17 | Leituras `test` visíveis só para admins; `simulation`/`sensor` públicas em pontos ativos | Aprovada (fechamento 2A); aplicada no remoto (Etapa 2B) |
| 18 | `INSERT`/`UPDATE` em `stops` só nas colunas editáveis | Aprovada (fechamento 2A); aplicada no remoto (Etapa 2B) |
| 19 | Privilégios padrão revogados para objetos futuros (papel `postgres`) | Aprovada (fechamento 2A); aplicada no remoto (Etapa 2B) |
| 20 | Sessão em contexto React (`AuthProvider` + `useAuth`); `RequireAdmin` só controla a interface | Implementada (Etapa 2B) |
| 21 | CRUD sem bibliotecas novas: formulário com `useState`, `<dialog>` nativo, validação própria espelhando o banco | Implementada (Etapa 2B) |
| 22 | Área administrativa carregada sob demanda (`React.lazy`) | Implementada (Etapa 2B) |
| 23 | Migração `hide_test_readings` com `ALTER POLICY` (sem `DROP`) | Aplicada no remoto (Etapa 2B) |
| 24 | Gráfico SVG próprio e ícones SVG inline (sem Recharts nem Lucide) | Implementada (Etapa 3B); adoção futura proposta |
| 25 | Polling pausado com a aba oculta, em vez de Realtime | Implementada (Etapa 3B) |
| 26 | Conectividade provisória parametrizada em `utils/connectivity.js` | Implementada (Etapa 3B); regra **provisória** |
| 27 | Limite de consulta (`HISTORY_LIMIT + 1`) com aviso de truncamento, em vez de função de agregação | Implementada (Etapa 3B); agregação pendente |
| 28 | Separação `readingsApi` / `readingsService` | Implementada (Etapa 3B) |
| 29 | `node:test` nativo como executor de testes | Implementada (Etapa 3B) |
| 30 | Lacunas de tempo no gráfico (`maxGapMs` = limiar de offline) | Implementada (Etapa 3B) |
| 31 | Manter os avisos `set-state-in-effect` dos hooks de leitura | Aceita como trade-off (Etapa 3B) |


## 20–22. Área administrativa (Etapa 2B)

- **Sessão:** o `supabase-js` renova o token automaticamente. Se a renovação falhar, ele emite `SIGNED_OUT`; quando isso acontece sem logout manual, a interface informa "sessão expirada". Erros de token vencido vindos do banco (`PGRST301`/`PGRST303`) também encerram a sessão.
- **Conta sem papel admin:** é recusada no login e a sessão é encerrada na hora.
- **UPDATE e DELETE bloqueados pelo RLS:** o banco não retorna erro, apenas 0 linhas afetadas. A camada `services/` trata esse caso como falta de permissão.
- **Exclusão:** antes de excluir, a interface conta as leituras do ponto e, se houver alguma, oferece desativar. O banco continua sendo a barreira final (FK `ON DELETE RESTRICT` → mensagem traduzida).
- **Bibliotecas avaliadas e não adotadas:**
  - React Hook Form: o formulário tem só 8 campos.
  - Zod: a validação ficou em `utils/stopValidation.js`; Zod pode voltar a ser avaliado para compartilhar esquema com a futura Edge Function.
  - TanStack Query: a lista é atualizada com a linha devolvida pelo banco, sem recarregar tudo. Faz sentido reavaliar quando houver atualização periódica de leituras.

## 17–19. Fechamento da Etapa 2A

Detalhes, SQL e resultados dos testes em [security-review.md](security-review.md#2-fechamento-da-etapa-2a--correções-não-aplicadas-no-remoto).

## 6. Duas tabelas: `stops` e `readings`

Leituras referenciam pontos por `stop_id` com `ON DELETE RESTRICT`: um ponto com histórico não pode ser apagado, apenas desativado (`active = false`). Assim o histórico é preservado e não há perda acidental de dados.

## 7. Campo `is_demo` em `stops`

Marca no próprio banco os pontos fictícios, de forma que a interface possa sinalizá-los sem depender do nome.

## 8. Restrições como `CHECK` em vez de `ENUM`

`environmental_status` e `source` são texto com `CHECK`. Para mudar a lista de valores basta recriar a restrição, o que é mais simples que alterar um tipo `ENUM`.

## 9. Faixas de plausibilidade, não limites ambientais

O banco rejeita apenas valores fisicamente impossíveis para o sensor previsto (DHT22: −40 a 80 °C, 0 a 100 %). Os limites de "atenção" e "crítico" ainda não foram aprovados e por isso não estão no banco.

## 10. Conectividade calculada, não armazenada

O estado online/atrasado/offline depende da idade da última leitura e muda com o passar do tempo, mesmo sem dados novos. Por isso é calculado na hora da leitura (view `stop_latest_readings` + regra no front-end), e não gravado. A regra 2×/5× do intervalo de envio é provisória até o Thiago definir o intervalo.

## 11. Administradores via `app_metadata.role = 'admin'`

- Contas administrativas são criadas manualmente no painel do Supabase, e o cadastro público fica desabilitado.
- O papel fica em `app_metadata`, que só pode ser alterado com credencial de servidor; o usuário não consegue se promover.
- As políticas usam `private.is_admin()`, que fica em um schema não exposto pela API.

## 12. Grants explícitos + RLS (defesa em profundidade)

As permissões de tabela são revogadas e depois concedidas explicitamente: visitantes têm apenas `SELECT`; `authenticated` pode escrever em `stops`, com o RLS restringindo a admins; nenhum papel do navegador pode escrever em `readings`. Ver também a proposta sobre privilégios padrão em [security-review.md](security-review.md#21-privilégios-padrão-do-schema-public-risco-latente--correção-proposta).

## 13. Ingestão de leituras por Edge Function (direção aprovada — a implementar)

> Decisões registradas e detalhes de implementação (hash, schema privado, `verify_jwt = false` no gateway) em [security-review.md, seção 4](security-review.md#4-estratégia-de-autenticação-dos-dispositivos-aprovada-como-direção-não-implementada). O texto abaixo é a proposta original; onde houver diferença, vale a seção 4 da revisão de segurança, que guarda as credenciais em schema privado e não em `public.devices`.

**Requisitos:** nenhuma escrita pública; nenhum segredo em projeto Wokwi público; viável para um protótipo acadêmico.

**Proposta recomendada: token por dispositivo, de escopo mínimo e revogável.**

1. Nova tabela `devices` (migração futura): `id`, `code`, `stop_id`, `token_hash` (SHA-256), `allowed_source`, `active`, `last_seen_at`. O RLS fica habilitado **sem políticas** e sem grants para `anon`/`authenticated`: só o servidor acessa.
2. O admin gera, para cada dispositivo, um token aleatório de 32 bytes. Ele é exibido uma única vez; o banco guarda só o hash.
3. A Edge Function `ingest-reading` recebe `Authorization: Bearer <token>` e então:
   - procura o dispositivo ativo pelo hash do token (resposta `401` se não encontrar);
   - exige que `stop_code` seja o ponto do dispositivo (`403` se não for);
   - valida faixas, `measured_at`, e se `environmental_status` está coerente com a `rules_version` (`422` se não estiver);
   - **força** `source = allowed_source` (dispositivos Wokwi só gravam `simulation`);
   - recusa envios mais frequentes que o intervalo combinado (`429`);
   - grava a leitura com credencial de servidor e atualiza `last_seen_at`.
4. **Wokwi:** o token nunca vai para um projeto público. Há dois modos:
   - **Projeto privado** (uso da equipe): o token fica num arquivo `secrets.h` do projeto privado e nunca é versionado no Git.
   - **Projeto público** (demonstração): firmware com token vazio, funcionando em modo local. Ele classifica, aciona os alertas locais e imprime o JSON no Serial, sem enviar.
5. **Se um token vazar**, o impacto fica limitado a leituras `simulation` de **um** ponto, com limite de frequência. Basta desativar o dispositivo ou gerar um token novo.

**Alternativas consideradas:**

- *Chave publishable + política de INSERT no RLS:* descartada, pois equivale a escrita pública.
- *`x-device-key` compartilhada por todos os dispositivos:* mais simples, mas um vazamento afeta todos os pontos e não há como identificar qual dispositivo enviou.
- *ESP32 → MQTT público → ponte em Python → banco:* tira o segredo do dispositivo, mas exige um processo sempre ligado, o tópico público aceita mensagens falsas e cria uma dependência de outro serviço.

## 14. Fallback local apenas sem configuração

> **Substituída pela decisão 35** (modos de dados). O texto abaixo é o histórico.

Sem as variáveis `VITE_SUPABASE_*`, a aplicação usa dados demonstrativos locais, útil para quem só quer rodar a interface. Com o Supabase configurado, falhas aparecem como erro, sem troca silenciosa para dados locais.

## 15. Classificação ambiental no ESP32

O dispositivo classifica localmente, então os alertas funcionam sem rede. O backend aplica as mesmas regras (versionadas) para validar e armazenar. As análises em Python são complementares.

## 16. Identificação por `stop_code`

O firmware é configurado com o código legível do ponto (ex.: `DEMO-01`), não com o UUID.

## 24–31. Dashboard e Histórico (Etapa 3B)

### 24. Gráfico SVG próprio e ícones SVG inline
> **Superada na 3C pelas decisões 32 e 34:** Recharts e lucide-react foram adotados e `chartGeometry.js` deixou de existir. Texto mantido como histórico.

- **Decisão:** `ReadingsChart` desenha o SVG a partir de `utils/chartGeometry.js` (puro e testado); os ícones ficam em `components/ui/icons.jsx`. Nenhuma dependência foi instalada.
- **Alternativas:** Recharts e Lucide React (propostos em `etapa-3-proposta.md`).
- **Trade-off:** menos recursos (sem tooltip rico nem zoom), mas bundle menor, controle da alternativa textual e nenhuma dependência nova sem decisão.
- **Proposta objetiva de adoção futura (nada instalado):**
  - *Necessidade:* só se surgirem tooltip, zoom, várias séries ou eixos complexos.
  - *Recharts:* licença MIT; cerca de 90–100 kB gzip (estimativa da proposta, não medida); carregar com `React.lazy` apenas na página Histórico.
  - *Lucide React:* licença ISC; *tree-shaking* (só os ícones usados entram); só se o conjunto de ícones inline crescer.
  - Registrar a justificativa final aqui **antes** de instalar.

### 25. Polling pausado vs Realtime
- **Decisão:** `useLatestReadings` consulta periodicamente (padrão `SEND_INTERVAL_MS`) e pausa com `document.hidden`; `useNow` também não atualiza com a aba oculta.
- **Alternativa:** Realtime do Supabase.
- **Trade-off:** latência de até um intervalo e mais requisições, mas sem configuração extra de publicação/RLS no Realtime e com comportamento simples de testar. Realtime fica como evolução.

### 26. Conectividade provisória parametrizada
- **Decisão:** `utils/connectivity.js` concentra `SEND_INTERVAL_MS` (60 s), `ONLINE_FACTOR` (2), `OFFLINE_FACTOR` (5) e `CLOCK_TOLERANCE_MS`; o instante atual é sempre parâmetro.
- **Trade-off:** valores provisórios até o Thiago definir o intervalo de envio; trocá-los é mudar constantes. Conectividade é dimensão separada do estado ambiental, e "Sem dados" difere de "Não classificado". Sem limites aprovados, o front não calcula estado ambiental (por isso não existe `environmentalRules.js`).

### 27. Limite de consulta vs função de agregação
- **Decisão:** o histórico pede `HISTORY_LIMIT + 1` (501) registros; se vier o excedente, mostra 500 e avisa o truncamento.
- **Alternativa:** função SQL de médias por hora.
- **Trade-off:** sem migração e sem `GRANT` novo, porém períodos longos podem ser truncados. A agregação exige migração (aprovação e teste local) e fica pendente.

### 28. `readingsApi` / `readingsService`
- `readingsApi.js` recebe o cliente como parâmetro e contém as consultas; `readingsService.js` é uma fachada fina que injeta o cliente Supabase. Assim `readingsApi` é testável no Node com cliente falso, sem rede e sem `import.meta.env`.

### 29. `node:test` nativo
- **Decisão:** testes `*.test.js` ao lado do código, executados com `cd web && node --test`.
- **Alternativa:** Vitest/Jest (dependência nova, não aprovada).
- **Trade-off:** sem testes de componentes React nem jsdom; a interface depende de validação em navegador (pendente). Não há script no `package.json` (arquivo fora do escopo da etapa).

### 30. Lacunas no gráfico
> **Substituída na 3C pela decisão 34:** o agrupamento por intervalos (`chartSeries`) substitui o `maxGapMs`.

- Intervalo entre leituras maior que `maxGapMs` (padrão: limiar de offline) quebra a linha, para não sugerir continuidade onde o sensor ficou sem enviar. Um trecho de um só ponto vira marcador.

### 31. Avisos `set-state-in-effect`
- `useLatestReadings` e `useReadingsHistory` marcam o início do carregamento dentro do efeito, e o `oxlint` emite 2 avisos (0 erros).
- **Alternativas:** derivar o estado durante a renderização ou usar biblioteca de dados (TanStack Query).
- **Trade-off:** mantidos por serem simples e corretos; refatorar aumentaria a complexidade sem ganho de comportamento.

## 32. Etapa 3C — dependências de interface
Autorizadas explicitamente pelo usuário no objetivo G-20261112-bf4e8c. Licenças conferidas nos `package.json` instalados: `class-variance-authority` Apache-2.0, `lucide-react` ISC e as demais MIT (todas permissivas). Mantidas ativamente e com tree-shaking (só o importado entra no bundle). Tamanhos são aproximados (gzip, apenas o usado).

| Pacote | Necessidade concreta | Tamanho aprox. | Alternativa descartada |
|---|---|---|---|
| `lucide-react` (ISC) | Ícones consistentes com tree-shaking; substitui `icons.jsx` | ~0,5 KB por ícone | Manter SVGs inline escritos à mão (inconsistentes e custosos de ampliar) |
| `motion` (MIT) | Animações declarativas de entrada/transição, com `MotionConfig reducedMotion="user"` e `useReducedMotion` | ~5–20 KB (uso por `m`/`LazyMotion` reduz) | Só CSS: sem orquestração de entrada/saída |
| `recharts` (MIT) | Gráficos com eixos, tooltip, gradiente e camada de acessibilidade por teclado | ~90–110 KB (o maior; carregado só nas rotas com gráfico, Dashboard e Histórico, via `React.lazy`; ver decisão 34) | SVG próprio (`chartGeometry`/`chartSeries`): mais código a manter, sem tooltip/teclado prontos |
| `clsx` + `tailwind-merge` (MIT) | Helper único `cn()` de composição de classes sem conflitos Tailwind | ~0,3 KB + ~7 KB | Concatenação manual de strings |
| `class-variance-authority` (Apache-2.0) | Variantes tipadas de Card/Badge/Button | ~1 KB | Objetos de classes ad hoc por componente |

**Não entram:**
- `date-fns`: `Intl.DateTimeFormat` já resolve fuso e pt-BR.
- `sonner`: não há ações com toast no escopo.
- Radix/shadcn CLI: o CLI exige rede; controles nativos acessíveis bastam; componentes próprios no estilo shadcn, com `cva`.
- Fontes web: pilha de fontes do sistema (sem requisições externas, sem layout shift).

**Resultado da instalação (2026-11-12): CONCLUÍDA, sem fallback.** Instalação feita pelo Dependency Manager do harness (tarefa T2), com o npm isolado e sem scripts de instalação. Versões resolvidas: `lucide-react` 1.72.0, `motion` 14.13.0, `recharts` 3.10.1, `clsx` 2.1.1, `tailwind-merge` 3.7.0, `class-variance-authority` 0.7.1. O lockfile foi verificado: todos os pacotes vêm do registro npm (`registry.npmjs.org`) com integridade sha512. `npm run lint` e `npm run build` passam após a instalação.

O fallback sem dependências (ícones SVG inline, movimento só por CSS, gráfico SVG próprio, `cn()` simples) foi descartado e não é decisão vigente.

## 33. Design system: tokens, `cva` e `cn()`
- **Decisão:** tokens de design (cores, estados, sombras, raios) no `@theme` de `styles/index.css`; `utils/cn.js` combina `clsx` + `tailwind-merge`; variantes de Button, Badge e Card com `class-variance-authority`; apresentação de estados (tons) centralizada em `utils/statusTones.js` e `components/ui/tones.js`. Ícones via `lucide-react`.
- **Alternativas:** classes ad hoc por componente; copiar componentes shadcn/Radix (descartado, ver decisão 32).
- **Trade-off:** mais três pacotes pequenos em troca de consistência e menos conflito de classes Tailwind. O estado nunca depende só de cor: os selos combinam ícone, texto e cor.
- **Movimento:** `<MotionConfig reducedMotion="user">` em `App.jsx` faz as animações do `motion` respeitarem `prefers-reduced-motion` do sistema; variantes ficam em `components/ui/motion.js`. Não verificado em navegador.
- **Pendência:** `components/ui/icons.jsx` segue como camada sobre lucide-react; os consumidores devem migrar para importar direto.

## 34. Gráficos: Recharts e agrupamento por intervalos
- **Decisão:** `components/charts/SeriesChart.jsx` usa Recharts; `utils/chartSeries.js` (puro, testado) agrega as leituras em intervalos fixos por período (`CHART_BUCKET_MS`: 24 h = 30 min, 7 dias = 3 h, 30 dias = 12 h) e calcula o domínio do eixo Y com folga. Intervalos sem leitura ficam vazios e quebram a linha. Isso **substitui** o `maxGapMs` e o `chartGeometry.js` da decisão 30.
- **Alternativa:** manter o SVG próprio (mais código a manter, sem tooltip/teclado prontos).
- **Carregamento sob demanda:** `App.jsx` carrega `DashboardPage` e `HistoryPage` (além das páginas administrativas) com `React.lazy` dentro de um único `Suspense` com `Skeleton` acessível. O Recharts sai do bundle inicial e vai para um chunk compartilhado pelas duas rotas; `/pontos` e a página 404 não o baixam. Como a rota inicial `/` é o Dashboard, que também tem gráfico, a primeira visita ao Dashboard continua baixando o Recharts (em um segundo passo); o ganho real é em `/pontos`, `/admin` e na divisão do cache.
- **Trade-off:** o bundle total cresceu (ver abaixo), e há um pequeno atraso (esqueleto) na primeira navegação a cada rota com gráfico.

## 35. Abstração de fonte de dados e dataset mock determinístico
- **Decisão:** `services/dataSource.js` é o único ponto que lê `import.meta.env` (`VITE_DATA_MODE`) e instancia a fonte via `dataSourceFactory.js`; hooks e serviços consomem `readingsApi` e `stopsApi` sem saber a origem. **Em produção, defina `VITE_DATA_MODE=supabase`** (ver `docs/deploy.md`): sem isso o padrão `auto` escolheria o mock se as chaves faltarem; com `supabase`, a falta de configuração vira erro claro (`unconfigured`). A resolução do modo é função pura em `utils/dataMode.js` (`mock`, `supabase`, `auto`; padrão `auto`).
- **Sem fallback para mock:** `supabase` sem configuração vira o modo efetivo `unconfigured`, em que toda operação rejeita com erro explícito; erro do Supabase nunca cai para o mock; só `auto` escolhe o mock, e por falta de configuração. O modo efetivo é sinalizado de forma persistente na interface. Esta decisão **substitui a 14**.
- **Mock determinístico:** `data/mock/mockDataset.js` gera 8 cenários por funções puras (semente `20261112`, PRNG mulberry32, instante "agora" como parâmetro), com as mesmas colunas das tabelas reais para passar pelos mesmos normalizadores. O `environmental_status` é valor fixo da fixture, porque o front não classifica. `?mock=erro` e `?mock=lento` simulam falha e latência, e só valem no modo mock.
- **Trade-off:** sem aleatoriedade global os mesmos dados reaparecem a cada execução, o que facilita testar, mas não substitui medições reais. Os dados são sempre sinalizados como fictícios.

## 36. Autenticação demonstrativa e escritas em memória no modo mock
- **Decisão:** no modo `mock`, `dataSourceFactory.js` entrega uma `authApi` demonstrativa (`mockAuthApi.js`) com duas contas fictícias (administrador e leitor sem papel administrativo), sessão só na memória da instância (sem `localStorage`/`sessionStorage`), e o mock de pontos (`mockReadingsApi.js`) passa a aceitar criar, editar, ativar/desativar e excluir pontos, também só em memória (o dataset nunca é mutado; recarregar a página restaura os dados). As regras do banco são reproduzidas: código duplicado, exclusão de ponto com leituras e entrada inválida geram os mesmos `AppError` do Supabase. A autenticação do Supabase foi movida para `supabaseAuthApi.js`; `authService.js` virou fachada sobre `authApi`, e `adminAuth.js` concentra a regra "só administrador entra". No modo `supabase` a auth é sempre o Supabase (credenciais demo são recusadas por ele) e em `unconfigured` é indisponível. O modo mock nunca usa o Supabase, mesmo configurado, e `?mock=erro`/`?mock=lento` não afetam a auth.
- **Substitui:** a regra "escritas indisponíveis no modo demonstração" (mock de pontos que rejeitava com `unavailable`, vigente desde a decisão 35) e o status `unavailable` da autenticação sem Supabase quando o modo é mock.
- **Alternativas descartadas:** manter as escritas indisponíveis (impede percorrer a área administrativa sem Supabase); `sessionStorage`/`localStorage` (persistiria credenciais e estado fictícios entre visitas e mistura com a sessão real do supabase-js); Supabase local no E2E (exige Docker no gate); interceptar a rede no Playwright (acopla os testes ao formato das requisições).
- **Trade-offs e riscos:** um build com `VITE_DATA_MODE=mock` expõe o login demonstrativo e suas credenciais no bundle. Mitigação: os dados existem só em memória, as credenciais são fictícias e inertes fora do mock (o Supabase as recusa), e a produção usa `VITE_DATA_MODE=supabase`. O modo `auto` sem configuração do Supabase também cai no mock e, portanto, também habilita o login demonstrativo. Em contrapartida, as alterações somem ao recarregar a página.

## 37. Busca, filtros condicionados aos dados e insights deterministas
- **Decisão:** a busca (nome, código ou bairro, sem diferenciar acentos nem caixa) e os filtros ficam em funções puras (`utils/stopFilters.js`) com estado em `hooks/useStopFilters.js`. Cada filtro só aparece quando os dados têm **pelo menos 2 valores distintos** e só oferece valores presentes, com contagem (ex.: "Normal (5)"). O Dashboard filtra por estado ambiental e conectividade; **Pontos só filtra por busca e bairro**, porque a página carrega apenas pontos, sem leituras: oferecer estado ambiental ou conectividade ali exigiria carregar leituras ou inventar um estado. Os filtros afetam só a lista "Pontos monitorados": Resumo, Última medição, Evolução recente e Insights continuam sobre todos os pontos.
- **Insights deterministas** (`utils/dashboardInsights.js`): mesma entrada produz a mesma saída, com o instante recebido como parâmetro. Mostram a distribuição do estado ambiental **gravado**, maior e menor temperatura e umidade entre pontos (empate pelo menor código), pontos offline ou sem dados (regra de conectividade existente) e contagem de leituras que não são de sensor. **Não criam limiares novos nem derivam estado ambiental** de temperatura ou umidade; cada insight traz "Como foi calculado" e a fonte dos dados é sinalizada.
- **Alternativas descartadas:** mostrar filtros com um único valor (controle que não filtra nada); filtrar Pontos por estado/conectividade (exigiria leituras); insights com limiares ou "alertas" próprios (o front-end não classifica; limites ambientais aguardam aprovação); biblioteca de busca difusa (sem justificativa para 8 pontos).
- **Trade-offs:** os insights sempre ignoram os filtros, o que evita números que mudam ao buscar, mas não respondem a um recorte. A regra de visibilidade (`shouldShowFilter`, em `utils/stopFilters.js`) é função pura coberta por testes unitários, não por E2E (o dataset mock sempre tem vários valores). Um filtro com valor ativo continua visível mesmo com menos de 2 valores, e valor selecionado que some das opções (a conectividade muda com o tempo) deixa de filtrar (`resolveActiveFilters`, derivado no hook, sem efeito), para nunca haver filtro aplicado sem controle correspondente.
- **CSS global:** com `prefers-reduced-motion: reduce`, `index.css` aplica `transition-property: none !important` a todos os elementos (commit `c6a4867`, ajuste exigido pelo E2E). Não há `transitionend` no código e o motion/react anima via JS; o efeito visível é que cores de hover e foco mudam instantaneamente.

## 38. Premium 3.0: Bento, vidro restrito, tema por prefers-color-scheme e sparklines com dados carregados
- **Bento:** no Dashboard, `Section`s são filhas diretas de uma grade de 12 colunas (`lg:grid-cols-12`: 7+5 e 8+4, nota de conectividade em largura total) e a **ordem do DOM é a ordem visual**, o que preserva a ordem de leitura e de tabulação. Descartado: reordenar com `order`/posicionamento explícito na grade (desalinha foco e leitor de tela do que se vê).
- **Vidro restrito:** `surface-glass` e `glass-control` (translúcido com `backdrop-filter`) só em navegação e controles, com fallback opaco por `@supports not`. Descartado: vidro em cartões de conteúdo, por custo de desempenho e por prejudicar a legibilidade e o contraste.
- **Tema escuro:** automático por `prefers-color-scheme`. O CSS remapeia os tokens `surface*` e a escala `slate` (fora de `@theme`/`@layer`, para vencer a camada do Tailwind), e marca/estado recebem variantes `dark:` locais. Descartados: seletor manual com persistência (fora de escopo; fica como pendência) e `dark:` em todos os arquivos (inviável sem alterar a autenticação, que não faz parte do objetivo).
- **Sparklines:** só com séries já carregadas pelo Histórico/Evolução, via função pura `utils/sparkline.js` (sem interpolação; valores ausentes quebram o trecho; menos de 2 valores não renderiza), com `aria-label` e o último valor também em texto. Sem nova consulta. Descartado: histórico por ponto nos cartões do Dashboard (uma consulta por ponto).
- **Dependências:** nenhuma nova.
- **Trade-offs:** o tema segue o sistema e não há como forçá-lo; o remapeamento de `slate` afeta qualquer uso da escala, então textos que usam `slate` como cor fixa precisam de conferência visual no escuro (gate 0015: axe nos dois temas sem violações; conferência visual de 4 capturas em `docs/revisao-visual-frontend.md`).

## Resultado da 3C (fatos medidos em 2026-11-12)
- `npm run build` conclui sem aviso de chunk acima de 500 kB (após o `React.lazy` de Dashboard e Histórico). Medido: `index` 224,53 kB (71,31 kB gzip); chunk compartilhado com o Recharts (`StopSelect-*`) 380,62 kB (111,40 kB gzip); `useStops` 152,91 kB (51,96 kB gzip); `useDocumentTitle` 47,01 kB; `stopsService` 30,27 kB; `components` 29,81 kB; `DashboardPage` 18,29 kB; `AdminStopsPage` 14,50 kB; `HistoryPage` 10,60 kB; `AdminLoginPage` 1,83 kB. Antes do `lazy`, o chunk único era 893,94 kB (276,54 kB gzip). CSS: 42,96 kB (8,29 kB gzip). O tamanho da 3B era 321,08 kB (101,14 kB gzip). CSS: 42,96 kB (8,29 kB gzip). O tamanho anterior da 3B era 321,08 kB (101,14 kB gzip), então a 3C custou cerca de 573 kB (175 kB gzip) no bundle principal; a estimativa da decisão 32 (~90–110 kB gzip só para Recharts) é plausível dentro desse aumento, mas não foi medida por pacote.
- `npm run lint`: 0 erros e 2 avisos `set-state-in-effect` (decisão 31).
- Testes: 204 aprovados, 0 falhas (executados listando os arquivos `*.test.js`).

### Limitações conhecidas
- O botão "Tentar novamente" do erro de pontos no Dashboard recarrega a página (`window.location.reload()`) e o da página Pontos remonta o componente por `key`, porque `useStops` não expõe uma função de nova tentativa.
- O selo "Sem sensor vinculado" foi removido do card de Pontos.
- Sem testes de componentes. Nada da interface 3C foi renderizado em navegador: largura de 375 px, contraste AA, axe-core, hierarquia h1/h2/h3 e o offset `sm:top-20` (estimado) da barra de filtros fixa do Histórico estão por conferir (aceite humano).
- `node --test` com uma pasta como argumento falha ao carregar; sem argumento ou listando arquivos funciona.
