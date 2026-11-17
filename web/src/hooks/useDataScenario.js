import { useCallback } from 'react'
import { buildMode, dataScenario } from '../services/dataSource.js'
import { buildScenarioSearch, getDataScenarioInfo, writeStoredScenario } from '../utils/dataScenario.js'

/**
 * Conjunto de dados exibido ('observado' | 'demonstrativo') e troca entre eles.
 *
 * O conjunto é fixo por carregamento: a fonte de dados é um módulo único e os
 * hooks de leitura guardam o que já carregaram. Por isso trocar grava a
 * preferência, escreve ?dados= na URL e RECARREGA a página, o que garante que
 * nenhum dado de um conjunto sobreviva no outro.
 *
 * @returns {{ scenario: 'observado'|'demonstrativo', isDemonstrative: boolean, canSwitch: boolean,
 *   buildMode: string, label: string, description: string, badgeLabel?: string,
 *   setScenario: (next: 'observado'|'demonstrativo') => void }}
 */
export function useDataScenario() {
  const { scenario, canSwitch } = dataScenario

  const setScenario = useCallback(
    (next) => {
      if (!canSwitch || next === scenario) return
      let storage = null
      try {
        storage = window.localStorage
      } catch {
        // Armazenamento bloqueado: a escolha vale pela URL.
      }
      writeStoredScenario(storage, next)
      const { pathname, search, hash } = window.location
      window.location.assign(`${pathname}${buildScenarioSearch(search, next)}${hash}`)
    },
    [canSwitch, scenario],
  )

  return {
    scenario,
    isDemonstrative: scenario === 'demonstrativo',
    canSwitch,
    buildMode,
    ...getDataScenarioInfo(scenario),
    setScenario,
  }
}
