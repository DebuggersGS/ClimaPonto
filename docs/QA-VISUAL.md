# QA visual

## O que foi verificado

- Lint e testes unitários `node:test` (execuções listadas em [RELATORIO-FINAL.md](RELATORIO-FINAL.md)).
- Leitura do código dos componentes e escrita dos specs E2E.

## O que NÃO foi verificado

- Nenhum spec E2E foi executado pelo agente (sem navegador no sandbox); o gate do harness ainda não rodou sobre esta rodada.
- Nenhuma captura de tela, antes/depois ou vídeo foi gerada ou inspecionada por humano.
- Não há referências aprovadas de `toHaveScreenshot`.
- Mapa renderizado com tiles reais, contraste AA, 375/768/1366 px e temas claro/escuro não foram vistos por pessoa.
- Lighthouse e Core Web Vitals não medidos.

Aceite visual humano segue pendente (BLOCKERS item 6). Nenhuma imagem foi inventada.
