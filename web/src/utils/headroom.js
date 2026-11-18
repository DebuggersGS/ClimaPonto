/**
 * Regra pura do cabeçalho que se esconde na rolagem (sem DOM).
 * - Perto do topo (até TOP_ZONE px) o cabeçalho sempre aparece.
 * - Movimentos menores que THRESHOLD px são ignorados (evita tremulação com trackpad e rolagem elástica).
 * - Rolar para baixo esconde; rolar para cima mostra.
 */
export const HEADROOM_TOP_ZONE = 72
export const HEADROOM_THRESHOLD = 8

/**
 * @param {{ hidden: boolean, lastY: number, y: number }} state posição anterior de referência e atual
 * @returns {{ hidden: boolean, lastY: number }} novo estado; `lastY` só avança quando o movimento conta
 */
export function nextHeadroomState({ hidden, lastY, y }) {
  const safeY = Number.isFinite(y) ? Math.max(0, y) : 0
  if (safeY <= HEADROOM_TOP_ZONE) return { hidden: false, lastY: safeY }
  const delta = safeY - lastY
  if (Math.abs(delta) < HEADROOM_THRESHOLD) return { hidden, lastY }
  return { hidden: delta > 0, lastY: safeY }
}
