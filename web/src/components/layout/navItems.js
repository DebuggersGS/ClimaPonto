import { ChartColumn, FileText, FlaskConical, History, LayoutDashboard, MapPin, Settings } from 'lucide-react'

/**
 * Seções do ClimaPonto. `description` é só apoio (dica do item recolhido); o nome acessível é `label`.
 * Rotas antigas continuam válidas: /pontos é "Explorar", /historico segue sendo o Histórico.
 */
export const PUBLIC_NAV_ITEMS = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/pontos', label: 'Explorar', icon: MapPin },
  { to: '/analises', label: 'Análises', icon: ChartColumn },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/laboratorio', label: 'Laboratório', icon: FlaskConical },
  { to: '/relatorios', label: 'Relatórios', icon: FileText },
]

export const ADMIN_NAV_ITEM = { to: '/admin/pontos', label: 'Administração', icon: Settings }

/** Itens visíveis para o perfil atual (Administração só para admin; a RLS continua sendo a autoridade). */
export function getNavItems(isAdmin) {
  return isAdmin ? [...PUBLIC_NAV_ITEMS, ADMIN_NAV_ITEM] : PUBLIC_NAV_ITEMS
}
