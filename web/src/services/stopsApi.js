import { AppError, toAppError } from './errors.js'

/**
 * Acesso aos pontos de ônibus pela fonte Supabase.
 *
 * O cliente é sempre parâmetro (este módulo não importa supabaseClient.js,
 * que depende de import.meta.env). As permissões são decididas pelo banco
 * (RLS + privilégios por coluna): quando o RLS bloqueia um UPDATE/DELETE, o
 * banco não retorna erro, apenas nenhuma linha afetada — caso tratado aqui
 * como falta de permissão.
 *
 * @typedef {object} Stop
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {string} neighborhood
 * @property {string|null} description
 * @property {number|null} latitude
 * @property {number|null} longitude
 * @property {boolean} isDemo
 * @property {boolean} active
 * @property {string} createdAt
 * @property {string} updatedAt
 */

const STOP_COLUMNS =
  'id, code, name, neighborhood, description, latitude, longitude, is_demo, active, created_at, updated_at'

/**
 * Converte uma linha do banco (snake_case) para o modelo da interface (camelCase).
 * Também usado pelo adaptador mock, para que as duas fontes devolvam o mesmo formato.
 * @returns {Stop}
 */
export function toStop(row) {
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

/** Erro de ponto inexistente ou sem permissão (também usado pelo mock). */
export function noRowsAffected() {
  return new AppError('Ponto não encontrado ou sem permissão para alterá-lo.', { kind: 'permission' })
}

/**
 * Operações de pontos sobre um cliente Supabase.
 * @param {object} client cliente Supabase (nunca null)
 */
export function createSupabaseStopsApi(client) {
  return {
    /**
     * Lista os pontos ordenados pelo código.
     * @param {{ includeInactive?: boolean }} [options] includeInactive inclui pontos
     *   desativados (o banco só os entrega a administradores)
     * @returns {Promise<Stop[]>}
     */
    async listStops({ includeInactive = false } = {}) {
      let query = client.from('stops').select(STOP_COLUMNS).order('code')
      if (!includeInactive) query = query.eq('active', true)

      const { data, error } = await query
      if (error) throw toAppError(error, 'Não foi possível consultar os pontos.')
      return data.map(toStop)
    },

    /** Cria um ponto. `input` já deve estar normalizado (utils/stopValidation). */
    async createStop(input) {
      const { data, error } = await client.from('stops').insert(toWritableRow(input)).select(STOP_COLUMNS)
      if (error) throw toAppError(error, 'Não foi possível cadastrar o ponto.')
      if (!data.length) throw noRowsAffected()
      return toStop(data[0])
    },

    /** Atualiza os campos editáveis de um ponto. */
    async updateStop(id, input) {
      const { data, error } = await client.from('stops').update(toWritableRow(input)).eq('id', id).select(STOP_COLUMNS)
      if (error) throw toAppError(error, 'Não foi possível salvar as alterações.')
      if (!data.length) throw noRowsAffected()
      return toStop(data[0])
    },

    /** Ativa ou desativa um ponto (o histórico de leituras é preservado). */
    async setStopActive(id, active) {
      const { data, error } = await client.from('stops').update({ active }).eq('id', id).select(STOP_COLUMNS)
      if (error) throw toAppError(error, 'Não foi possível alterar a situação do ponto.')
      if (!data.length) throw noRowsAffected()
      return toStop(data[0])
    },

    /**
     * Exclui um ponto. O banco recusa a exclusão de pontos com leituras
     * (erro 23503, traduzido para uma mensagem que sugere desativar).
     */
    async deleteStop(id) {
      const { data, error } = await client.from('stops').delete().eq('id', id).select('id')
      if (error) throw toAppError(error, 'Não foi possível excluir o ponto.')
      if (!data.length) throw noRowsAffected()
    },

    /** Quantidade de leituras de um ponto visíveis para o usuário atual. */
    async countStopReadings(stopId) {
      const { count, error } = await client
        .from('readings')
        .select('id', { count: 'exact', head: true })
        .eq('stop_id', stopId)
      if (error) throw toAppError(error, 'Não foi possível verificar o histórico do ponto.')
      return count ?? 0
    },
  }
}
