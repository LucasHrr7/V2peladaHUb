import { ArrowRightLeft, UserMinus, UserPlus } from 'lucide-react'
import { useApp } from '@/store/app'
import { ESTILO_COR } from '@/lib/cores'
import type { Time } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export const SEM_TIMES: Time[] = []

export function ItensMover({ jogadorId, timeAtual }: { jogadorId: string; timeAtual: string | null }) {
  const times = useApp((s) => s.rodada?.times ?? SEM_TIMES)
  const mover = useApp((s) => s.moverJogador)
  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <ArrowRightLeft className="size-4 text-muted-foreground" /> Mover para…
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {times
            .filter((t) => t.id !== timeAtual)
            .map((t) => (
              <DropdownMenuItem key={t.id} onSelect={() => mover(jogadorId, t.id)}>
                <span className={cn('size-3 rounded-full', ESTILO_COR[t.cor].camisa)} /> {t.nome}
                <span className="ml-auto text-xs text-muted-foreground tabular">{t.jogadores.length}</span>
              </DropdownMenuItem>
            ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      {timeAtual && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => mover(jogadorId, null)}>
            <UserMinus /> Tirar do time
          </DropdownMenuItem>
        </>
      )}
    </>
  )
}

export function MenuMover({ jogadorId, timeAtual, rotulo }: { jogadorId: string; timeAtual: string | null; rotulo: string }) {
  const times = useApp((s) => s.rodada?.times ?? SEM_TIMES)
  const mover = useApp((s) => s.moverJogador)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus /> {rotulo}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {times
          .filter((t) => t.id !== timeAtual)
          .map((t) => (
            <DropdownMenuItem key={t.id} onSelect={() => mover(jogadorId, t.id)}>
              <span className={cn('size-3 rounded-full', ESTILO_COR[t.cor].camisa)} /> {t.nome}
              <span className="ml-auto text-xs text-muted-foreground tabular">{t.jogadores.length}</span>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
