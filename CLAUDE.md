# ClimaPonto — instruções para o Claude Code

Protótipo acadêmico (Global Solution FIAP 2026.2, entrega em **19/11/2026**): monitoramento de calor urbano em pontos de ônibus de São Paulo. Contexto completo em `README.md`; decisões em `docs/architecture-decisions.md`; contrato IoT em `docs/data-contract.md`; segurança em `docs/security-review.md`.

## Papéis

- **ChatGPT:** arquiteto e revisor; define o escopo de cada etapa.
- **Claude Code:** execução técnica, com autonomia. Só pedir ação ao Enrico quando for indispensável (painel do Supabase, Vercel, decisões de produto).
- Não começar uma etapa antes da aprovação; não implementar funcionalidades antecipadamente.

## Regras de trabalho

- Idioma: português (código, commits, documentos, interface). Commits pequenos e significativos, no estilo `tipo(escopo): descrição`.
- Não reescrever o histórico Git. Push só quando pedido.
- Sem bibliotecas novas sem justificativa registrada em `docs/architecture-decisions.md`.
- Ao fim de cada etapa: atualizar `README.md` (O que já funciona / Pendente) e `AI.md` (registro do uso de IA — só ações e testes que realmente aconteceram).
- Nunca inventar medições, resultados de testes ou dados de sensores. Dados `simulation`/`test`/demonstrativos devem ser sinalizados na interface.

## Supabase

- Remoto: projeto `climaponto-gs-2026` (ref `magtdcljcobsojaqjbqi`). Local: `supabase/config.toml` (`climaponto-local`, Docker). A pasta **não** é vinculada ao remoto.
- **Remoto:** só leitura sem autorização explícita. Nunca `db push`, `db reset --linked/--remote` nem alterar dados. Migrações remotas: testar antes no local (`supabase/tests/rls_policies.test.sql`), escrever plano de recuperação e pedir aprovação. Evitar `DROP` (a integração recusa).
- Toda migração nova precisa de `GRANT` explícito (privilégios padrão foram revogados, inclusive `EXECUTE` de funções e acesso de `service_role`).
- Front-end usa só a chave **publishable**. Nunca secret/service_role em `VITE_*`, no Git ou em projeto Wokwi público. Leituras só entram por endpoint de ingestão no servidor, nunca pelo navegador.
- Admin = `app_metadata.role = 'admin'`; RLS é a autoridade, a interface só esconde.

## Front-end (`web/`)

- React 19 + Vite + Tailwind 4 + React Router, JavaScript/JSX.
- Camadas: `pages/`/`components/` (apresentação) → `hooks/` (estado) → `services/` (dados e tradução de erros) → `utils/` (funções puras).
- Verificar antes de concluir: `npm run lint`, `npm run build`, `npm run check:supabase` (visitante, remoto, somente leitura). Acessibilidade: estado nunca só por cor, contraste AA, sem rolagem horizontal em 375 px.
- Ferramentas de teste de interface (Chrome headless, axe-core) ficam fora do repositório, na pasta temporária da sessão.
