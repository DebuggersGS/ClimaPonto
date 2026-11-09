import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** true quando as variáveis de ambiente do Supabase foram definidas. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

/**
 * Cliente Supabase compartilhado, ou null quando não configurado.
 * Usa apenas a chave publishable; as permissões são garantidas pelo RLS.
 */
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null
