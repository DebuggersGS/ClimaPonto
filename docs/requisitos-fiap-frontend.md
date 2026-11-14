# Requisitos de Front-end — checklist com evidência

Objetivo G-20261114-4ef93c, tarefa T7. Evidências reconferidas com `git show HEAD:<arquivo>` no HEAD `b57d477` (T104, depois da verificação final em `cbbd4a8`). Entre `a65a392` e este HEAD só mudou `AdminStopsPage.jsx` (o uso do `ConfirmDialog` foi de `:251` para `:253`); as demais linhas citadas foram conferidas e permanecem iguais. Os gates rodaram em `cbbd4a8`; os commits posteriores mudam só `AuthProvider.jsx`, `MainNav.jsx` e documentos, e uma nova verificação será feita.

## Fonte do checklist

O **enunciado oficial da FIAP não está no repositório**: a busca em `README.md`, `AI.md` e `docs/` não encontrou o texto do enunciado (só menções genéricas a "requisitos da disciplina" em `AI.md:18`). Por isso este checklist segue a **lista de 11 requisitos do objetivo**, e não um texto oficial. A equipe deve conferi-lo contra o enunciado.

Legenda: **atendido** (evidência no código), **parcial** (atendido com lacuna), **pendente** (não atendido ou não verificável).

## Resumo

| # | Requisito | Status |
|---|---|---|
| 1 | React + Vite | atendido |
| 2 | Tailwind CSS | atendido |
| 3 | Pelo menos 8 componentes reutilizáveis | atendido (20 em `components/ui`) |
| 4 | `useState` e `useEffect` | atendido |
| 5 | Pelo menos 2 custom hooks | atendido (8) |
| 6 | Separação apresentação / hooks / serviços / utils | atendido, com 1 desvio menor |
| 7 | API externa | parcial (Supabase sim; API pública de terceiros não) |
| 8 | CRUD completo | atendido (Supabase e modo demonstração em memória) |
| 9 | Funcionalidade CitizenTech | pendente (termo não definido no repositório) |
| 10 | Responsividade | atendido (E2E em 375/768/1366 px aprovado no gate 0030) |
| 11 | `README.md` e `AI.md` | atendido |
| 12 | Histórico de desenvolvimento rastreável | atendido |

Observação: o objetivo fala em 11 requisitos, mas a lista enumerada nele tem 12 itens quando "React e Vite" e "Tailwind CSS" são separados; aqui todos os 12 são conferidos.

## 1. React + Vite — atendido

- `web/package.json:21` — `"react": "^19.3.1",`
- `web/package.json:33` — `"vite": "^8.3.6"`
- `web/src/main.jsx:8` — `createRoot(document.getElementById('root')).render(`
- `web/vite.config.js:7` — `plugins: [react(), tailwindcss()],`
- Build conferido nesta tarefa: `npm --prefix web run build` concluiu (ver *Verificações executadas*).

## 2. Tailwind CSS — atendido

- `web/package.json:26` — `"tailwindcss": "^4.3.5"`
- `web/vite.config.js:7` — plugin `tailwindcss()` (de `@tailwindcss/vite`, `web/package.json:16`).
- `web/src/styles/index.css:1` — `@import 'tailwindcss';`
- Uso nas classes dos componentes, por exemplo `web/src/components/dashboard/StopStatusCard.jsx:19` — `whitespace-nowrap text-xl font-semibold sm:text-2xl tabular-nums`.

## 3. Pelo menos 8 componentes reutilizáveis — atendido

`web/src/components/ui/` tem **20 componentes** `.jsx` de uso geral (mais `icons.jsx`, `motion.js` e `tones.js`, que não são componentes de tela):

1. `Badge`, 2. `Button`, 3. `Card`, 4. `ConfirmDialog`, 5. `ConnectivityBadge`, 6. `DataSourceBadge`, 7. `DemoNotice`, 8. `EmptyState`, 9. `EnvironmentalStatusBadge`, 10. `FeedbackMessage`, 11. `MetricCard`, 12. `PageHeader`, 13. `ReadingSourceBadge`, 14. `Reveal`, 15. `Section`, 16. `SegmentedControl`, 17. `Skeleton`, 18. `StatusIcon`, 19. `StopHistoryLink`, 20. `TextField`.

Reuso real, por exemplo: `ConfirmDialog` importado em `web/src/pages/AdminStopsPage.jsx:6` (`import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'`) e usado em `AdminStopsPage.jsx:253`. Há ainda componentes de domínio em `components/dashboard`, `history`, `charts`, `admin`, `auth` e `layout`.

## 4. `useState` e `useEffect` — atendido

- `web/src/hooks/useStops.js:1` — `import { useCallback, useEffect, useState } from 'react'`
- `web/src/hooks/useStops.js:11` — `const [stops, setStops] = useState([])`
- `web/src/hooks/useStops.js:16` — `useEffect(() => {`
- `web/src/hooks/useNow.js:15` — `const [now, setNow] = useState(() => new Date())`
- `web/src/hooks/useNow.js:17` — `useEffect(() => {`

## 5. Pelo menos 2 custom hooks — atendido

`web/src/hooks/` tem **8 custom hooks** (arquivos `use*.js` que exportam `useXxx`) e 1 arquivo de contexto (`authContext.js`, não é hook):

1. `useAdminStops` (CRUD de pontos), 2. `useAuth` (sessão), 3. `useDataMode` (modo efetivo de dados), 4. `useDocumentTitle`, 5. `useLatestReadings` (polling do Dashboard), 6. `useNow` (relógio), 7. `useReadingsHistory` (Histórico), 8. `useStops` (lista de pontos).

Exemplos: `web/src/hooks/useStops.js:10` — `export function useStops() {`; `web/src/hooks/useNow.js:14` — `export function useNow(intervalMs = 30000) {`.

## 6. Separação apresentação / hooks / serviços / utils — atendido, com um desvio menor

- Apresentação: `web/src/pages/` (6 páginas) e `web/src/components/`.
- Estado: `web/src/hooks/`. O hook importa serviços, não o contrário: `web/src/hooks/useStops.js:3` — `import { listStops } from '../services/stopsService.js'`.
- Dados e tradução de erros: `web/src/services/` (`stopsApi.js`, `mockReadingsApi.js`, `supabaseAuthApi.js`, `errors.js`, ...).
- Funções puras: `web/src/utils/` com testes `*.test.js` ao lado. Componentes importam utils, por exemplo `web/src/components/charts/ChartTooltip.jsx:1` — `import { formatDateTimeWithZone, formatTimeWithZone } from '../../utils/formatters.js'`.
- **Desvio:** `web/src/components/auth/AuthProvider.jsx:3` — `import * as authService from '../../services/authService.js'`. Um componente de contexto de sessão fala direto com o serviço, sem hook intermediário. Aceito por ser o provedor de contexto; registrado como observação.

## 7. API externa — parcial

- Atendido (Supabase): `web/src/services/supabaseClient.js:1` — `import { createClient } from '@supabase/supabase-js'`; consultas REST em `web/src/services/stopsApi.js:85` — `let query = client.from('stops').select(STOP_COLUMNS).order('code')`; autenticação em `web/src/services/supabaseAuthApi.js:18` — `client.auth.signInWithPassword(...)`.
- **Pendência / decisão de produto:** se o enunciado exigir uma **API pública de terceiros** (ex.: serviço meteorológico), isso **não** foi implementado e não faz parte deste objetivo. O Supabase é um serviço externo (API REST e Auth), mas a equipe precisa confirmar se atende ao enunciado. No remoto ainda não há leituras reais (0 leituras); a validação no navegador contra o Supabase não foi feita neste objetivo (não se acessa o remoto).

## 8. CRUD completo — atendido

- **Supabase** (`web/src/services/stopsApi.js`): criar `:95` — `client.from('stops').insert(toWritableRow(input))`; ler `:85`; editar `:103` — `.update(toWritableRow(input)).eq('id', id)`; ativar/desativar `:111` — `.update({ active })`; excluir `:122` — `.delete().eq('id', id)`.
- **Modo demonstração, em memória** (`web/src/services/mockReadingsApi.js`): `:130` `async createStop(input) {`, `:152` `async updateStop(id, input) {`, `:170` `async setStopActive(id, active) {`, `:178` `async deleteStop(id) {`. Nada persiste: recarregar a página restaura o dataset (decisão 36).
- Hook: `web/src/hooks/useAdminStops.js:73` (`create`), `:82` (`update`), `:91` (`setActive`), `:100` (`remove`).
- Interface: `web/src/pages/AdminStopsPage.jsx` (formulário, diálogo de confirmação em `:253`).
- Testes unitários cobrem as escritas do mock (`mockReadingsApi.test.js`, 228 testes no total, aprovados no gate 0031). O E2E do CRUD (`web/e2e/admin.spec.mjs`) foi executado no gate 0030 (HEAD `cbbd4a8`) e aprovado em Chromium e Firefox.

## 9. Funcionalidade CitizenTech — pendente

O termo "CitizenTech" **não aparece** em `README.md`, `AI.md`, `docs/` nem em `web/src` (busca por `citizen`, sem diferenciar maiúsculas). O que existe é o tema do projeto: monitoramento de calor urbano em pontos de ônibus para quem espera o transporte (`README.md:5`). A equipe precisa dizer se isso cumpre o requisito ou se há uma funcionalidade específica esperada. Nada foi implementado para este item.

## 10. Responsividade — atendido

- Classes responsivas do Tailwind nos componentes, por exemplo `web/src/pages/StopsPage.jsx:78` — `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` e `web/src/components/layout/AppLayout.jsx:17` — `px-4 py-6 sm:px-6 sm:py-10 lg:px-8`.
- Testes E2E em **375, 768 e 1366 px** (sem rolagem horizontal, sem elementos obscurecidos, auditoria de design): `web/e2e/qualidade.spec.mjs:22` — `for (const [nome, rota, region] of PAGES) {` (laço sobre `VIEWPORTS` em `:23`); `web/e2e/admin-qualidade.spec.mjs` para login e lista administrativa; `web/e2e/valores-375.spec.mjs` para temperatura e umidade em uma linha.
- **Execução real:** gate E2E 0030 no HEAD `cbbd4a8`, Chromium e Firefox: 190 aprovados, 0 falhas, 0 flaky, 4 pulados (axe no Firefox nas páginas com gráficos); sem rolagem horizontal nem obscurecimento em 375/768/1366 px; 56 screenshots. Ressalva: o item ativo "Gerenciar" da navegação aparecia cortado a 375 px na captura do 0030; corrigido depois em `MainNav.jsx` (T104), com nova verificação pendente.

## 11. `README.md` e `AI.md` — atendido

- `README.md` na raiz (instalação, modos de dados, estrutura, "O que já funciona" e "Pendente").
- `AI.md` na raiz, com um registro por etapa e a entrada desta finalização.
- Ambos são atualizados a cada etapa e só descrevem execuções reais.

## 12. Histórico de desenvolvimento rastreável — atendido

- `git rev-list --count HEAD` no HEAD `b57d477`: **84 commits**, de 09/11/2026 a 14/11/2026 (`git log --reverse --format=%ad --date=short`), em português e no formato `tipo(escopo): descrição`.
- Commits recentes deste objetivo (exemplos reais): `de32ce0 fix(web): valores de temperatura e umidade sem quebra entre número e unidade`; `ea3db28 feat(servicos): autenticação demonstrativa no modo mock`; `a65a392 test(e2e): qualidade do login e da gestão de pontos`.
- Tarefas do harness têm o trailer `Harness-Task`. O histórico não foi reescrito.

## Verificações executadas

Gates do harness no HEAD `cbbd4a8` (evidências em `state/.../evidence`):

- lint (0027): aprovado; build (0028): aprovado.
- E2E (0030), Chromium e Firefox: 190 aprovados, 0 falhas, 0 flaky, 4 pulados, 56 screenshots.
- Testes unitários (0031): 228/228.
- Ciclos até a aprovação: 3 verificações reprovadas (11 falhas + 1 flaky; 1 falha; 6 falhas + 1 flaky) e corrigidas por `a4968a3`, `51c6855`, `4a0c395`, `b37bf2d`, `bb51488` e `cbbd4a8`; detalhes em `docs/revisao-visual-frontend.md`.
- Observação: "Page crashed" intermitente do Firefox (axe do login escuro e `medir()` no Dashboard) sem causa raiz identificada.

Execuções locais da T104 no HEAD `b57d477` (worktree, sem rede): `node --test` 228/228; `npm run lint` sem erros (2 avisos preexistentes); `npm run build` concluído. O sandbox negou rede a `registry.npmjs.org`, sem efeito.

## Pendente

- Nova verificação do harness sobre os commits posteriores a `cbbd4a8` (`AuthProvider.jsx`, `MainNav.jsx`).
- Screenshots "Depois" a 375 px confirmando o item "Gerenciar" visível.

## Lacunas reais (também no README)

1. Enunciado oficial ausente do repositório: checklist não conferido contra o texto da FIAP.
2. "CitizenTech" sem definição no repositório (item 9).
3. API pública de terceiros: decisão de produto pendente (item 7).
4. Nova verificação após T104 (ver *Pendente*).
5. Aceite estético humano e validação com Supabase configurado e dados reais.
