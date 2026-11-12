/**
 * Converte erros do Supabase (Auth, Data API/PostgREST, rede) em mensagens
 * em português para a interface. O erro original é preservado em `cause`.
 *
 * Códigos de referência: docs/data-contract.md, seção 8.
 */

export class AppError extends Error {
  /**
   * @param {string} message  mensagem para o usuário
   * @param {object} [options]
   * @param {string} [options.kind]   categoria: permission, session, conflict, validation, integrity, network, aborted, unknown
   * @param {string} [options.field]  campo do formulário relacionado, quando houver
   * @param {unknown} [options.cause] erro original
   */
  constructor(message, { kind = 'unknown', field = null, cause } = {}) {
    super(message, { cause })
    this.name = 'AppError'
    this.kind = kind
    this.field = field
  }
}

const SESSION_CODES = new Set(['PGRST301', 'PGRST302', 'PGRST303', 'session_expired', 'refresh_token_not_found'])

/** Traduz um erro de operação no banco (PostgREST) para AppError. */
export function toAppError(error, fallback = 'Não foi possível concluir a operação.') {
  if (error instanceof AppError) return error

  const code = error?.code ?? ''
  const message = error?.message ?? ''

  if (SESSION_CODES.has(code) || /jwt expired/i.test(message)) {
    return new AppError('Sua sessão expirou. Entre novamente para continuar.', { kind: 'session', cause: error })
  }
  if (code === '42501') {
    return new AppError('Você não tem permissão para esta operação.', { kind: 'permission', cause: error })
  }
  if (code === '23505') {
    const field = /code/.test(message) || /stops_code_unique/.test(error?.details ?? message) ? 'code' : null
    const text = field === 'code' ? 'Já existe um ponto com este código.' : 'Registro duplicado.'
    return new AppError(text, { kind: 'conflict', field, cause: error })
  }
  if (code === '23503') {
    return new AppError(
      'Este ponto possui leituras registradas e não pode ser excluído. Desative-o para preservar o histórico.',
      { kind: 'integrity', cause: error },
    )
  }
  if (code === '23514' || code === '22P02' || code === '22003') {
    return new AppError('Algum valor está fora do formato permitido. Revise os campos.', { kind: 'validation', cause: error })
  }
  if (error instanceof TypeError || /fetch|network|Failed to fetch/i.test(message)) {
    return new AppError('Não foi possível conectar ao servidor. Verifique sua conexão.', { kind: 'network', cause: error })
  }
  return new AppError(fallback, { kind: 'unknown', cause: error })
}

/** Traduz um erro do Supabase Auth (login) para AppError. */
export function toAuthError(error) {
  const code = error?.code ?? ''
  const status = error?.status
  if (code === 'email_not_confirmed') {
    return new AppError('Esta conta ainda não foi confirmada.', { kind: 'validation', cause: error })
  }
  if (code === 'invalid_credentials' || (status === 400 && /invalid login/i.test(error?.message ?? ''))) {
    return new AppError('E-mail ou senha incorretos.', { kind: 'validation', cause: error })
  }
  if (code === 'over_request_rate_limit' || status === 429) {
    return new AppError('Muitas tentativas. Aguarde alguns minutos e tente novamente.', { kind: 'validation', cause: error })
  }
  return toAppError(error, 'Não foi possível entrar. Tente novamente.')
}
