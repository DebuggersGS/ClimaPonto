import { Link } from 'react-router'
import { Bus, ThermometerSun } from 'lucide-react'

/** Marca do ClimaPonto; com `compact` mostra só o símbolo (o nome continua acessível). */
export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-full pr-2 focus-visible:outline-2 focus-visible:outline-brand-600">
      <span
        aria-hidden="true"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-600 to-accent-500 text-white shadow-glow"
      >
        <Bus className="h-5 w-5" />
        <ThermometerSun className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-ink p-0.5 text-amber-300" />
      </span>
      <span className={compact ? 'sr-only' : 'text-lg font-semibold tracking-tight text-slate-900'}>ClimaPonto</span>
    </Link>
  )
}
