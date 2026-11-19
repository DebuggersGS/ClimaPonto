import { ChartColumn, FileText, FlaskConical, History, LayoutDashboard, MapPin, Settings } from 'lucide-react'

/**
 * Seções do ClimaPonto, agrupadas por intenção de uso. Rotas antigas continuam válidas:
 * /pontos é "Explorar" e /historico segue sendo o Histórico.
 */
export const NAV_GROUPS = [
  {
    id: 'explorar',
    label: 'Explorar',
    items: [
      { to: '/', label: 'Visão geral', icon: LayoutDashboard, end: true },
      { to: '/pontos', label: 'Explorar', icon: MapPin },
    ],
  },
  {
    id: 'investigar',
    label: 'Investigar',
    items: [
      { to: '/analises', label: 'Análises', icon: ChartColumn },
      { to: '/historico', label: 'Histórico', icon: History },
      { to: '/laboratorio', label: 'Laboratório', icon: FlaskConical },
    ],
  },
  {
    id: 'compartilhar',
    label: 'Compartilhar',
    items: [{ to: '/relatorios', label: 'Relatórios', icon: FileText }],
  },
]

export const ADMIN_NAV_ITEM = { to: '/admin/pontos', label: 'Administração', icon: Settings }

/** Grupo só do admin; a interface apenas esconde, a RLS continua sendo a autoridade. */
export const ADMIN_NAV_GROUP = { id: 'operar', label: 'Operar', items: [ADMIN_NAV_ITEM] }

/** Seções públicas, em ordem de leitura (usadas também pela paleta de comandos). */
export const PUBLIC_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)

/** Grupos visíveis para o perfil atual. */
export function getNavGroups(isAdmin) {
  return isAdmin ? [...NAV_GROUPS, ADMIN_NAV_GROUP] : NAV_GROUPS
}

/** Itens visíveis para o perfil atual, na ordem dos grupos. */
export function getNavItems(isAdmin) {
  return getNavGroups(isAdmin).flatMap((group) => group.items)
}

/**
 * Grupo que contém a rota atual (o item mais específico vence), ou null.
 * @param {Array<{ id: string, items: Array<{ to: string, end?: boolean }> }>} groups
 * @param {string} pathname
 */
export function findActiveGroupId(groups, pathname) {
  let best = null
  for (const group of groups) {
    for (const item of group.items) {
      const matches = item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)
      if (matches && (!best || item.to.length > best.length)) best = { id: group.id, length: item.to.length }
    }
  }
  return best?.id ?? null
}
