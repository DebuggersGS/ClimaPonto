# Bloqueios e ações humanas

Status da release: LOCAL_RELEASE_READY_WITH_BLOCKERS. Os itens abaixo dependem de pessoas ou de serviços externos; nada disso foi feito pelos agentes (sem push, deploy, escrita remota ou envio).

## 1. GitHub privado e convites

- Confirmar que o repositório está privado.
- Convidar os dois professores com permissão **write** e conferir que aceitaram.
- Fazer o push da branch da release (decisão humana).

## 2. Deploy na Vercel

- Criar o projeto apontando para `web/` (veja `docs/deploy.md`; `web/vercel.json` já define build e cabeçalhos).
- Definir `VITE_DATA_MODE`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (somente chave publishable).
- Registrar a URL de deploy no README e no checklist. Hoje não existe URL.

## 3. Envios separados no Teams

- Front-end Design e Web Development são entregas distintas: enviar ZIP, link do GitHub e URL de deploy em cada uma, até 19/11/2026 às 23h55.
- O ZIP, `release/MANIFEST.txt` e `release/SHA256SUMS` são gerados pela T4.

## 4. CRUD remoto com usuário de teste

- A release só testou o cliente com Supabase falso (`stopsApi.test.js`). Falta verificar criar, editar, desativar e excluir no Supabase remoto com um usuário de teste com papel admin, com autorização explícita.
- Pendências do painel do Supabase: desativar o cadastro público e criar as contas administrativas definitivas.

## 5. Materiais dos colegas

- Python, Matemática/DPS, Edge/Wokwi, Total Experience e Storytelling: não há material no repositório (veja `docs/INTEGRACAO-GS.md`). Reunir com os colegas responsáveis.

## 6. Outros

- Definir com a equipe o que é "CitizenTech" (termo ausente no repositório).
- Aceite visual humano: a UX desta release teve só ícones na navegação, sem inspeção renderizada nem screenshots.
- Lighthouse e Core Web Vitals não foram medidos.
