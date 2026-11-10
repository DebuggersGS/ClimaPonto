const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600/60',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:text-slate-400',
  danger: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-red-700/60',
  ghost: 'text-slate-700 hover:bg-slate-100 disabled:text-slate-400',
}

/** Botão padrão da aplicação. Altura mínima de 40px para toque. */
export default function Button({ variant = 'primary', type = 'button', className = '', children, ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
