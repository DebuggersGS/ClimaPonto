# Interações e movimento

Fonte dos tokens: `web/src/utils/motionTokens.js` (testado por `motionTokens.test.js`); biblioteca de animação `motion` (`MotionConfig` em `App.jsx`) e peças Base UI em `components/ui/`. Os specs E2E citados **não foram executados pelo agente**.

## Tokens

| Token | Valor |
| --- | --- |
| Duração hover / foco / estado / painel | 150 / 120 / 200 / 260 ms |
| Curvas (cubic-bezier) | standard 0.2,0,0,1; enter 0,0,0.2,1; exit 0.4,0,1,1 |
| Distâncias | hover 2 px, estado 4 px, painel 16 px |
| Escala | clique 0,98; hover 1,02 |
| Movimento reduzido | só opacidade, sem deslocamento nem escala |

## Inventário de microinterações

| # | Interação | Onde | Onde testar |
| --- | --- | --- | --- |
| 1 | Sidebar expande por hover com atraso de intenção, em sobreposição | `layout/MainNav.jsx` | `e2e/sidebar.spec.mjs` |
| 2 | Pin da sidebar, persistido (`sidebarState.js`) | idem | `sidebar.spec.mjs`, `sidebarState.test.js` |
| 3 | Grupos recolhíveis com `aria-expanded` | idem | `sidebar.spec.mjs` |
| 4 | Drawer abaixo de 1280 px | idem | `sidebar.spec.mjs` |
| 5 | Busca com "Limpar busca", Esc e foco visível | `ui/SearchField.jsx` | `interacoes.spec.mjs` |
| 6 | Filtros em popover | `ui/Popover.jsx`, `StopFilterBar.jsx` | `explorar-filtros.spec.mjs` |
| 7 | Painel/sheet do ponto com entrada e foco devolvido | `ficha-ponto` | `ficha-ponto.spec.mjs` |
| 8 | Abas (Ponto 360° e Visão geral) | `ui/Tabs.jsx` | `ponto-360.spec.mjs` |
| 9 | Entrada escalonada (`Reveal`) e seletor segmentado | `ui/Reveal.jsx`, `SegmentedControl.jsx` | `movimento-reduzido.spec.mjs` |
| 10 | Gráfico com entrada animada | `charts/SeriesChart.jsx` | sem spec dedicado |
| 11 | Tooltip por hover e foco | `ui/Tooltip.jsx` | sem spec dedicado |
| 12 | Paleta Ctrl+K (ignorada em campos de texto) | `palette/` | `palette.spec.mjs`, `interacoes.spec.mjs` |

## Regras

- Nenhuma ação depende só de hover; todas têm equivalente por teclado ou toque.
- Com `prefers-reduced-motion`, as transições caem para opacidade ou duração zero (`interacoes.spec.mjs`).
- Não foi medido desempenho (jank) nem gravado vídeo; isso segue como pendência (BLOCKERS).
