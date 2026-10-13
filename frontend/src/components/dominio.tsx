import { Shirt, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { ESTILO_COR } from '@/lib/cores'
import type { CorTime, Posicao } from '@/lib/types'
import { cn, iniciais } from '@/lib/utils'

export function Camisa({ cor, className }: { cor: CorTime; className?: string }) {
  return (
    <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', ESTILO_COR[cor].camisa, className)}>
      <Shirt className="size-[55%]" strokeWidth={2.2} />
    </span>
  )
}

const TONS = ['bg-emerald-600', 'bg-sky-600', 'bg-amber-600', 'bg-rose-600', 'bg-violet-600', 'bg-teal-600', 'bg-orange-600', 'bg-indigo-600']

export function Avatar({ nome, className }: { nome: string; className?: string }) {
  let h = 0
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return (
    <span
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white select-none',
        TONS[h % TONS.length],
        className,
      )}
      aria-hidden
    >
      {iniciais(nome)}
    </span>
  )
}

export const NOME_POSICAO: Record<Posicao, string> = { GOL: 'Goleiro', DEF: 'Defesa', MEI: 'Meio', ATA: 'Ataque' }

export function PosicaoTag({ posicao }: { posicao: Posicao }) {
  return (
    <span
      className={cn(
        'rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
        posicao === 'GOL' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground',
      )}
    >
      {posicao}
    </span>
  )
}

export function Estrelas({
  nivel,
  onChange,
  tamanho = 'sm',
}: {
  nivel: number
  onChange?: (n: number) => void
  tamanho?: 'sm' | 'lg'
}) {
  const cls = tamanho === 'lg' ? 'size-8' : 'size-3.5'
  return (
    <span className="inline-flex items-center gap-0.5" role={onChange ? 'radiogroup' : 'img'} aria-label={`Nível ${nivel} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icone = <Star className={cn(cls, n <= nivel ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
        return onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === nivel}
            aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
            onClick={() => onChange(n)}
            className="rounded-md p-1 transition hover:scale-110"
          >
            {icone}
          </button>
        ) : (
          <span key={n}>{icone}</span>
        )
      })}
    </span>
  )
}

export function Vazio({ icone, titulo, descricao, children }: { icone: ReactNode; titulo: string; descricao?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary [&_svg]:size-7">{icone}</div>
      <div className="grid gap-1">
        <p className="font-display text-lg font-bold">{titulo}</p>
        {descricao && <p className="max-w-sm text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {children}
    </div>
  )
}

export function CabecalhoPagina({ titulo, descricao, acoes }: { titulo: string; descricao?: ReactNode; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{titulo}</h1>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  )
}
