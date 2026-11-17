/**
 * Conjunto de dados exibido: 'observado' (Supabase) ou 'demonstrativo'
 * (cenários didáticos locais). Função pura: quem lê URL e localStorage é
 * services/dataSource.js (e o storage é injetado aqui).
 *
 * Regras de integridade científica:
 * - build mock => sempre demonstrativo (não há outro conjunto);
 * - build unconfigured => sempre observado, ou seja, indisponível: NUNCA cai
 *   para o mock, para não mascarar a falta de configuração com dados fictícios;
 * - build supabase => observado por padrão; o demonstrativo só entra por
 *   escolha explícita (parâmetro de URL ou preferência local), e a URL vence a
 *   preferência para que um link compartilhado mostre exatamente o que se quis.
 */

/** Conjuntos de dados possíveis. */
export const DATA_SCENARIOS = ['observado', 'demonstrativo']

/** Parâmetro de URL que escolhe o conjunto (ex.: ?dados=demonstracao). */
export const DATA_SCENARIO_PARAM = 'dados'

/** Chave da preferência local (só guarda 'observado' ou 'demonstrativo'). */
export const DATA_SCENARIO_STORAGE_KEY = 'climaponto:conjunto-de-dados'

/** Valor escrito na URL para cada conjunto. */
export const DATA_SCENARIO_URL_VALUES = { observado: 'observado', demonstrativo: 'demonstracao' }

const URL_ALIASES = {
  observado: 'observado',
  observados: 'observado',
  demonstracao: 'demonstrativo',
  demonstrativo: 'demonstrativo',
  demonstrativos: 'demonstrativo',
}

/** Rótulos pt-BR do seletor e do selo permanente. */
export const DATA_SCENARIO_INFO = {
  observado: {
    label: 'Dados observados',
    description: 'Pontos e leituras vindos do banco de dados do projeto.',
  },
  demonstrativo: {
    label: 'Cenários demonstrativos',
    description:
      'Cenários didáticos gerados localmente: não são medições reais, são somente leitura e nunca entram nos dados observados.',
    badgeLabel: 'Demonstrativo',
  },
}

/** Normaliza texto de URL/storage para um conjunto conhecido ou null. */
function parseScenarioValue(value) {
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase()
  return Object.hasOwn(URL_ALIASES, key) ? URL_ALIASES[key] : null
}

/**
 * Lê o conjunto pedido na URL.
 * @param {string|null|undefined} search query string (ex.: window.location.search)
 * @returns {'observado'|'demonstrativo'|null} null se ausente ou desconhecido
 */
export function parseScenarioParam(search) {
  return parseScenarioValue(new URLSearchParams(search ?? '').get(DATA_SCENARIO_PARAM))
}

/**
 * Lê a preferência local já recuperada do storage (só valores exatos dos
 * conjuntos; qualquer outra coisa é ignorada).
 * @param {unknown} raw
 * @returns {'observado'|'demonstrativo'|null}
 */
export function parseStoredScenario(raw) {
  return typeof raw === 'string' && DATA_SCENARIOS.includes(raw) ? raw : null
}

/**
 * Resolve o conjunto efetivo.
 *
 * @param {object} input
 * @param {'mock'|'supabase'|'unconfigured'} input.buildMode modo de build (utils/dataMode)
 * @param {string} [input.search] query string da URL
 * @param {unknown} [input.stored] preferência local lida do storage
 * @returns {{ scenario: 'observado'|'demonstrativo', canSwitch: boolean,
 *   source: 'build'|'url'|'preference'|'default', reason: string }}
 *   canSwitch: só o build supabase permite alternar o conjunto
 */
export function resolveDataScenario({ buildMode, search, stored }) {
  if (buildMode === 'mock') {
    return {
      scenario: 'demonstrativo',
      canSwitch: false,
      source: 'build',
      reason: 'Build em modo demonstração: só há cenários demonstrativos.',
    }
  }
  if (buildMode !== 'supabase') {
    return {
      scenario: 'observado',
      canSwitch: false,
      source: 'build',
      reason: 'Supabase não configurado: os cenários demonstrativos não substituem os dados observados.',
    }
  }
  const fromUrl = parseScenarioParam(search)
  if (fromUrl) {
    return { scenario: fromUrl, canSwitch: true, source: 'url', reason: `Parâmetro ?${DATA_SCENARIO_PARAM}= na URL.` }
  }
  const fromStorage = parseStoredScenario(stored)
  if (fromStorage) {
    return { scenario: fromStorage, canSwitch: true, source: 'preference', reason: 'Preferência salva neste navegador.' }
  }
  return { scenario: 'observado', canSwitch: true, source: 'default', reason: 'Padrão: dados observados.' }
}

/**
 * Query string com o conjunto escolhido, preservando os demais parâmetros.
 * Sempre escreve o valor explícito (inclusive 'observado'), para que a URL
 * vença uma preferência local anterior de demonstrativo.
 * @param {string|null|undefined} search
 * @param {'observado'|'demonstrativo'} scenario
 * @returns {string} começa com '?' ou é vazia se não houver parâmetros
 */
export function buildScenarioSearch(search, scenario) {
  const params = new URLSearchParams(search ?? '')
  if (Object.hasOwn(DATA_SCENARIO_URL_VALUES, scenario)) {
    params.set(DATA_SCENARIO_PARAM, DATA_SCENARIO_URL_VALUES[scenario])
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}

/**
 * Lê a preferência do storage sem nunca lançar (storage ausente, bloqueado ou
 * com valor inválido => null).
 * @param {{ getItem: (key: string) => string|null }|null|undefined} storage
 */
export function readStoredScenario(storage) {
  try {
    return parseStoredScenario(storage?.getItem(DATA_SCENARIO_STORAGE_KEY))
  } catch {
    return null
  }
}

/**
 * Grava a preferência, tolerando storage indisponível.
 * @param {{ setItem: (key: string, value: string) => void }|null|undefined} storage
 * @param {'observado'|'demonstrativo'} scenario
 * @returns {boolean} true se gravou
 */
export function writeStoredScenario(storage, scenario) {
  if (!DATA_SCENARIOS.includes(scenario)) return false
  try {
    storage.setItem(DATA_SCENARIO_STORAGE_KEY, scenario)
    return true
  } catch {
    // Sem persistência: a escolha vale pela URL nesta visita.
    return false
  }
}

/**
 * Rótulo e descrição de um conjunto (desconhecido => observado, nunca demonstrativo).
 * @param {string} scenario
 */
export function getDataScenarioInfo(scenario) {
  return DATA_SCENARIO_INFO[scenario] ?? DATA_SCENARIO_INFO.observado
}
