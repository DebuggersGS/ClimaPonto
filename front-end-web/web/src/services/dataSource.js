import { createDataSource } from './dataSourceFactory.js'
import { isSupabaseConfigured, supabase } from './supabaseClient.js'
import { readStoredScenario } from '../utils/dataScenario.js'

/** localStorage ou null quando o navegador bloqueia o acesso (modo privado, política). */
function getStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Fonte de dados da aplicação: o ÚNICO lugar que lê import.meta.env.VITE_DATA_MODE
 * e a configuração do Supabase. readingsService.js e stopsService.js delegam
 * para `readingsApi` e `stopsApi`, e authService.js para `authApi`; hooks e páginas só conhecem `dataMode`
 * ('mock' | 'supabase' | 'unconfigured') para sinalização.
 *
 * `dataMode` descreve o CONTEÚDO exibido: no build supabase com os cenários
 * demonstrativos escolhidos (?dados=demonstracao ou preferência local) vale
 * 'mock', e a interface sinaliza demonstração. `buildMode` é o modo de build e
 * `dataScenario` o conjunto resolvido (utils/dataScenario). O conjunto é fixo
 * durante a sessão: trocar exige recarregar a página (ver hooks/useDataScenario).
 *
 * Os parâmetros de URL ?mock=erro e ?mock=lento só são lidos no modo mock
 * (uma vez, ao carregar a página) e servem para conferir os estados de erro
 * e de carregamento lento.
 */
export const { dataMode, buildMode, dataScenario, readingsApi, stopsApi, authApi } = createDataSource({
  requestedMode: import.meta.env.VITE_DATA_MODE,
  supabaseConfigured: isSupabaseConfigured,
  client: supabase,
  getSearch: () => window.location.search,
  getScenarioInput: () => ({ search: window.location.search, stored: readStoredScenario(getStorage()) }),
})
