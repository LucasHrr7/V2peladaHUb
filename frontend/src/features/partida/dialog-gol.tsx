import { toast } from 'sonner'
import { useApp } from '@/store/app'
import { useMapaJogadores } from '@/hooks/use-app-data'
import { primeiroNome } from '@/lib/utils'
import type { Time } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, Camisa, PosicaoTag } from '@/components/dominio'

export function DialogGol({ time, onFechar }: { time: Time | null; onFechar: () => void }) {
  const jogadores = useMapaJogadores()
  const marcarGol = useApp((s) => s.marcarGol)
  const registrar = (jogadorId: string | null) => {
    if (!time) return
    marcarGol(time.id, jogadorId)
    const nome = jogadorId ? jogadores.get(jogadorId)?.nome : null
    toast.success(nome ? `Gol de ${nome}!` : `Gol do ${time.nome}!`, { icon: '⚽' })
    navigator.vibrate?.(60)
    onFechar()
  }
  return (
    <Dialog open={!!time} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent>
        {time && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Camisa cor={time.cor} />
                <div>
                  <DialogTitle>Gol do {time.nome}</DialogTitle>
                  <DialogDescription>Quem marcou?</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {time.jogadores.map((id) => {
                const j = jogadores.get(id)
                if (!j) return null
                return (
                  <button
                    key={id}
                    onClick={() => registrar(id)}
                    className="flex items-center gap-2.5 rounded-xl border bg-background p-2.5 text-left transition hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
                  >
                    <Avatar nome={j.nome} className="size-9" />
                    <span className="grid min-w-0 gap-0.5">
                      <span className="truncate text-sm font-semibold">{primeiroNome(j.nome)}</span>
                      <PosicaoTag posicao={j.posicao} />
                    </span>
                  </button>
                )
              })}
            </div>
            <Button variant="outline" onClick={() => registrar(null)}>
              Sem autor / gol contra
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
