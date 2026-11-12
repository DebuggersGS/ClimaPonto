import { dataMode } from '../services/dataSource.js'
import { getDataModeInfo } from '../utils/dataMode.js'

/**
 * Modo efetivo de dados para a sinalização persistente no shell.
 * O modo é fixo durante a sessão (definido no build/ambiente), por isso não
 * há estado React.
 * @returns {{ mode: 'mock'|'supabase'|'unconfigured', label: string, description: string }}
 */
export function useDataMode() {
  return { mode: dataMode, ...getDataModeInfo(dataMode) }
}
