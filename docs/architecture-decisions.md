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

Sem as variáveis `VITE_SUPABASE_*`, a aplicação usa dados demonstrativos locais, útil para quem só quer rodar a interface. Com o Supabase configurado, falhas aparecem como erro, sem troca silenciosa para dados locais.

## 15. Classificação ambiental no ESP32

O dispositivo classifica localmente, então os alertas funcionam sem rede. O backend aplica as mesmas regras (versionadas) para validar e armazenar. As análises em Python são complementares.

## 16. Identificação por `stop_code`

O firmware é configurado com o código legível do ponto (ex.: `DEMO-01`), não com o UUID.

## 24–31. Dashboard e Histórico (Etapa 3B)

### 24. Gráfico SVG próprio e ícones SVG inline
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
- Intervalo entre leituras maior que `maxGapMs` (padrão: limiar de offline) quebra a linha, para não sugerir continuidade onde o sensor ficou sem enviar. Um trecho de um só ponto vira marcador.

### 31. Avisos `set-state-in-effect`
- `useLatestReadings` e `useReadingsHistory` marcam o início do carregamento dentro do efeito, e o `oxlint` emite 2 avisos (0 erros).
- **Alternativas:** derivar o estado durante a renderização ou usar biblioteca de dados (TanStack Query).
- **Trade-off:** mantidos por serem simples e corretos; refatorar aumentaria a complexidade sem ganho de comportamento.

### Limitações conhecidas
- O botão "Tentar novamente" do erro de pontos no Dashboard recarrega a página (`window.location.reload()`), porque `useStops` não expõe uma função de nova tentativa.
- Sem testes de componentes e sem validação visual/Supabase nesta etapa (aceite humano pendente).
