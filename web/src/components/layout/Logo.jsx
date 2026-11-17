import { Link } from 'react-router'

/*
 * Dimensões intrínsecas dos arquivos em /brand (evitam salto de layout).
 * O wordmark troca por prefers-color-scheme, o mesmo critério do tema escuro do CSS.
 */
const WORDMARK = { width: 2119, height: 669 }
const MARK = { width: 1024, height: 1024 }

/** Marca do ClimaPonto; com `compact` mostra só o símbolo (o nome continua acessível). */
export default function Logo({ compact = false }) {
  return (
    <Link
      to="/"
      aria-label={compact ? 'ClimaPonto — página inicial' : undefined}
      className="flex items-center rounded-full pr-2 focus-visible:outline-2 focus-visible:outline-brand-600"
    >
      {compact ? (
        <img src="/brand/climaponto-mark-transparent.png" alt="ClimaPonto" {...MARK} className="h-10 w-10 shrink-0" />
      ) : (
        <picture>
          <source srcSet="/brand/climaponto-logo-dark.png" media="(prefers-color-scheme: dark)" />
          <img
            src="/brand/climaponto-logo-light.png"
            alt="ClimaPonto"
            {...WORDMARK}
            className="h-10 w-auto max-w-44 shrink-0 object-contain"
          />
        </picture>
      )}
    </Link>
  )
}
