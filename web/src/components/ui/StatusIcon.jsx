import { CircleHelp } from 'lucide-react'
import { ICONS_BY_NAME } from './tones.js'

/** Ícone decorativo (aria-hidden) resolvido pelo nome vindo de utils/statusTones. */
export default function StatusIcon({ name, className }) {
  const Icon = Object.hasOwn(ICONS_BY_NAME, name) ? ICONS_BY_NAME[name] : CircleHelp
  return <Icon aria-hidden="true" focusable="false" className={className} />
}
