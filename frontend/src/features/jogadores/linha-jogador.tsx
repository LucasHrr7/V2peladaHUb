import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/store/app'
import type { Jogador } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, Estrelas, PosicaoTag } from '@/components/dominio'

export function LinhaJogador({
  jogador: j,
  ordem,
  onPresenca,
  onEditar,
}: {
  jogador: Jogador
  ordem?: number
  onPresenca: () => void
  onEditar: () => void
}) {
  const remover = useApp((s) => s.removerJogador)
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border bg-card p-3 transition',
        j.presente ? 'border-primary/30 bg-primary/[0.04]' : 'opacity-75',
      )}
    >
      <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={onPresenca} aria-pressed={j.presente}>
        <span className="relative">
          <Avatar nome={j.nome} />
          {ordem && (
            <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-card tabular">
              {ordem}
            </span>
          )}
        </span>
        <span className="grid min-w-0 gap-1">
          <span className="truncate font-semibold">{j.nome}</span>
          <span className="flex items-center gap-2">
            <PosicaoTag posicao={j.posicao} />
            <Estrelas nivel={j.nivel} />
          </span>
        </span>
      </button>
      <Switch checked={j.presente} onCheckedChange={onPresenca} aria-label={`Presença de ${j.nome}`} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Opções de ${j.nome}`}>
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEditar}>
            <Pencil /> Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            destructive
            onSelect={() => {
              remover(j.id)
              toast(`${j.nome} removido.`)
            }}
          >
            <Trash2 /> Remover
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
