-- =============================================================================
-- ClimaPonto — dados demonstrativos
--
-- Pontos FICTÍCIOS para exibição do protótipo. Não correspondem a endereços
-- reais, não possuem coordenadas e estão marcados com is_demo = true.
-- Nenhuma leitura é inserida aqui.
--
-- Idempotente: pode ser executado mais de uma vez sem duplicar registros.
-- =============================================================================

insert into public.stops (code, name, neighborhood, description, is_demo, active)
values
  ('DEMO-01', 'Ponto demonstrativo 01', 'Região Central (demonstrativo)',
   'Ponto fictício usado para demonstrar a interface. Não há sensor instalado.', true, true),
  ('DEMO-02', 'Ponto demonstrativo 02', 'Zona Sul (demonstrativo)',
   'Ponto fictício usado para demonstrar a interface. Não há sensor instalado.', true, true),
  ('DEMO-03', 'Ponto demonstrativo 03', 'Zona Oeste (demonstrativo)',
   'Ponto fictício usado para demonstrar a interface. Não há sensor instalado.', true, true)
on conflict (code) do nothing;
