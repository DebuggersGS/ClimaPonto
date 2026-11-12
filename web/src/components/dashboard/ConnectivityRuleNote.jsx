import Card from '../ui/Card.jsx'
import { OFFLINE_FACTOR, ONLINE_FACTOR, SEND_INTERVAL_MS } from '../../utils/connectivity.js'

const SEND_INTERVAL_SECONDS = SEND_INTERVAL_MS / 1000

/** Nota visível sobre a regra PROVISÓRIA de conectividade; os números vêm de utils/connectivity.js. */
export default function ConnectivityRuleNote() {
  return (
    <Card variant="inset" role="note" aria-label="Regra provisória de conectividade">
      <p className="font-medium text-slate-900">Regra provisória de conectividade</p>
      <p className="mt-1">
        O ponto é considerado online até {ONLINE_FACTOR} vezes o intervalo de envio ({ONLINE_FACTOR} ×{' '}
        {SEND_INTERVAL_SECONDS} s), atrasado até {OFFLINE_FACTOR} vezes e offline acima disso, contando a partir do
        horário da última leitura.
      </p>
      <p className="mt-1">
        O intervalo real de envio do sensor ainda não foi definido; o valor de {SEND_INTERVAL_SECONDS} s é apenas um
        exemplo. Conectividade indica se os dados estão chegando e não é condição ambiental.
      </p>
    </Card>
  )
}
