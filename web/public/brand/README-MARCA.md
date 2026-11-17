# ClimaPonto — Identidade visual (proposta v1)

Identidade original produzida para o projeto, tendo como símbolo um localizador estilizado em **C**, com onda térmica em âmbar e elementos de dados em ciano. Não é um emoji ou ícone genérico de ônibus.

## Arquivos

- `climaponto-logo-light.png`: wordmark para fundo claro.
- `climaponto-logo-dark.png`: wordmark adaptado para fundo escuro (conversão automática da parte azul-escura da tipografia para tom claro).
- `climaponto-mark-transparent.png`: símbolo isolado, ideal para navbar, sidebar e redesenho vetorial posterior.
- `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `favicon-64x64.png`: navegação.
- `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`: ícones de app.
- `climaponto-og-image.png`: compartilhamento social Open Graph.
- `fonte-gerada-logo.png`: composição original gerada.

## Integração sugerida

Copiar para `web/public/brand/`, configurar `web/index.html` (`rel=icon`, `apple-touch-icon`, `og:image`), `manifest.webmanifest` se PWA for aprovado, `theme-color`, e inserir wordmark e símbolo responsivamente no layout. Não enviar `favicon` com arquivos ausentes ou path incorreto.

**Validação obrigatória:** revisar visualmente em 16/32/64 px, fundo claro e escuro, navegador e dispositivo móvel. O ícone de 16 px pode exigir refinamento vetorial simplificado para continuar legível. Conferir contraste, dimensões e atribuições. A arte original é raster; não atribuir SVG autêntico nem editabilidade vetorial.

**Status:** conceito/ativos prontos para integração, não instalados no projeto. A aprovação final de cores, estilo e aplicação depende da inspeção do resultado na interface real.
