# Prompts representativos

Registro dos pedidos enviados às ferramentas de IA durante a construção da aplicação web do ClimaPonto (Front-end Design e Web Development). Como funciona o uso de IA no projeto, como as respostas foram validadas e a análise crítica estão em [AI.md](AI.md).

- Os prompts da última rodada estão **transcritos como foram enviados** (só foram encurtados onde indicado por "[...]").
- Das etapas anteriores, o registro guardou o **resumo do pedido**, e não o texto literal; eles aparecem assim, identificados.

## Última rodada: correção definitiva da interface (17 e 18/11/2026, Claude Code)

### 1. Pedido principal

> CLIMAPONTO — CORREÇÃO DEFINITIVA DA INTERFACE E DOS ERROS FUNCIONAIS
>
> Você será responsável por corrigir integralmente os problemas da versão atual do ClimaPonto e entregar uma aplicação visualmente refinada, estável e funcional.
>
> Não quero outra correção parcial, diagnóstico isolado, proposta, protótipo ou lista de recomendações. Quero os problemas efetivamente resolvidos no código, com testes e validação visual. [...]
>
> 1. Layout quebrado e elementos sobrepostos. A interface apresenta sobreposição entre sidebar, cabeçalho e conteúdo principal. [...]
> 2. Sidebar — reprojetar a experiência. A navegação atual ficou pior: quando a sidebar expande, praticamente todas as páginas ficam escondidas dentro de dropdowns. [...]
> 3. Logo e identidade visual. O logo está cortado e desalinhado. [...]
> 4. Cabeçalho inteligente. O cabeçalho superior ocupa muito espaço. Implemente: ocultar suavemente o cabeçalho ao rolar a página para baixo; reaparecer ao rolar para cima [...]
> 5. MAPA REAL — CORREÇÃO OBRIGATÓRIA. A página Explorar apresenta: "Não foi possível carregar o mapa base (estilo ou blocos do mapa)." Não aceite esse fallback como solução final. Investigue a causa concreta [...]
> 6. TELA PRETA AO CLICAR EM "ABRIR PONTO". Prioridade crítica. [...] Reproduza o erro, investigue o Console, o roteamento, os parâmetros, os hooks, os dados e a renderização. Corrija a causa raiz. [...]
> 7. Revisão visual completa. [...]
>
> Não enfraqueça testes nem adicione `skip` para esconder falhas. Não elimine funcionalidades anteriores. [...]

**Resposta (resumo):** a IA reproduziu os erros em navegador real e encontrou as causas (o *worker* do MapLibre não era servido pelo Vite; o minimapa do Ponto 360° passava um formato de dado diferente para a lista alternativa e a exceção apagava a página inteira). Corrigiu as causas, redesenhou barra lateral, logo e cabeçalho, revisou as telas em 375, 768 e 1366 px nos temas claro e escuro e rodou lint, build, testes unitários e testes em navegador.

### 2. Acompanhamento

> ta, e quais sao todos os proximos passos

**Resposta (resumo):** lista ordenada do que faltava (testes em navegador, revisão visual final, documentação, limpeza e entrega) e das pendências que dependiam de ações humanas.

### 3. Conferência com o enunciado

> eu baixei os dois pds, da uma olhada e veja doq estou falando, ja mando o repo

**Resposta (resumo):** a IA leu os PDFs da GS (Desafio CitizenTech e kick-off), extraiu os entregáveis de Front-end Design e Web Development e comparou item a item com o projeto, apontando as lacunas: Ficha da CitizenTech e ODS no README, AI.md nas cinco partes pedidas, este `prompts.md`, deploy e ZIP.

### 4. Entrega

> eita, da para diminuir o numero de commits? kkkkk, e outra coisa, eu preciso que vc me entregue isso pronto, okay? faça tudo que consegue e exatamente oq nn atendemos q foi pedido [...]

**Resposta (resumo):** a IA recomendou **não** reduzir os commits (o enunciado pede no mínimo 15 e reescrever o histórico apagaria a evolução avaliada) e completou o que faltava.

> ah, e claro, so versionaremos exatamente oq foi pedido no pdf do professor, ne?

**Resposta (resumo):** a versão final mantém só o que o enunciado pede para avaliar e executar (código em `web/`, banco em `supabase/`, `README.md`, `AI.md`, este arquivo e os documentos técnicos citados no README); arquivos de controle interno foram removidos.

## Etapas anteriores (resumo do pedido, conforme registrado no AI.md)

| Etapa | Pedido (resumo registrado) |
| --- | --- |
| 1 — Fundação (09/11) | Criar a aplicação com React + Vite, JavaScript, Tailwind CSS e npm, com estrutura de pastas, layout responsivo, navegação e páginas iniciais. |
| 2A — Supabase e contrato de dados (09/11) | Criar o banco (tabelas, restrições, índices, permissões RLS), o contrato de dados com o sensor e a revisão de segurança. |
| GitHub e Supabase local (09/11) | "Investigar acessos ao GitHub já existentes antes de pedir login, sem exibir credenciais, e depois validar o Supabase local." |
| 2B — Login e CRUD (10/11) | Implementar login administrativo e CRUD de pontos sem bibliotecas novas; depois, "concluir de forma autônoma as pendências da 2B (Auth remoto, validação remota do CRUD, auditoria, qualidade, preparação do deploy), sem contornar bloqueios de segurança". |
| 3B e 3C — Dashboard, Histórico e design (12/11) | Dashboard e Histórico com gráficos, design system com tema escuro e modo demonstração com dados fictícios sinalizados. |
| 3D — Testes em navegador (13/11) | Testes E2E automatizados em 375, 768 e 1366 px, com teclado, acessibilidade e movimento reduzido. |
| Fases 3 e 4 (14 a 16/11) | Busca, filtros, insights, comparador, mapa, favoritos, alertas e busca rápida (Ctrl+K). |
