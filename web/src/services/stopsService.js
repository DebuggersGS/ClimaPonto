import { demoStops } from '../data/demoStops.js'
import { isSupabaseConfigured, supabase } from './supabaseClient.js'

/**
 * Camada de acesso a dados dos pontos de ônibus.
 *
 * - Com Supabase configurado (.env.local): consulta a tabela `stops`.
 * - Sem configuração: usa os dados demonstrativos locais.
 *
 * Se o Supabase estiver configurado e falhar, o erro é propagado — a
 * aplicação não troca silenciosamente para dados locais.
 */

/** Origem dos dados usada pela camada de serviços. */
export const stopsDataSource = isSupabaseConfigured ? 'supabase' : 'local'

const STOP_COLUMNS =
  'id, code, name, neighborhood, description, latitude, longitude, is_demo, active, created_at, updated_at'

/** Converte uma linha do banco (snake_case) para o modelo da interface (camelCase). */
function toStop(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    neighborhood: row.neighborhood,
    description: row.description ?? null,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    isDemo: row.is_demo,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Lista os pontos visíveis para o usuário atual, ordenados pelo código. */
export async function listStops() {
  if (!supabase) {
    return demoStops.map(toStop)
  }

  const { data, error } = await supabase.from('stops').select(STOP_COLUMNS).order('code')

  if (error) {
    throw new Error(`Falha ao consultar pontos no Supabase: ${error.message}`, { cause: error })
  }

  return data.map(toStop)
}
