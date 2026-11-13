# Uso de Inteligência Artificial

Este documento registra, de forma transparente, como ferramentas de IA foram utilizadas no desenvolvimento do front-end do ClimaPonto. Ele é atualizado a cada etapa.

## Ferramentas

| Ferramenta | Papel no projeto |
| --- | --- |
| **ChatGPT** (OpenAI) | Planejamento da arquitetura, priorização dos requisitos, redação das instruções de cada etapa e revisão técnica das entregas. |
| **Claude Code** (Anthropic, modelo Claude Opus 5.5), na extensão do VS Code | Execução das tarefas de implementação definidas no planejamento: comandos de terminal, criação e edição de arquivos e execução das verificações. |

O integrante responsável (Enrico) conduz o processo: repassa as instruções, revisa os resultados e decide o que é aprovado.

## Registro por etapa

### Etapa 1 — Fundação do front-end (09/11/2026)

**Planejamento (ChatGPT):** elaborou o documento de instruções da Etapa 1, contendo contexto do projeto, requisitos da disciplina, stack aprovada (React + Vite, JavaScript, Tailwind CSS, npm), escopo da etapa e critérios de qualidade.

**Execução (Claude Code):** recebeu esse documento e realizou:

1. Diagnóstico do ambiente: pasta vazia, sem repositório Git; Node.js 24.18.1 e npm 11.16.0.
2. Inicialização do repositório Git na raiz (branch `main`).
3. Criação da aplicação em `web/` com `npm create vite@latest` (template `react`, create-vite 9.3.4).
4. Instalação do Tailwind CSS 4 com o plugin oficial `@tailwindcss/vite` e do React Router.
5. Remoção dos arquivos de exemplo do template e criação da estrutura de pastas (componentes, páginas, hooks, serviços, dados demonstrativos, estilos).
6. Implementação da interface inicial: cabeçalho, navegação (Dashboard, Pontos, Histórico), layout responsivo, aviso de dados demonstrativos e páginas provisórias.
7. Escrita do README.md, deste AI.md e do `.gitignore`.
8. Verificações executadas: `npm run build` (sucesso), `npm run lint` (sem erros ou avisos) e inicialização do servidor de desenvolvimento, conferindo que as rotas `/`, `/pontos` e `/historico` respondem com HTTP 200 e que o CSS do Tailwind é gerado.

**Limites das verificações:** a renderização visual não foi inspecionada em navegador pela IA; não existem testes automatizados nesta etapa.

**Revisão técnica (ChatGPT):** aprovou preliminarmente a fundação e decidiu manter React Router e Oxlint, sem novas bibliotecas, solicitando verificação visual em navegador real antes do primeiro commit.

**Verificação visual (Claude Code):** a aplicação foi aberta no Google Chrome em modo headless, controlado por um script Node.js temporário via Chrome DevTools Protocol (fora do repositório, sem dependências novas). Foram capturadas as páginas Dashboard, Pontos, Histórico e 404 em 1366×900 (desktop) e 375×812 (mobile emulado). Resultados:

- Sem rolagem horizontal em nenhuma página (largura do conteúdo igual à da janela).
- Item ativo da navegação e título da aba corretos em cada rota.
- O primeiro Tab foca o link "Pular para o conteúdo".
- Problema encontrado e corrigido: o rótulo "Sem sensor vinculado" usava cinza claro (`slate-400`, contraste ≈ 2,6:1, abaixo do mínimo WCAG AA de 4,5:1); foi alterado para `slate-500` (≈ 4,8:1).

Não foram testados leitores de tela, navegadores além do Chrome, nem dispositivos móveis físicos.

### Etapa 2A — GitHub, Supabase e contrato de dados (09/11/2026)

**Planejamento (ChatGPT):** definiu os objetivos da etapa (repositório privado, Supabase como backend, modelo das tabelas `stops` e `readings`, modelo de segurança visitante/administrador, contrato de dados) e as restrições (sem CRUD visual, sem credenciais no front-end, sem leituras inventadas).

**Decisões do integrante (Enrico)**, consultado pelo Claude Code durante a execução:

- Autorizou instalar o GitHub CLI e criar o projeto Supabase `climaponto-gs-2026` (região `sa-east-1`) pela integração do Supabase conectada ao Claude.
- Autorizou executar os testes SQL de RLS no banco.

**Execução (Claude Code):**

1. Consultou a documentação oficial do Supabase (ferramenta de busca de docs da integração) sobre chaves *publishable*, grants da Data API e boas práticas de RLS.
2. Criou o projeto Supabase e aplicou duas migrações: esquema (tabelas, restrições, índices, trigger de `updated_at`, view de última leitura) e segurança (grants explícitos, RLS, função `private.is_admin()`).
3. Inseriu 3 pontos demonstrativos (`DEMO-01` a `DEMO-03`), sem endereços reais nem leituras.
4. Consultou os *advisors* do Supabase: nenhum alerta de segurança; apenas o aviso informativo de índice ainda não usado (esperado, tabela vazia).
5. Integrou o front-end com `@supabase/supabase-js` (cliente, serviço de pontos, indicação de fonte de dados) mantendo fallback local quando não há configuração.
6. Criou `npm run check:supabase`, que testa pela API real o acesso de visitante.
7. Escreveu `docs/data-contract.md`, `docs/architecture-decisions.md` e atualizou o README.
8. Instalou o GitHub CLI: a tentativa via `winget` travou sem exibir a janela de permissão e foi cancelada; foi usado o pacote portátil oficial (v2.103.3), com SHA-256 conferido.

**Verificações realmente executadas:**

- `npm run check:supabase` contra o banco real: **8/8** — visitante lê pontos ativos e consulta leituras/view; criar, editar e excluir pontos e inserir leituras foram negados (`42501`).
- `npm run build` e `npm run lint`: sem erros.
- Captura de tela (Chrome headless, desktop e mobile) das páginas Dashboard e Pontos exibindo os 3 pontos lidos do Supabase.

**Não executado:**

- `supabase/tests/rls_policies.test.sql` (perfis usuário comum e administrador, restrições de validação): a execução pela integração MCP do Supabase foi recusada duas vezes pela própria ferramenta, mesmo após autorização do integrante, possivelmente por conter `UPDATE`/`DELETE` (ainda que dentro de `ROLLBACK`). Deve ser executado manualmente no SQL Editor.
- Login real de administrador: nenhuma conta foi criada.

### Finalização da Etapa 2A — revisão de segurança (09/11/2026)

**Revisão técnica (ChatGPT):** aprovou parcialmente a Etapa 2A. Aprovou `is_demo`, admins via `app_metadata`, bloqueio de exclusão de pontos com leituras, desativação com histórico, identificação por `stop_code` e conectividade separada do estado ambiental. Decidiu que a classificação ambiental ocorre no ESP32, com validação no backend. Não aprovou ainda a autenticação por `x-device-key` e pediu revisão de segurança. Pediu também que os testes SQL não fossem executados no banco remoto sem nova autorização.

**Execução (Claude Code):**

- GitHub: o `gh` continuava sem login, sem credenciais do GitHub na máquina. Repositório **não** criado e push **não** realizado.
- Revisão de segurança feita só com consultas de leitura (catálogo do Postgres, *Security Advisor*), busca de segredos em todo o histórico Git e no build. Resultado em `docs/security-review.md`: sem falhas ativas; um risco latente (privilégios padrão do schema `public`), com correção proposta e **não aplicada**.
- Ajuste em `supabase/tests/rls_policies.test.sql`: o teste passou a criar seus próprios pontos (`TEST-ACTIVE`) em vez de usar o `DEMO-01` real. **O teste não foi executado.**
- Proposta de ingestão segura (token por dispositivo) e atualização do contrato de dados com as decisões aprovadas.

### Fechamento técnico e de segurança da Etapa 2A (09/11/2026)

**Revisão técnica (ChatGPT):** autorizou testes com Supabase CLI + Docker apenas localmente, com proibição explícita de qualquer operação no remoto. Aprovou três correções (privilégios padrão, proteção de `created_at`, leituras `test` privadas) e a direção da credencial por dispositivo, sem implementação.

**Decisões do integrante (Enrico):** diante do Docker sem WSL, pediu para seguir das duas formas: instalar o necessário para o Docker e testar já com uma alternativa local. Aprovou a janela de administrador do Windows para instalar o WSL.

**Execução (Claude Code):**

1. Docker Desktop não iniciava: diagnóstico apontou WSL ausente. O WSL 3.0.3 foi instalado (`wsl --install --no-distribution`, com elevação), mas exige **reinicialização do Windows**, não realizada. Por isso o teste com Supabase CLI + Docker **não foi executado**.
2. `supabase init` (CLI 2.122.0 via `npx`) criou `supabase/config.toml`, ajustado para `project_id = "climaponto-local"`, cadastro público desativado e `site_url` do Vite. Nenhum `supabase link` foi feito.
3. Consultou a documentação do Supabase (*Securing your API*, *Function Configuration*).
4. Criou três migrações e reescreveu `rls_policies.test.sql` (50 verificações, separando leituras `simulation` públicas de `test` privadas).
5. Testou em **PostgreSQL 17.10 embarcado** (pacote `embedded-postgres`, fora do repositório), com um *bootstrap* que emula papéis, `auth.jwt()` e privilégios padrão do Supabase.
   - Primeira execução: 44/50. Duas causas: um erro no próprio teste (literal interpretado como array), corrigido sem mudar expectativas; e um erro real na migração (revogação de `EXECUTE` de `PUBLIC` por schema não tem efeito no PostgreSQL), corrigido com revogação global.
   - Resultado final: **50/50** com todas as migrações; **34/50** só com as migrações já aplicadas no remoto, sendo as 16 falhas exatamente os pontos corrigidos.
6. Documentou a estratégia de credenciais de dispositivos, incluindo `verify_jwt = false` no gateway e a validação no código da função.
7. GitHub: `gh` continua sem login; nada publicado.

**Nada foi aplicado no banco remoto nesta etapa** (nenhuma migração, nenhuma alteração de dados).

### Publicação no GitHub e validação no Supabase local (09/11/2026)

**Pedido do integrante (Enrico):** investigar acessos ao GitHub já existentes antes de pedir login, sem exibir credenciais, e depois validar o Supabase local após a reinicialização do Windows.

**Execução (Claude Code):**

1. GitHub: o Git Credential Manager já tinha a conta `EnricoVidal` (usada pelo `git` nos outros projetos); o GitHub CLI não tinha login próprio.
   - Uma tentativa de extrair a credencial por arquivo temporário foi **bloqueada** pelo classificador de segurança do Claude Code, e não houve tentativa de contorno.
   - O integrante escolheu liberar o uso. A credencial foi repassada ao `gh` só em memória, no mesmo processo, sem exibição nem gravação em disco.
   - Antes de publicar, nova busca de segredos em todo o histórico: nada encontrado.
   - Criado o repositório **privado** `EnricoVidal/climaponto-gs-2026`; os 12 commits foram publicados na `main`. A visibilidade foi confirmada pela API (`isPrivate = true`).
2. Após o reinício, o Docker funcionou. O Supabase local (CLI 2.122.0, imagem `supabase/postgres:17.11.0.006`) aplicou as 5 migrações e o seed; `db reset --local` reconstruiu tudo do zero.
3. Suíte SQL no Supabase local oficial: **50/50**.
4. Criado `web/scripts/check-supabase-roles.mjs` (testes com tokens reais do Supabase Auth, restrito a endereços locais). Com contas de teste criadas só no Auth local: **14/14**.
5. Corrigido um encerramento instável dos scripts de verificação no Windows (assertion da libuv ao chamar `process.exit()`), usando `process.exitCode`.

**Nada foi aplicado no banco remoto** (continua com 2 migrações). Nenhuma tela de CRUD foi implementada.

### Etapa 2B — autenticação administrativa e CRUD (10/11/2026)

**Revisão técnica (ChatGPT):** aprovou o fechamento da 2A e autorizou aplicar as três migrações no remoto, implementar login administrativo e CRUD de pontos, sem bibliotecas novas e sem gráficos ou integração IoT.

**Decisão do integrante (Enrico):** depois que a integração recusou a migração com `DROP POLICY`, aprovou aplicar a versão reescrita com `ALTER POLICY`.

**Execução (Claude Code):**

1. **Remoto:** verificação prévia, plano de recuperação e aplicação das três migrações.
   - A primeira tentativa da última falhou por erro 502; a verificação mostrou que nada tinha sido aplicado.
   - A segunda foi recusada pela integração; as alterações foram interrompidas e o caso, reportado.
   - A terceira, já com `ALTER POLICY`, foi aplicada após aprovação.
   - Arquivos renomeados para as versões remotas. Verificação posterior e teste de visitante (8/8) feitos.
2. **Autenticação:** `authService`, `errors.js` (tradução de erros), `AuthProvider`/`useAuth`, `RequireAdmin`, página `/admin/login`, logout e aviso de sessão expirada.
3. **CRUD:** `stopsService` (criar, editar, ativar/desativar, excluir, contar leituras), `useAdminStops`, `StopForm`, `AdminStopCard`, `ConfirmDialog` (`<dialog>` nativo), `TextField`, `Button`, `FeedbackMessage`, `utils/stopValidation.js` e `utils/formatters.js`, página `/admin/pontos` com pesquisa e filtro. Área administrativa carregada com `React.lazy`.
4. **Testes executados:**
   - build e lint;
   - SQL 50/50 e papéis 14/14 no Supabase local;
   - teste de interface de ponta a ponta no Supabase local, 21/21 na execução final.
     - A primeira execução deu 20/21 e revelou um defeito real no logout, que foi corrigido.
     - Uma execução intermediária falhou por processos de teste antigos ainda abertos (problema do roteiro de teste, não da aplicação).
   - revisão visual das capturas de tela, que levou a um ajuste na posição dos selos;
   - busca de credenciais nos arquivos e no bundle.
5. **Não executado:** CRUD no remoto com conta real de admin (não há conta), leitores de tela e outros navegadores.

### Finalização da Etapa 2B (10/11/2026)

**Pedido do integrante (Enrico), com planejamento do ChatGPT:** concluir de forma autônoma as pendências da 2B (Auth remoto, validação remota do CRUD, auditoria, qualidade, preparação do deploy), sem contornar bloqueios de segurança.

**Decisão do integrante:** autorizou criar duas contas de teste por SQL no remoto e desativá-las ao final.

**Execução (Claude Code):**

1. Leu a configuração pública de Auth (`/auth/v1/settings`): **cadastro público ligado**. Não foi possível desligá-lo, porque a integração não oferece API de configuração de Auth. Ficou como ação humana.
2. Tentou criar contas pelo cadastro público oficial: recusado (domínio `.test` inválido; domínios reais exigiriam envio de e-mail).
3. Testou no Supabase local o provisionamento por SQL (login e RLS funcionaram). No remoto, criou as duas contas com **somente hashes bcrypt**; as senhas ficaram só na memória do processo de teste.
4. **Validação remota:** 31/31 (API 15/15 e interface 16/16), apenas com pontos `TEST-*`, removidos ao final. `DEMO-01..03` comprovadamente inalterados (md5 de todas as colunas antes e depois).
5. Retirou o papel admin e bloqueou as duas contas. Confirmou 0 sessões ativas e apagou os perfis temporários do navegador e o arquivo de hashes.
6. Auditoria somente leitura do remoto (RLS, políticas, grants, funções, advisors): sem problemas.
7. **Acessibilidade com axe-core:** encontrou e corrigiu `heading-order` na lista administrativa. Resultado final de 0 violações nas telas auditadas.
8. **Deploy:** `web/vercel.json` (rewrite do React Router, CSP e cabeçalhos de segurança, cache), validado localmente (25/25) com servidor que aplica as mesmas regras. **Deploy não executado.**
9. Documentos: `docs/deploy.md`, `docs/etapa-3-proposta.md` (proposta, nada instalado), atualização de `security-review.md`, README e este arquivo.

**Ferramentas de teste fora do repositório** (pasta temporária da sessão): `axe-core` e scripts de navegador via Chrome DevTools Protocol. Nenhuma dependência nova no aplicativo.

### Etapa 3B — Dashboard e Histórico (12/11/2026)

**Processo:** Claude Code (CLI, no WSL) com o Engineering Harness 0.3.1. O orquestrador foi o Claude Opus 5.5; o planejamento e as revisões independentes (code-reviewer e security-reviewer) usam Opus; a implementação foi feita por subagentes frontend-dev e data-dev em Sonnet 5.5. O ambiente não tem navegador, Docker nem `web/.env.local`.

**Fatos do processo:**

1. Houve uma interrupção por limite de uso da API durante as tarefas T4, T6 e T7. As tarefas foram retomadas e os arquivos parciais, revisados e commitados.
2. Implementados (12 commits de código antes desta documentação): `utils/` (connectivity, readings, historyPeriods, chartGeometry, formatters), `services/readingsApi` e `readingsService`, hooks `useLatestReadings`, `useReadingsHistory` e `useNow`, componentes em `components/dashboard`, `components/history` e `components/ui`, e as páginas Dashboard e Histórico.
3. Sem bibliotecas novas: gráfico SVG próprio e ícones SVG inline (ver `docs/architecture-decisions.md`).

**Comandos executados nesta tarefa (cwd `web/`) e resultados:**

- `npm run lint`: terminou sem erros; exibiu 2 avisos `react(set-state-in-effect)`, em `useReadingsHistory.js` e `useLatestReadings.js` (conhecidos, mantidos como trade-off).
- `npm run build`: concluído com sucesso (bundle principal 321,08 kB, 101,14 kB gzip).
- `node --test`: 88 testes, 22 suítes, 88 aprovados, 0 falhas.

**Não afirmado aqui:** resultado dos gates finais e das revisões independentes; consultar o `report.md` do harness.

**Pendente (validação humana):** conferir Dashboard e Histórico em navegador real (375/768/1366 px, teclado, axe-core) e com `web/.env.local` apontando para o Supabase (somente leitura). Nada disso foi executado neste ambiente.

**Integração futura:** os branches `harness/G-20261111-4f0f88` e `harness/G-20261112-096aab` (não mesclados) também alteram `AI.md`/`docs`; pode haver conflitos simples de documentação.

### Etapa 3C — Design system, gráficos e modo demonstração (12/11/2026)

**Processo:** Claude Code com o Engineering Harness, objetivo G-20261112-bf4e8c. A implementação foi dividida em tarefas por subagentes (Sonnet 5.5); esta entrada é da tarefa T11 (documentação), escrita a partir do `git log` e da leitura do código.

**O que o histórico Git do objetivo mostra** (`git log 004548d..HEAD`):

1. Porte da base funcional de Dashboard e Histórico, seguido da justificativa das dependências de interface em `docs/architecture-decisions.md`.
2. Camada de dados: `chartSeries`, resolução do modo de dados (`dataMode`), `statusTones`, dataset mock determinístico com 8 cenários, adaptador mock, fonte de dados única guiada por `VITE_DATA_MODE`, hooks e sinalização do modo efetivo, com testes para cada parte.
3. Um commit registrou o bloqueio da instalação de dependências com um fallback sem pacotes; depois o Dependency Manager do harness instalou as seis dependências (`lucide-react` 1.72.0, `motion` 14.13.0, `recharts` 3.10.1, `clsx` 2.1.1, `tailwind-merge` 3.7.0, `class-variance-authority` 0.7.1) e o registro de decisões foi corrigido (o fallback foi descartado).
4. Interface: tokens e `cn()`, componentes base, shell, Pontos e 404, estilos da área administrativa, gráficos Recharts, Histórico e Dashboard redesenhados.

**Comandos executados nesta tarefa (T11) na worktree e resultados reais:**

- `npm --prefix web run build`: concluído. Chunk principal `index-*.js` 893,94 kB (276,54 kB gzip); `AdminStopsPage` 14,33 kB; `AdminLoginPage` 1,70 kB; `TextField` 0,99 kB; CSS 42,96 kB (8,29 kB gzip). O Vite emitiu o aviso de chunk maior que 500 kB. (A 3B tinha 321,08 kB / 101,14 kB gzip.) Na rodada de correção da revisão (T101), Dashboard e Histórico passaram a `React.lazy`: `index` 224,53 kB (71,31 kB gzip), chunk do Recharts 380,62 kB (111,40 kB gzip), sem aviso de chunk.
- `npm --prefix web run lint`: 0 erros, 2 avisos `react(set-state-in-effect)` em `useReadingsHistory.js` e `useLatestReadings.js` (preexistentes).
- `node --test` listando os arquivos `*.test.js` de `utils/`, `services/` e `data/mock/`: 204 testes, 50 suítes, 204 aprovados, 0 falhas.
- `node --test <pasta>/web/src/utils/` (pasta como argumento): falhou ao carregar (a pasta aparece como teste com falha). A causa não foi investigada.
- Nos comandos de npm, o sandbox registrou uma tentativa de acesso de rede a `registry.npmjs.org` negada; não afetou o resultado e nenhum `npm install` foi executado.

**Não foi executado:** `npm run check:supabase` (não há `web/.env.local` neste ambiente); `cd web && node --test` sem argumentos (a execução em `cd` foi negada pelo ambiente); qualquer verificação em navegador.

**Autoavaliação crítica**

- *Ficou forte:* separação clara da fonte de dados (modo único, sem fallback para mock em erro, sinalizado na interface); mock determinístico com 8 cenários que cobrem os estados; regra de agrupamento do gráfico em função pura testada; 204 testes passando; documentação alinhada ao código.
- *Ainda fraco:* **nada da interface foi renderizado em navegador.** Largura de 375 px, contraste AA, axe-core, reduced motion e hierarquia h1/h2/h3 não foram conferidos; o offset `sm:top-20` da barra de filtros fixa do Histórico é estimado. Não há testes de componentes React. O bundle principal triplicou (Recharts e motion no chunk inicial, sem code splitting por rota). `icons.jsx` ainda é uma camada sobre lucide-react com consumidores a migrar. `useStops` não tem recarga (o "Tentar novamente" remonta por `key` em Pontos e recarrega a página no Dashboard). O selo "Sem sensor vinculado" foi removido do card de Pontos. Dois avisos de lint continuam.
- *Depende de aceite humano:* AC1, AC2 e AC24, além da validação visual e de acessibilidade em navegador real (incluindo a conferência com Supabase configurado) e da aprovação do design pela equipe. Nenhum deles foi dado como atendido aqui.
- *Dados:* todo o conteúdo do modo mock é fictício e sinalizado como demonstração na interface; não há leituras reais no Supabase remoto.

**Integração futura:** os branches `harness/G-20261111-4f0f88` e `harness/G-20261112-096aab` (não mesclados) também alteram `AI.md`/`docs`; pode haver conflitos simples de documentação.

### Etapa 3D — testes E2E automatizados em navegador (13/11/2026)

**Processo:** Claude Code (sessão de manutenção do Engineering Harness 0.5.0) e o próprio harness. Objetivos `G-20261113-e21494` (testes E2E e três correções), derivado do branch do redesign `harness/G-20261112-bf4e8c` sem alterá-lo, e `G-20261113-ec01eb` (continuação). A revisão de `G-20261113-e21494` foi feita pelo agente independente `code-reviewer` do harness (veredito: aprovado, com sugestões aplicadas na continuação).

**Executado de verdade (gate de navegador do harness: Playwright 1.65.0, Chromium 158 e Firefox 159, modo mock, isolado e sem rede):**

- `G-20261113-e21494`, HEAD `76899ac`: 76 testes aprovados, 4 pulados, 0 falhas, 0 instáveis; lint e build aprovados.
- `G-20261113-ec01eb`, HEAD `d2be3a8` (antes desta documentação): 78 aprovados, 4 pulados, 0 falhas, 0 instáveis.
- 12 screenshots reais por execução: Dashboard, Histórico e Pontos, em 1366 px e 375 px, nos dois navegadores.

**Defeitos encontrados pelos testes e corrigidos:**

1. axe-core `definition-list`/`dlitem` (sério) no resumo estatístico dos gráficos: `<dt>`/`<dd>` aninhados em `<div>`s dentro do `<dl>` (`ReadingsSummary.jsx`).
2. axe-core `scrollable-region-focusable`: tabela de leituras rolável inalcançável pelo teclado (`ReadingsTable.jsx`).
3. Rolagem horizontal em 375 e 768 px no Dashboard: selo de conectividade com texto longo e `whitespace-nowrap` (`ConnectivityBadge.jsx`).
4. Cerca de 1,8 mil px de rolagem vazia abaixo do rodapé no Histórico (desktop, Chromium e Firefox): textos `sr-only` (`position: absolute`) dos selos escapavam do contêiner rolável não posicionado (`ReadingsTable.jsx`).

**Não foi feito:** conferência com o Supabase configurado; aprovação estética do design; referências visuais aprovadas (não há comparação de imagens); axe-core no Firefox nas páginas com gráficos (pulado com motivo; coberto no Chromium).

**Autoavaliação:** a interface 3C deixou de estar "nunca renderizada": a parte objetiva de acessibilidade, layout e estados é verificada a cada objetivo. Continua dependendo da equipe o julgamento visual (incluindo a quebra dos valores em 375 px) e a validação com dados reais.

## Princípios adotados

- O código gerado por IA é revisado pela equipe antes de ser aprovado.
- Este registro descreve apenas ações que realmente aconteceram; nenhum prompt ou teste é inventado.
- Dados exibidos pela aplicação nesta fase são demonstrativos e identificados como tal na interface.
