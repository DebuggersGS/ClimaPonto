import { MOCK_SCENARIOS } from '../data/mock/mockDataset.js'
import { dataMode } from './dataSource.js'

/**
 * Cenários do laboratório de sensores (demonstração). Só existem no modo mock:
 * em 'supabase' ou 'unconfigured' devolve null e nenhum dado fictício é exposto.
 * A conectividade de cada cenário NÃO vem daqui: é calculada pela tela a partir
 * da leitura carregada do ponto de mesmo código.
 * @param {string} [mode] modo de dados (padrão: o modo efetivo da aplicação)
 * @returns {Array<{ id: string, title: string, demonstrates: string, code: string }>|null}
 */
export function getSensorLabScenarios(mode = dataMode) {
  if (mode !== 'mock') return null
  return MOCK_SCENARIOS.map(({ id, title, demonstrates, stop }) => ({ id, title, demonstrates, code: stop.code }))
}
