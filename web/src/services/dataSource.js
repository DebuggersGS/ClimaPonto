import { createDataSource } from './dataSourceFactory.js'
import { isSupabaseConfigured, supabase } from './supabaseClient.js'

/**
 * Fonte de dados da aplicação: o ÚNICO lugar que lê import.meta.env.VITE_DATA_MODE
 * e a configuração do Supabase. readingsService.js e stopsService.js delegam
 * para `readingsApi` e `stopsApi`; hooks e páginas só conhecem `dataMode`
 * ('mock' | 'supabase' | 'unconfigured') para sinalização.
 *
 * Os parâmetros de URL ?mock=erro e ?mock=lento só são lidos no modo mock
 * (uma vez, ao carregar a página) e servem para conferir os estados de erro
 * e de carregamento lento.
 */
export const { dataMode, readingsApi, stopsApi } = createDataSource({
  requestedMode: import.meta.env.VITE_DATA_MODE,
  supabaseConfigured: isSupabaseConfigured,
  client: supabase,
  getSearch: () => window.location.search,
})
