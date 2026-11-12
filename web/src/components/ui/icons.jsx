/** Ícones SVG inline originais; sempre usados ao lado de texto (decorativos). */

function Svg({ className = 'h-4 w-4', children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function IconThermometer({ className }) {
  return (
    <Svg className={className}>
      <path d="M10 14V5a2 2 0 0 1 4 0v9" />
      <circle cx="12" cy="17" r="3" />
    </Svg>
  )
}

export function IconDroplet({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 3C9 8 6 11 6 15a6 6 0 0 0 12 0c0-4-3-7-6-12z" />
    </Svg>
  )
}

export function IconSignal({ className }) {
  return (
    <Svg className={className}>
      <path d="M5 19v-3M10 19v-7M15 19v-11M20 19V5" />
    </Svg>
  )
}

export function IconSignalOff({ className }) {
  return (
    <Svg className={className}>
      <path d="M5 19v-3M10 19v-7M15 19v-4" />
      <path d="M4 4l16 16" />
    </Svg>
  )
}

export function IconCheckCircle({ className }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
    </Svg>
  )
}

export function IconAlertTriangle({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 4L3 20h18L12 4z" />
      <path d="M12 10v4M12 17v.5" />
    </Svg>
  )
}

export function IconAlertOctagon({ className }) {
  return (
    <Svg className={className}>
      <path d="M8 3h8l5 5v8l-5 5H8l-5-5V8l5-5z" />
      <path d="M12 8v5M12 16v.5" />
    </Svg>
  )
}

export function IconHelpCircle({ className }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.5" />
    </Svg>
  )
}

export function IconFlask({ className }) {
  return (
    <Svg className={className}>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" />
      <path d="M8 15h8" />
    </Svg>
  )
}

export function IconRefresh({ className }) {
  return (
    <Svg className={className}>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20 4v5h-5" />
    </Svg>
  )
}

export function IconChart({ className }) {
  return (
    <Svg className={className}>
      <path d="M4 4v16h16" />
      <path d="M8 15l3-4 3 2 5-6" />
    </Svg>
  )
}
