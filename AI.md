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

## Princípios adotados

- O código gerado por IA é revisado pela equipe antes de ser aprovado.
- Este registro descreve apenas ações que realmente aconteceram; nenhum prompt ou teste é inventado.
- Dados exibidos pela aplicação nesta fase são demonstrativos e identificados como tal na interface.
