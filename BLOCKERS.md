# Bloqueios e ações humanas

Status da release: LOCAL_READY_PENDING_REMOTE (branch `harness/G-20261117-cfedb6`). Os itens abaixo dependem de pessoas ou serviços externos; nada disso foi feito pelos agentes (sem push, deploy, escrita remota, envio ou aceite visual).

## 1. GitHub privado e convites

- Confirmar repositório privado, convidar os dois professores com permissão **write** e fazer o push da branch (decisão humana).

## 2. Deploy na Vercel e CSP efetiva

- Criar o projeto apontando para `web/` (`docs/deploy.md`) e definir `VITE_DATA_MODE`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (só publishable). Não existe URL de deploy.
- A CSP de `web/vercel.json` (libera `tiles.openfreemap.org`) só foi testada como texto; verificar no deploy real, no console, que mapa, estilos e Supabase carregam sem violação.
- Os cenários S11, S12, S13 e S14 dependem do deploy e do Supabase remoto.

## 3. Envios separados no Teams

- Front-end Design e Web Development: ZIP, link do GitHub e URL de deploy em cada, até 19/11/2026 às 23h55. O ZIP desta rodada não foi gerado; `release/MANIFEST.txt` e `SHA256SUMS` são da release anterior.

## 4. CRUD e RLS no Supabase remoto

- Falta verificar criar, editar, desativar e excluir com usuário admin de teste, e o RBAC negativo (S11, S12), com autorização explícita. Hoje: `stopsApi.test.js` (cliente falso) e SQL local não reexecutado.
- Painel do Supabase: desativar o cadastro público e criar as contas administrativas definitivas.

## 5. Dependências

- Nenhuma dependência não autorizada foi necessária. `maplibre-gl`, `react-map-gl` e `@base-ui/react` foram autorizadas pelo humano e instaladas pelo serviço confiável.

## 6. Dados geográficos rastreáveis (GTFS)

- As coordenadas dos pontos são ilustrativas. Para S01 falta fonte com licença checada (GTFS SPTrans, GeoSampa ou outra) e importação aprovada.

## 7. Open-Meteo e dados reais

- Open-Meteo não foi integrada (S02, S13); não há leitura real de ESP32 nem endpoint de ingestão.

## 8. Aceite visual humano e gate E2E

- Os specs E2E novos e adaptados não foram executados pelo agente; aguardam o gate do harness. Capturas antes/depois, vídeo de interações, contraste, 375/768/1366 px e mapa com tiles reais precisam de conferência humana (S23, `docs/QA-VISUAL.md`). Lighthouse não medido.

## 9. Outros

- Definir "CitizenTech" (S16) e reunir materiais de Python, Edge/Wokwi, Total Experience e Storytelling (`docs/INTEGRACAO-GS.md`).
