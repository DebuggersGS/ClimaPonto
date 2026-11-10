import { demoStops } from '../data/demoStops.js'
import { AppError, toAppError } from './errors.js'
import { isSupabaseConfigured, supabase } from './supabaseClient.js'

/**
 * Camada de acesso a dados dos pontos de ônibus.
 *
 * - Com Supabase configurado (.env.local): consulta e altera a tabela `stops`.
 * - Sem configuração: leitura dos dados demonstrativos locais; operações de
 *   escrita ficam indisponíveis.
 *
 * Se o Supabase estiver configurado e falhar, o erro é propagado — a
 * aplicação não troca silenciosamente para dados locais.
 *
 * As permissões são decididas pelo banco (RLS + privilégios por coluna).
 * Quando o RLS bloqueia um UPDATE/DELETE, o banco não retorna erro: apenas
 * nenhuma linha é afetada. Esse caso é tratado aqui como falta de permissão.
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

/**
 * Converte o modelo da interface para as colunas GRAVÁVEIS do banco.
 * id, created_at e updated_at nunca são enviados (o banco os controla).
 */
function toWritableRow(input) {
  return {
    code: input.code,
    name: input.name,
    neighborhood: input.neighborhood,
    description: input.description,
    latitude: input.latitude,
    longitude: input.longitude,
    is_demo: input.isDemo,
    active: input.active,
  }
}

function requireSupabase() {
  if (!supabase) {
    throw new AppError('O cadastro de pontos exige o Supabase configurado.', { kind: 'unknown' })
  }
  return supabase
}

function noRowsAffected() {
  return new AppError('Ponto não encontrado ou sem permissão para alterá-lo.', { kind: 'permission' })
}

/**
 * Lista os pontos ordenados pelo código.
 * @param {{ includeInactive?: boolean }} [options]
 *   includeInactive: inclui pontos desativados (o banco só os entrega a admins).
 */
export async function listStops({ includeInactive = false } = {}) {
  if (!supabase) {
    return demoStops.map(toStop).filter((stop) => includeInactive || stop.active)
  }

  let query = supabase.from('stops').select(STOP_COLUMNS).order('code')
  if (!includeInactive) query = query.eq('active', true)

  const { data, error } = await query
  if (error) throw toAppError(error, 'Não foi possível consultar os pontos.')
  return data.map(toStop)
}

/** Cria um ponto. `input` já deve estar normalizado (utils/stopValidation). */
export async function createStop(input) {
  const { data, error } = await requireSupabase().from('stops').insert(toWritableRow(input)).select(STOP_COLUMNS)
  if (error) throw toAppError(error, 'Não foi possível cadastrar o ponto.')
  if (!data.length) throw noRowsAffected()
  return toStop(data[0])
}

/** Atualiza os campos editáveis de um ponto. */
export async function updateStop(id, input) {
  const { data, error } = await requireSupabase()
    .from('stops')
    .update(toWritableRow(input))
    .eq('id', id)
    .select(STOP_COLUMNS)
  if (error) throw toAppError(error, 'Não foi possível salvar as alterações.')
  if (!data.length) throw noRowsAffected()
  return toStop(data[0])
}

/** Ativa ou desativa um ponto (o histórico de leituras é preservado). */
export async function setStopActive(id, active) {
  const { data, error } = await requireSupabase().from('stops').update({ active }).eq('id', id).select(STOP_COLUMNS)
  if (error) throw toAppError(error, 'Não foi possível alterar a situação do ponto.')
  if (!data.length) throw noRowsAffected()
  return toStop(data[0])
}

/**
 * Exclui um ponto. O banco recusa a exclusão de pontos com leituras
 * (erro 23503, traduzido para uma mensagem que sugere desativar).
 */
export async function deleteStop(id) {
  const { data, error } = await requireSupabase().from('stops').delete().eq('id', id).select('id')
  if (error) throw toAppError(error, 'Não foi possível excluir o ponto.')
  if (!data.length) throw noRowsAffected()
}

/** Quantidade de leituras de um ponto visíveis para o usuário atual. */
export async function countStopReadings(stopId) {
  const { count, error } = await requireSupabase()
    .from('readings')
    .select('id', { count: 'exact', head: true })
    .eq('stop_id', stopId)
  if (error) throw toAppError(error, 'Não foi possível verificar o histórico do ponto.')
  return count ?? 0
}
