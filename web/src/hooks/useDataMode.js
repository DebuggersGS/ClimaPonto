import { dataMode } from '../services/dataSource.js'
import { getDataModeInfo } from '../utils/dataMode.js'

/**
 * Modo efetivo do CONTEÚDO exibido para a sinalização persistente no shell:
 * 'mock' também quando o build é Supabase e os cenários demonstrativos estão
 * escolhidos (ver useDataScenario). O modo é fixo durante a sessão, por isso
 * não há estado React.
 * @returns {{ mode: 'mock'|'supabase'|'unconfigured', label: string, description: string }}
 */
export function useDataMode() {
  return { mode: dataMode, ...getDataModeInfo(dataMode) }
}
