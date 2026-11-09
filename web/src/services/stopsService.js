import { demoStops } from '../data/demoStops.js'

/**
 * Camada de acesso a dados dos pontos de ônibus.
 *
 * Por enquanto retorna os dados demonstrativos locais. Quando a API externa
 * for definida, apenas este arquivo deverá mudar — os componentes e hooks
 * continuam consumindo a mesma função assíncrona.
 */
export async function listStops() {
  return demoStops.map((stop) => ({ ...stop }))
}
