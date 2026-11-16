# Matriz de requisitos FIAP

Fonte dos critérios: lista do objetivo (o enunciado oficial não está no repositório). Rótulos: ATENDE / PARCIAL / NÃO ATENDE / NÃO VERIFICÁVEL / PENDENTE. Os dois eixos usam a mesma base de código; a tabela é repetida para cada entrega. Totais de testes: relatório de verificação do harness.

## Front-end Design

| Critério | Status | Evidência | Arquivo | Teste | Pendência |
| --- | --- | --- | --- | --- | --- |
| React + Vite + Tailwind | ATENDE | react 19, vite 8, tailwindcss 4 no `package.json` | `web/package.json`, `web/vite.config.js` | `npm run build` | nenhuma |
| 8 ou mais componentes | ATENDE | 71 arquivos em `components/` | `web/src/components/` | `npm run lint` | nenhuma |
| useState/useEffect e 2 ou mais custom hooks | ATENDE | 13 hooks em `hooks/` | `web/src/hooks/` | specs E2E das páginas | nenhuma |
| Camadas | ATENDE | pages/components, hooks, services, utils | `docs/ARQUITETURA-E-DECISOES.md` | testes unitários de utils e services | nenhuma |
| CRUD real com API externa | PARCIAL | Supabase em `stopsApi.js`; 9 testes com cliente falso | `web/src/services/stopsApi.js` | `web/src/services/stopsApi.test.js` | escrita remota PENDENTE (não verificada nesta release) |
| Aplicação funcional "CitizenTech" | NÃO VERIFICÁVEL | termo não definido no repositório | `docs/requisitos-fiap-frontend.md` | `web/e2e/*.spec.mjs` (modo mock) | definir o termo com a equipe |
| 15 ou mais commits, README e AI.md | ATENDE | 140 commits no HEAD `b060943` | `README.md`, `AI.md` | `git rev-list --count HEAD` | nenhuma |
| GitHub privado, write dos professores, ZIP, deploy | NÃO VERIFICÁVEL | README cita repositório privado; permissões e deploy não verificados; ZIP gerado pela T4 | `BLOCKERS.md` | nenhum | PENDENTE (ações humanas) |
| Prazo 19/11/2026 23h55 | NÃO VERIFICÁVEL | depende do envio no Teams | `docs/CHECKLIST-SUBMISSAO.md` | nenhum | PENDENTE |

## Web Development

| Critério | Status | Evidência | Arquivo | Teste | Pendência |
| --- | --- | --- | --- | --- | --- |
| React + Vite + Tailwind | ATENDE | react 19, vite 8, tailwindcss 4 no `package.json` | `web/package.json`, `web/vite.config.js` | `npm run build` | nenhuma |
| 8 ou mais componentes | ATENDE | 71 arquivos em `components/` | `web/src/components/` | `npm run lint` | nenhuma |
| useState/useEffect e 2 ou mais custom hooks | ATENDE | 13 hooks em `hooks/` | `web/src/hooks/` | specs E2E das páginas | nenhuma |
| Camadas | ATENDE | pages/components, hooks, services, utils | `docs/ARQUITETURA-E-DECISOES.md` | testes unitários de utils e services | nenhuma |
| CRUD real com API externa | PARCIAL | Supabase em `stopsApi.js`; 9 testes com cliente falso | `web/src/services/stopsApi.js` | `web/src/services/stopsApi.test.js` | escrita remota PENDENTE; `docs/security-review.md` registra validação remota anterior, não repetida nesta release |
| Aplicação funcional "CitizenTech" | NÃO VERIFICÁVEL | termo não definido no repositório | `docs/requisitos-fiap-frontend.md` | `web/e2e/*.spec.mjs` (modo mock) | definir o termo com a equipe |
| 15 ou mais commits, README e AI.md | ATENDE | 140 commits no HEAD `b060943` | `README.md`, `AI.md` | `git rev-list --count HEAD` | nenhuma |
| GitHub privado, write dos professores, ZIP, deploy | NÃO VERIFICÁVEL | deploy preparado (`vercel.json`), não publicado | `docs/deploy.md`, `BLOCKERS.md` | nenhum | PENDENTE (ações humanas) |
| Prazo 19/11/2026 23h55 | NÃO VERIFICÁVEL | depende do envio no Teams | `docs/CHECKLIST-SUBMISSAO.md` | nenhum | PENDENTE |
