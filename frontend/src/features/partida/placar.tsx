import { AnimatePresence, motion } from 'motion/react'
import { Crown } from 'lucide-react'
import { useMapaJogadores } from '@/hooks/use-app-data'
import { primeiroNome } from '@/lib/utils'
import type { Time } from '@/lib/types'
import { Camisa } from '@/components/dominio'

export const nomeCurto = (nome: string) => nome.replace(/^time\s+/i, '')

export function Numero({ valor }: { valor: number }) {
  return (
    <span className="relative inline-block min-w-[1ch] overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={valor}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="inline-block"
        >
          {valor}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function LadoTime({ time, extra }: { time: Time; extra: string }) {
  const jogadores = useMapaJogadores()
  const capitao = time.capitaoId ? jogadores.get(time.capitaoId) : undefined
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <Camisa cor={time.cor} className="size-14 rounded-2xl shadow-lg sm:size-16" />
      <p className="w-full truncate font-display text-base font-bold sm:text-xl">{time.nome}</p>
      <p className="flex items-center gap-1 text-[11px] text-white/70 sm:text-xs">
        {capitao && <Crown className="size-3" />}
        {capitao ? primeiroNome(capitao.nome) : extra}
      </p>
      <span className="hidden rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/80 sm:inline">{extra}</span>
    </div>
  )
}
