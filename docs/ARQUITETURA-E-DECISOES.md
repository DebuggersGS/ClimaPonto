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

## 4. Decisões de UX desta release (T101)

Alternativas consideradas: (a) só ícones na barra superior (descartada: não muda a arquitetura da informação); (b) mover Insights e Comparador para uma página nova (descartada: espalha a leitura rápida e quebraria muitos specs sem ganho claro); (c) **escolhida**: barra lateral, três "visões" sobre as mesmas leituras e páginas próprias para o que era secundário.

- **Barra lateral retrátil (`Sidebar.jsx`, `MainNav.jsx`, `navItems.js`):** a partir de 1280 px (`xl`). Botão "Menu lateral" com `aria-expanded` e `title`; recolhida mostra só ícones (o nome continua no DOM como `sr-only`); a preferência fica em `localStorage` (`useSidebarCollapsed`). Item ativo com `aria-current="page"`, fundo e marca lateral (nunca só cor); transição desligada com `prefers-reduced-motion`.
- **Menu móvel (`Header.jsx`):** abaixo de 1280 px o cabeçalho tem o botão "Menu" (`aria-expanded`, `aria-controls`) que abre a mesma navegação. Ao abrir, o foco vai ao primeiro item; Esc fecha e devolve o foco ao botão; escolher um item fecha o menu. Apenas uma `<nav>` fica visível por vez.
- **Seções:** Visão geral (`/`), Explorar (`/pontos`), Análises (`/analises`), Histórico (`/historico`), Laboratório (`/laboratorio`), Relatórios (`/relatorios`), Administração (`/admin/pontos`, só admin; a RLS continua sendo a autoridade).
- **Reaproveitamento:** `HistoryPage` serve Histórico, Análises e Relatórios (parâmetro `view`) com os mesmos filtros e a mesma URL (`ponto`, `periodo`, `origem`); atalhos "Ver leituras/análises/relatórios" preservam os parâmetros. A lista de seções é única (`navItems.js`) e alimenta a navegação e a paleta Ctrl+K.
- **Divulgação progressiva:** `MethodologyNote` (`<details>` nativo, recolhido por padrão) substitui a nota de conectividade sempre visível; o laboratório continua recolhido.
- **Compatibilidade:** `/`, `/pontos` e `/historico` não mudaram; `/visao-geral` e `/explorar` são apelidos que redirecionam. Textos mudaram: "Dashboard" virou "Visão geral" (título e h1), "Pontos" virou "Explorar pontos" e "Gerenciar" virou "Administração" (rótulo da navegação).
- **Sem dependências novas** (lucide-react e motion já existiam).
- **Verificação visual:** não houve inspeção renderizada neste ambiente (sem navegador); ver [RELATORIO-FINAL.md](RELATORIO-FINAL.md), seção 5.

## 5. Matriz funcionalidade anterior → localização nova → teste de regressão

A matriz completa está em [RELATORIO-FINAL.md](RELATORIO-FINAL.md), seção 3 ("Matriz antes → depois"). Resumo: Dashboard virou Visão geral (`/`); Pontos virou Explorar (`/pontos`); as análises do período saíram do Histórico para `/analises`; a exportação ganhou `/relatorios` (e permanece no Histórico); o Laboratório saiu do fim de Pontos para `/laboratorio`; Insights, Comparador, Favoritos, Mapa, CSV, Paleta e Admin mantêm suas funções, com os specs de `web/e2e` correspondentes. Testes unitários relacionados: `stopsApi.test.js`, `readingsCsv.test.js`, `favoriteStops.test.js`, `stopComparison.test.js`, `commandSearch.test.js`, `navItems.test.js`.
