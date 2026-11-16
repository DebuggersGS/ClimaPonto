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
- O ZIP (`release/`, fora do Git), `MANIFEST.txt` e `SHA256SUMS` foram gerados; o ZIP vem do commit indicado na primeira linha do manifesto.

## 4. CRUD remoto com usuário de teste

- A release só testou o cliente com Supabase falso (`stopsApi.test.js`). Falta verificar criar, editar, desativar e excluir no Supabase remoto com um usuário de teste com papel admin, com autorização explícita.
- Pendências do painel do Supabase: desativar o cadastro público e criar as contas administrativas definitivas.

## 5. Materiais dos colegas

- Python, Matemática/DPS, Edge/Wokwi, Total Experience e Storytelling: não há material no repositório (veja `docs/INTEGRACAO-GS.md`). Reunir com os colegas responsáveis.

## 6. Outros

- Definir com a equipe o que é "CitizenTech" (termo ausente no repositório).
- Aceite visual humano: a nova navegação (barra lateral e menu móvel) não foi vista renderizada neste ambiente (sem navegador); conferir em 375, 768 e 1366 px, claro e escuro, e rodar o gate E2E.
- Lighthouse e Core Web Vitals não foram medidos.
