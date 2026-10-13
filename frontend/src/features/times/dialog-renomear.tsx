import { useApp } from '@/store/app'
import type { Time } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function DialogRenomear({ time, onFechar }: { time: Time | null; onFechar: () => void }) {
  const renomear = useApp((s) => s.renomearTime)
  return (
    <Dialog open={!!time} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent>
        {time && (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              renomear(time.id, String(new FormData(e.currentTarget).get('nome') ?? ''))
              onFechar()
            }}
          >
            <DialogHeader>
              <DialogTitle>Renomear time</DialogTitle>
            </DialogHeader>
            <Input name="nome" defaultValue={time.nome} maxLength={30} autoFocus aria-label="Nome do time" />
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
