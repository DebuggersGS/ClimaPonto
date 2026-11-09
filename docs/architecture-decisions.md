# Decisões arquiteturais — ClimaPonto

Registro curto das decisões técnicas do front-end e da infraestrutura de dados. Cada item indica se a decisão foi **aprovada** pela revisão técnica ou se ainda é **proposta**.

| # | Decisão | Status |
| --- | --- | --- |
| 1 | React 19 + Vite + Tailwind CSS 4, JavaScript/JSX, npm | Aprovada (Etapa 1) |
| 2 | React Router para navegação | Aprovada (Etapa 1) |
| 3 | Oxlint como linter (padrão do template Vite) | Aprovada (Etapa 1) |
| 4 | Supabase como backend (PostgreSQL + API REST + Auth) | Aprovada (Etapa 2A) |
| 5 | Repositório GitHub privado `climaponto-gs-2026` | Aprovada (Etapa 2A) |
| 6–14 | Itens abaixo | Propostas — aguardam revisão |

## 6. Duas tabelas: `stops` e `readings`

Leituras referenciam pontos por `stop_id` com `ON DELETE RESTRICT`: um ponto com histórico não pode ser apagado, apenas desativado (`active = false`). Preserva o histórico e evita perda acidental de dados.

## 7. Campo `is_demo` em `stops`

Campo adicional (não previsto na lista inicial) para marcar pontos fictícios no próprio banco, de forma que a interface possa sinalizá-los sem depender do nome.

## 8. Restrições como `CHECK` em vez de `ENUM`

`environmental_status` e `source` são texto com `CHECK`. Alterar a lista de valores exige apenas recriar a restrição, o que é mais simples que alterar um tipo `ENUM`.

## 9. Faixas de plausibilidade, não limites ambientais

O banco rejeita apenas valores fisicamente impossíveis para o sensor previsto (DHT22: −40 a 80 °C, 0 a 100 %). Os limites de "atenção"/"crítico" não estão no banco porque ainda não foram aprovados.

## 10. Conectividade calculada, não armazenada

O estado online/atrasado/offline depende da idade da última leitura e muda com o passar do tempo, mesmo sem novos dados. Por isso é calculado na leitura (view `stop_latest_readings` + regra no front-end), e não gravado.

## 11. Administradores via `app_metadata.role = 'admin'`

- Contas administrativas são criadas manualmente no painel do Supabase; o cadastro público deve ser desabilitado.
- O papel fica em `app_metadata`, que só pode ser alterado com credencial de servidor. Um usuário não consegue se promover.
- As políticas usam a função `private.is_admin()`, em um schema não exposto pela API.
- Alternativa descartada por ora: tabela `admins`. Seria útil se houvesse vários papéis ou gestão de admins pela própria aplicação.

## 12. Grants explícitos + RLS (defesa em profundidade)

As permissões de tabela são revogadas e concedidas explicitamente: visitantes têm apenas `SELECT`; `authenticated` tem escrita em `stops`, filtrada pelo RLS para admins; ninguém do navegador tem escrita em `readings`. Assim a segurança não depende dos privilégios padrão do projeto.

## 13. Ingestão de leituras por Edge Function (a implementar)

O ESP32 não grava direto no banco. Uma Supabase Edge Function receberá a leitura, validará uma credencial do dispositivo e gravará com credencial de servidor. É o recurso mínimo para não expor escrita pública. Detalhes em [data-contract.md](data-contract.md#71-endpoint-de-ingestão-para-o-esp32-proposta).

## 14. Fallback local apenas sem configuração

Sem as variáveis `VITE_SUPABASE_*`, a aplicação usa dados demonstrativos locais (útil para quem só quer rodar a interface). Com o Supabase configurado, falhas são exibidas como erro, sem troca silenciosa para dados locais.
