import { Link } from 'react-router'
import { cn } from '../../utils/cn.js'

/*
 * Assets reais da marca em /brand. Dimensões intrínsecas evitam salto de layout.
 * - Wordmark (2119×669): o símbolo ocupa a faixa esquerda; com 40 px de altura o centro do símbolo
 *   fica a ~15 px da borda esquerda e o símbolo tem ~32 px de altura.
 * - Símbolo (1024×1024) tem margem transparente larga (~30% por lado). Em vez de mostrá-lo minúsculo
 *   dentro da caixa, ampliamos a imagem e recortamos a sobra (overflow hidden): o desenho fica com
 *   ~32 px, o mesmo tamanho que tem no wordmark, sem alterar o arquivo da marca.
 * O wordmark troca por prefers-color-scheme, o mesmo critério do tema escuro do CSS.
 */
const WORDMARK = { width: 2119, height: 669 }
const MARK = { width: 1024, height: 1024 }

function Mark({ className }) {
  return (
    <span aria-hidden="true" className={cn('flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden', className)}>
      <img src="/brand/climaponto-mark-transparent.png" alt="" {...MARK} className="h-[3.875rem] w-[3.875rem] max-w-none" />
    </span>
  )
}

function Wordmark({ className, decorative = false }) {
  return (
    <picture className={cn('block shrink-0', className)}>
      <source srcSet="/brand/climaponto-logo-dark.png" media="(prefers-color-scheme: dark)" />
      {decorative ? (
        <img src="/brand/climaponto-logo-light.png" alt="" {...WORDMARK} className="h-10 w-auto max-w-none" />
      ) : (
        <img src="/brand/climaponto-logo-light.png" alt="ClimaPonto" {...WORDMARK} className="h-10 w-auto max-w-none" />
      )}
    </picture>
  )
}

const LINK_CLASS =
  'rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'

/**
 * Logotipo com nome acessível único.
 * - padrão: wordmark completo (cabeçalho do celular/tablet); o nome vem do alt "ClimaPonto".
 * - `rail`: usado na barra lateral; símbolo e wordmark ficam sobrepostos e trocam por opacidade,
 *   com o símbolo sempre no mesmo eixo dos ícones da navegação (sem salto durante a expansão).
 * @param {{ rail?: boolean, expanded?: boolean, className?: string }} props
 */
export default function Logo({ rail = false, expanded = false, className }) {
  if (!rail) {
    return (
      <Link to="/" className={cn('flex shrink-0 items-center', LINK_CLASS, className)}>
        <Wordmark className="[&_img]:h-7 sm:[&_img]:h-9" />
      </Link>
    )
  }
  return (
    <Link
      to="/"
      aria-label="ClimaPonto — página inicial"
      data-logo={expanded ? 'wordmark' : 'mark'}
      className={cn('relative flex h-12 w-full items-center overflow-hidden', LINK_CLASS, className)}
    >
      {/* Símbolo centrado na coluna de ícones (48 px): 4 px de margem + 40 px de caixa. */}
      <Mark
        className={cn(
          'absolute left-1 top-1 transition-opacity duration-200 ease-out-soft',
          expanded ? 'opacity-0' : 'opacity-100',
        )}
      />
      {/* O símbolo do wordmark fica no mesmo centro (24 px) que o símbolo isolado. */}
      <Wordmark
        decorative
        className={cn(
          'absolute left-[0.5625rem] top-1 transition-opacity duration-200 ease-out-soft',
          expanded ? 'opacity-100' : 'opacity-0',
        )}
      />
    </Link>
  )
}
