-- =============================================================================
-- ClimaPonto — visibilidade das leituras por origem
--
-- Regras (decisão arquitetural da Etapa 2A):
--   * `simulation` (e `sensor`, medição real futura): públicas quando o ponto
--     é visível para quem consulta (visitantes veem só pontos ativos).
--   * `test`: internas — visíveis apenas para administradores.
--   * Escrita: nenhuma política de INSERT/UPDATE/DELETE para papéis do
--     navegador (inalterado).
--
-- Usa lista de origens PERMITIDAS (e não "diferente de test"), para que uma
-- origem nova adicionada no futuro nasça privada até ser liberada aqui.
--
-- Implementação: ALTER POLICY altera a expressão e o nome da política
-- existente sem removê-la (não há instante sem política, e nenhum DROP).
--
-- A view stop_latest_readings (security_invoker = true) passa a mostrar,
-- para cada perfil, a última leitura que ESSE perfil pode ver: para
-- visitantes, leituras de teste são ignoradas.
-- =============================================================================

alter policy "Leituras de pontos visíveis são públicas"
  on public.readings
  using (
    exists (select 1 from public.stops s where s.id = stop_id)
    and (
      source in ('simulation', 'sensor')
      or (select private.is_admin())
    )
  );

alter policy "Leituras de pontos visíveis são públicas"
  on public.readings
  rename to "Leituras públicas exceto testes; admins veem todas";
