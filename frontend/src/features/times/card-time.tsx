import { motion } from 'motion/react'
import { ArrowDown, ArrowUp, Crown, EllipsisVertical, Pencil } from 'lucide-react'
import { useApp } from '@/store/app'
import { useMapaJogadores } from '@/hooks/use-app-data'
import { mediaNivel } from '@/lib/sorteio'
import { ESTILO_COR } from '@/lib/cores'
import type { Time } from '@/lib/types'
import { cn, plural } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, Camisa, Estrelas, PosicaoTag } from '@/components/dominio'
import { ItensMover } from '@/features/times/mover-jogador'

export function CardTime({
  time,
  status,
  posicaoFila,
  onRenomear,
}: {
  time: Time
  status: string
  posicaoFila?: { i: number; total: number }
  onRenomear: (t: Time) => void
}) {
  const jogadores = useMapaJogadores()
  const { definirCapitao, moverNaFila } = useApp.getState()
  const media = mediaNivel(time, jogadores)
  const estilo = ESTILO_COR[time.cor]
  const ordenados = [...time.jogadores].sort((a, b) => {
    const ja = jogadores.get(a)
    const jb = jogadores.get(b)
    return Number(jb?.posicao === 'GOL') - Number(ja?.posicao === 'GOL') || (ja?.nome ?? '').localeCompare(jb?.nome ?? '', 'pt-BR')
  })

  return (
    <motion.div layout>
      <Card className={cn('overflow-hidden border-2', estilo.borda)}>
        <div className={cn('flex items-center gap-3 p-4', estilo.suave)}>
          <Camisa cor={time.cor} />
          <div className="min-w-0 flex-1">
            <button className="group flex max-w-full items-center gap-1.5 text-left" onClick={() => onRenomear(time)}>
              <span className="truncate font-display text-lg font-bold">{time.nome}</span>
              <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </button>
            <div className="flex flex-wrap items-center gap-x-2 text-xs whitespace-nowrap text-muted-foreground">
              <span>{plural(time.jogadores.length, 'jogador', 'jogadores')}</span>
              <span>·</span>
              <span className="flex items-center gap-1" title="Nível médio">
                <Estrelas nivel={Math.round(media)} /> {media.toFixed(1)}
              </span>
            </div>
          </div>
          <Badge variant={status === 'Em campo' ? 'live' : status === 'Próximo' ? 'lime' : 'secondary'}>{status}</Badge>
          {posicaoFila && posicaoFila.total > 1 && (
            <div className="flex flex-col">
              <Button variant="ghost" size="icon-sm" className="size-6" disabled={posicaoFila.i === 0} onClick={() => moverNaFila(time.id, -1)} aria-label="Subir na fila">
                <ArrowUp />
              </Button>
              <Button variant="ghost" size="icon-sm" className="size-6" disabled={posicaoFila.i === posicaoFila.total - 1} onClick={() => moverNaFila(time.id, 1)} aria-label="Descer na fila">
                <ArrowDown />
              </Button>
            </div>
          )}
        </div>
        <ul className="divide-y">
          {ordenados.map((id) => {
            const j = jogadores.get(id)
            if (!j) return null
            const capitao = time.capitaoId === id
            return (
              <li key={id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar nome={j.nome} className="size-8 text-[10px]" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{j.nome}</span>
                {capitao && <Crown className="size-4 text-amber-500" aria-label="Capitão" />}
                <PosicaoTag posicao={j.posicao} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="size-7" aria-label={`Opções de ${j.nome}`}>
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{j.nome}</DropdownMenuLabel>
                    {!capitao && (
                      <DropdownMenuItem onSelect={() => definirCapitao(time.id, id)}>
                        <Crown /> Tornar capitão
                      </DropdownMenuItem>
                    )}
                    <ItensMover jogadorId={id} timeAtual={time.id} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )
          })}
          {time.jogadores.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Time sem jogadores</li>}
        </ul>
      </Card>
    </motion.div>
  )
}
