/**
 * Pontos DEMONSTRATIVOS locais, no mesmo formato da tabela `stops` do banco
 * (ver supabase/seed.sql). Usados quando o Supabase não está configurado.
 *
 * São fictícios: não correspondem a endereços reais, não têm coordenadas,
 * sensor instalado nem leituras associadas.
 */
const DEMO_DESCRIPTION = 'Ponto fictício usado para demonstrar a interface. Não há sensor instalado.'
const DEMO_CREATED_AT = '2026-11-09T00:00:00Z'

export const demoStops = [
  { code: 'DEMO-01', name: 'Ponto demonstrativo 01', neighborhood: 'Região Central (demonstrativo)' },
  { code: 'DEMO-02', name: 'Ponto demonstrativo 02', neighborhood: 'Zona Sul (demonstrativo)' },
  { code: 'DEMO-03', name: 'Ponto demonstrativo 03', neighborhood: 'Zona Oeste (demonstrativo)' },
].map((stop) => ({
  id: `local-${stop.code}`,
  ...stop,
  description: DEMO_DESCRIPTION,
  latitude: null,
  longitude: null,
  is_demo: true,
  active: true,
  created_at: DEMO_CREATED_AT,
  updated_at: DEMO_CREATED_AT,
}))
