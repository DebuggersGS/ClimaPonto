import { ChevronDown } from 'lucide-react'
import { OFFLINE_FACTOR, ONLINE_FACTOR, SEND_INTERVAL_MS } from '../../utils/connectivity.js'
import { cn } from '../../utils/cn.js'

const SEND_INTERVAL_SECONDS = SEND_INTERVAL_MS / 1000

/**
 * Metodologia e regras provisórias, recolhida por padrão (divulgação progressiva).
 * <details> nativo: abre com Enter/Espaço e é anunciado como expansível pelos leitores de tela.
 * Os números vêm de utils/connectivity.js.
 * @param {{ className?: string }} props
 */
export default function MethodologyNote({ className }) {
  return (
    <details className={cn('group rounded-card bg-surface p-3 shadow-card ring-1 ring-slate-900/5', className)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-2 text-base font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 [&::-webkit-details-marker]:hidden">
        Metodologia e premissas
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none group-open:rotate-180" />
      </summary>
      <div className="space-y-2 px-2 pb-2 pt-3 text-sm text-slate-700">
        <p>
          Conectividade (premissa provisória): o ponto é considerado online até {ONLINE_FACTOR} vezes o intervalo de
          envio ({ONLINE_FACTOR} × {SEND_INTERVAL_SECONDS} s), atrasado até {OFFLINE_FACTOR} vezes e offline acima
          disso, contando a partir do horário da última leitura.
        </p>
        <p>
          O intervalo real de envio do sensor ainda não foi definido; o valor de {SEND_INTERVAL_SECONDS} s é apenas um
          exemplo. Conectividade indica se os dados estão chegando e não é condição ambiental.
        </p>
        <p>
          Estado ambiental e leituras vêm do banco (ou do modo demonstração, sempre sinalizado). Completude e perfis
          por horário são estimativas descritivas sobre o período carregado, não novas medições.
        </p>
      </div>
    </details>
  )
}
