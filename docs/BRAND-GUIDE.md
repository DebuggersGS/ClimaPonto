# Guia de marca — ClimaPonto

Ativos em `web/public/brand/` (descrição dos arquivos em `README-MARCA.md`, na mesma pasta). A arte original é **raster (PNG)**; não há SVG vetorial autêntico.

## Paleta e tokens

Definidos em `web/src/styles/index.css` (`@theme`):

| Uso | Token | Valor |
| --- | --- | --- |
| Marca principal | `brand-600` | `#0b6bcb` |
| Marca, hover/texto forte | `brand-700` / `brand-800` | `#0a56a3` / `#0b4580` |
| Marca, realce | `brand-500` | `#2b8be0` |
| Acento (decorativo) | `accent-500` | `#0891b2` |
| Tinta escura | `ink` | `#0b1220` |
| Superfície clara / escura | `surface` | `#ffffff` / `#111a2b` |

`theme-color` em `index.html`: `#0b6bcb` (claro) e `#0a0f1a` (escuro, igual a `surface-muted` no tema escuro). O símbolo usa ainda âmbar (onda térmica) e ciano (dados), que são da arte e não tokens de interface. O ciano é só decorativo, nunca cor de texto sobre branco.

## Variações

- **Wordmark claro** (`climaponto-logo-light.png`): fundos claros.
- **Wordmark escuro** (`climaponto-logo-dark.png`): fundos escuros; a interface alterna por `prefers-color-scheme`.
- **Símbolo** (`climaponto-mark-transparent.png`): barra lateral recolhida e usos quadrados.
- **Favicon** (`favicon.ico`, 16/32/48/64 px), **apple-touch-icon** (180 px), **PWA** (192/512 px) e **Open Graph** (1200x630).

## Bom uso

- Usar o wordmark com `alt="ClimaPonto"` e largura/altura declaradas.
- Manter área livre ao redor equivalente à altura do "C" do símbolo.
- Trocar a variação conforme o fundo (claro/escuro).

## Mau uso

- Não esticar, girar, recolorir nem aplicar sombras ou efeitos.
- Não colocar o wordmark claro sobre fundo escuro (nem o inverso) nem sobre imagens que reduzam o contraste.
- Não reintroduzir ícones genéricos (ônibus, termômetro) como logotipo.
- Não apresentar a arte como vetorial.

## Legibilidade em 16 px

O símbolo tem detalhes finos (onda térmica e elementos de dados) que **perdem definição em 16 px**; nessa dimensão o favicon é reconhecível pela forma e pelas cores, não pelos detalhes. Se for necessário, criar uma versão vetorial simplificada própria para 16 px. Revisão visual em 16/32/64 px, em fundo claro e escuro, ainda depende de inspeção humana no navegador.
