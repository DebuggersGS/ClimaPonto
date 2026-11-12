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
 * Hero escuro do Dashboard: único h1 da página, frase do produto, indicador do
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
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Dashboard</h1>
          <p className="mt-2 max-w-xl text-base text-slate-200">
            Calor urbano sob controle: acompanhe temperatura, umidade e conectividade dos pontos de ônibus de São Paulo.
          </p>
        </div>
        <div className="min-w-0 lg:max-w-md">{children}</div>
      </div>
    </Card>
  )
}
