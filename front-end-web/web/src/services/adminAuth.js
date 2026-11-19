import { AppError, NOT_ADMIN_MESSAGE } from './errors.js'

/** true quando o usuário tem app_metadata.role === 'admin' (só para a interface; o RLS decide). */
export function isAdminUser(user) {
  return user?.app_metadata?.role === 'admin'
}

/**
 * Entra e exige papel de administrador: conta sem o papel é desconectada
 * e a entrada é recusada.
 * @param {{ signIn: Function, signOut: Function }} authApi
 */
export async function signInAdmin(authApi, email, password) {
  const user = await authApi.signIn(email, password)
  if (!isAdminUser(user)) {
    await authApi.signOut()
    throw new AppError(NOT_ADMIN_MESSAGE, { kind: 'permission' })
  }
  return user
}
