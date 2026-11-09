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

## Princípios adotados

- O código gerado por IA é revisado pela equipe antes de ser aprovado.
- Este registro descreve apenas ações que realmente aconteceram; nenhum prompt ou teste é inventado.
- Dados exibidos pela aplicação nesta fase são demonstrativos e identificados como tal na interface.
