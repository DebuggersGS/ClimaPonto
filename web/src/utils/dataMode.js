/**
 * Modo de dados da aplicação (VITE_DATA_MODE): decide se Dashboard, Histórico
 * e Pontos leem do Supabase ou do dataset mock local. Função pura: quem lê
 * import.meta.env é services/dataSource.js.
 *
 * Regra de segurança: o modo 'supabase' sem configuração NUNCA cai para o
 * mock (resultado 'unconfigured'); só 'auto' escolhe o mock por falta de
 * configuração, e isso é sinalizado de forma persistente na interface.
 */

/** Valores aceitos em VITE_DATA_MODE. */
export const REQUESTED_DATA_MODES = ['mock', 'supabase', 'auto']

/** Valor assumido quando VITE_DATA_MODE está ausente, vazio ou inválido. */
export const DEFAULT_REQUESTED_DATA_MODE = 'auto'

/** Rótulo e descrição (pt-BR) de cada modo EFETIVO, para a sinalização no shell. */
export const DATA_MODE_INFO = {
  mock: {
    label: 'Modo demonstração',
    description: 'Dados fictícios gerados localmente. Nenhuma medição real e nenhuma consulta ao Supabase.',
  },
  supabase: {
    label: 'Dados do Supabase',
    description: 'Leituras e pontos vindos do banco de dados do projeto.',
  },
  unconfigured: {
    label: 'Supabase não configurado',
    description: 'Defina web/.env.local com as chaves do Supabase ou use VITE_DATA_MODE=mock.',
  },
}

/**
 * Normaliza o valor pedido: remove espaços e ignora maiúsculas. Ausente,
 * vazio ou desconhecido vira 'auto'.
 * @param {unknown} value
 * @returns {{ requested: 'mock'|'supabase'|'auto', isValid: boolean }}
 *   isValid é false para valor presente mas desconhecido
 */
function parseRequestedMode(value) {
  const isAbsent = value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
  if (isAbsent) return { requested: DEFAULT_REQUESTED_DATA_MODE, isValid: true }
  const text = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (REQUESTED_DATA_MODES.includes(text)) return { requested: text, isValid: true }
  return { requested: DEFAULT_REQUESTED_DATA_MODE, isValid: false }
}

/**
 * Resolve o modo efetivo de dados.
 *
 * @param {unknown} requested valor de VITE_DATA_MODE (mock | supabase | auto)
 * @param {{ supabaseConfigured: boolean }} options
 * @returns {{ mode: 'mock'|'supabase'|'unconfigured', requested: 'mock'|'supabase'|'auto', reason: string }}
 *   requested é o valor já normalizado; reason explica a escolha em português
 */
export function resolveDataMode(requested, { supabaseConfigured }) {
  const parsed = parseRequestedMode(requested)
  const prefix = parsed.isValid ? '' : 'Valor de VITE_DATA_MODE inválido; usando "auto". '

  if (parsed.requested === 'mock') {
    return { mode: 'mock', requested: 'mock', reason: 'VITE_DATA_MODE=mock: dados fictícios locais.' }
  }
  if (parsed.requested === 'supabase') {
    return supabaseConfigured
      ? { mode: 'supabase', requested: 'supabase', reason: 'VITE_DATA_MODE=supabase com Supabase configurado.' }
      : {
          mode: 'unconfigured',
          requested: 'supabase',
          reason: 'VITE_DATA_MODE=supabase, mas o Supabase não está configurado; os dados mock não são usados.',
        }
  }
  return supabaseConfigured
    ? { mode: 'supabase', requested: 'auto', reason: `${prefix}Modo automático: Supabase configurado.` }
    : { mode: 'mock', requested: 'auto', reason: `${prefix}Modo automático: Supabase não configurado, usando dados fictícios locais.` }
}

/**
 * Rótulo e descrição do modo efetivo (desconhecido → trata como não configurado).
 * @param {string} mode
 * @returns {{ label: string, description: string }}
 */
export function getDataModeInfo(mode) {
  return DATA_MODE_INFO[mode] ?? DATA_MODE_INFO.unconfigured
}
