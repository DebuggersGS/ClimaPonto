import { Link } from 'react-router'
import { MapPin } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import Card from '../ui/Card.jsx'
import { getDataModeInfo } from '../../utils/dataMode.js'
import { getDataModeTone } from '../../utils/statusTones.js'

// Brilho radial sutil (brand + ciano) sobre o fundo ink; decorativo.
const GLOW = {
  backgroundImage:
    'radial-gradient(36rem 16rem at 90% -20%, rgb(43 139 224 / 0.35), transparent 70%), radial-gradient(28rem 14rem at 0% 120%, rgb(8 145 178 / 0.28), transparent 70%)',
}

/**
 * Hero escuro da Visão geral: único h1 da página, frase do produto, indicador do
 * modo de dados e, em `children`, o controle de atualização.
 * @param {{ source: string, children?: import('react').ReactNode }} props
 */
export default function DashboardHero({ source, children }) {
  const tone = getDataModeTone(source)
  return (
    <Card variant="dark" className="relative mb-section overflow-hidden p-6 sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={GLOW} />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Badge tone={tone.tone} icon={tone.icon} size="sm">
            Fonte: {getDataModeInfo(source).label}
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Visão geral</h1>
          <p className="mt-2 max-w-xl text-base text-on-ink-muted">
            Calor urbano sob controle: acompanhe temperatura, umidade e conectividade dos pontos de ônibus de São Paulo.
          </p>
          <Link
            to="/pontos"
            className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-linear-to-b from-brand-600 to-brand-700 px-6 py-2.5 text-base font-medium text-white shadow-card transition-[background-color,transform] duration-150 ease-out-soft hover:from-brand-700 hover:to-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-safe:active:scale-[0.98]"
          >
            <MapPin aria-hidden="true" className="h-4 w-4" />
            Explorar pontos
          </Link>
        </div>
        <div className="min-w-0 lg:max-w-md">{children}</div>
      </div>
    </Card>
  )
}
