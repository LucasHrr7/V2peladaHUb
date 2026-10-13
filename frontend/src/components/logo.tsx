import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Marca do PeladaHub: a bola de futebol desenhada como um "hub" —
 * o pentágono central ligado a cinco nós, como os jogadores conectados à pelada.
 */
export function LogoMarca({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 64 64" className={cn('size-9 shrink-0', className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34E89E" />
          <stop offset="1" stopColor="#0EA5C6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="#0B1418" />
      <rect x="1.5" y="1.5" width="61" height="61" rx="16.5" fill="none" stroke={`url(#${id})`} strokeWidth="3" />
      <circle cx="32" cy="32" r="17" fill="none" stroke={`url(#${id})`} strokeWidth="3" />
      <path d="M32 24.5l7 5.1-2.7 8.2h-8.6L25 29.6z" fill={`url(#${id})`} />
      <path
        d="M32 24.5V15M39 29.6l9-2.9M36.3 37.8l5.6 7.7M27.7 37.8l-5.6 7.7M25 29.6l-9-2.9"
        stroke={`url(#${id})`}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <g fill="#E9FFF5">
        <circle cx="32" cy="15" r="2.6" />
        <circle cx="48" cy="26.7" r="2.6" />
        <circle cx="41.9" cy="45.5" r="2.6" />
        <circle cx="22.1" cy="45.5" r="2.6" />
        <circle cx="16" cy="26.7" r="2.6" />
      </g>
    </svg>
  )
}

export function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMarca className={compacto ? 'size-8' : 'size-9'} />
      <span className="font-display text-xl leading-none font-bold tracking-tight">
        Pelada
        <span className="bg-linear-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#34E89E] dark:to-[#22C3E6]">Hub</span>
      </span>
    </div>
  )
}
