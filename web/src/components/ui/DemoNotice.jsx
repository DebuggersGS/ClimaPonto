import { useDataMode } from '../../hooks/useDataMode.js'
import { getDataModeTone } from '../../utils/statusTones.js'
import { cn } from '../../utils/cn.js'
import StatusIcon from './StatusIcon.jsx'
import { getToneClasses } from './tones.js'

/**
 * Aviso persistente sobre a natureza dos dados (modo de dados do shell).
 * Texto e ícone vêm do modo efetivo; a cor é só reforço.
 */
export default function DemoNotice({ className }) {
  const { mode, label, description } = useDataMode()
  const tone = getDataModeTone(mode)

  return (
    <aside
      role="note"
      aria-label="Aviso sobre os dados"
      className={cn(
        'mb-6 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ring-1 ring-inset',
        getToneClasses(tone.tone).soft,
        className,
      )}
    >
      <StatusIcon name={tone.icon} className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        {mode === 'supabase' ? (
          <>
            <strong className="font-semibold">Protótipo acadêmico.</strong> Leituras com origem Simulação ou Teste não
            são medições reais; a origem aparece em cada leitura.
          </>
        ) : (
          <>
            <strong className="font-semibold">{label}</strong> — {description}
          </>
        )}
      </p>
    </aside>
  )
}
