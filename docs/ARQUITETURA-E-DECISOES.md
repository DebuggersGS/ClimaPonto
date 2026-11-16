# Arquitetura e decisões da release

Histórico completo de decisões técnicas: [architecture-decisions.md](architecture-decisions.md). Este documento resume o estado desta release.

## 1. Camadas

`pages/` e `components/` (apresentação) → `hooks/` (estado: `useState`, `useEffect`, contexto) → `services/` (acesso a dados e tradução de erros em `errors.js`) → `utils/` (funções puras). Camadas de baixo não importam de cima.

## 2. Modos de dados

`VITE_DATA_MODE` aceita `mock`, `supabase` e `auto` (padrão). `dataSourceFactory.js` escolhe a fonte; `dataSource.js` expõe a interface única. Não há mistura de fontes nem fallback para mock em erro. O modo efetivo aparece no cabeçalho. No mock, login e CRUD ficam em memória.

## 3. Bibliotecas existentes

| Biblioteca | Por quê |
| --- | --- |
| React 19, Vite 8, Tailwind 4, React Router 8 | base exigida (React + Vite + Tailwind) e roteamento |
| `@supabase/supabase-js` | API externa (banco, Auth, RLS) usada no CRUD |
| Recharts | gráficos do Dashboard e do Histórico (carregados sob demanda) |
| motion | animações, com `MotionConfig reducedMotion="user"` |
| lucide-react | ícones |
| clsx, tailwind-merge, class-variance-authority | composição de classes e variantes dos componentes de `ui/` |
| Oxlint | lint |

Testes usam `node:test` e o Playwright do harness (fora do `package.json`). Esta release não adicionou dependências.

## 4. Decisões de UX desta release

- **Ícones decorativos na navegação (T2, `b060943`):** lucide-react em `MainNav.jsx`, `aria-hidden`, ocultos abaixo de 640 px para não quebrar a navegação em 375 px; item ativo com traço mais grosso, de modo que o estado não dependa só de cor.
- **Alternativas descartadas por esta release:** sidebar e novas páginas (Explorar, Análises, Relatórios) e recolher a metodologia do Dashboard. Não foram feitas por limite de orçamento da execução, não por decisão de produto. Reorganização ampla: PARCIAL / não realizada.
- A interface não foi inspecionada renderizada e não há screenshots antes/depois.

## 5. Matriz funcionalidade anterior → localização nova → teste de regressão

Nenhuma localização mudou nesta release; todas as linhas valem "inalterado". A única alteração visual é o ícone na navegação.

| Funcionalidade | Localização nova | Teste de regressão (`web/e2e`) |
| --- | --- | --- |
| Dashboard | inalterado: rota `/` | `dashboard.spec.mjs`, `visual-premium.spec.mjs`, `navegacao.spec.mjs` |
| Pontos (lista, ficha) | inalterado: `/pontos` | `pontos.spec.mjs`, `ficha-ponto.spec.mjs`, `filtros.spec.mjs` |
| Mapa | inalterado: `/pontos` | `mapa.spec.mjs` |
| Insights | inalterado: Dashboard | `insights.spec.mjs` |
| Comparador | inalterado: Dashboard | `insights.spec.mjs` |
| Histórico | inalterado: `/historico` | `historico.spec.mjs`, `historico-exploracao.spec.mjs`, `historico-perfis.spec.mjs`, `qualidade.spec.mjs` |
| CSV | inalterado: Histórico | `historico-exploracao.spec.mjs`, `historico-perfis.spec.mjs` |
| Favoritos | inalterado: `/pontos` | `favoritos.spec.mjs` |
| Laboratório | inalterado: `/pontos` | `laboratorio.spec.mjs` |
| Paleta de comandos | inalterado: global | `palette.spec.mjs` |
| Admin | inalterado: `/admin/login`, `/admin/pontos` | `admin.spec.mjs`, `admin-qualidade.spec.mjs` |

A associação entre funcionalidade e spec vem dos nomes dos arquivos e de buscas por palavra-chave; os resultados de execução ficam no relatório do harness. Testes unitários relacionados: `stopsApi.test.js` (CRUD do cliente), `readingsCsv.test.js` (CSV), `favoriteStops.test.js`, `stopComparison.test.js`, `commandSearch.test.js`.
