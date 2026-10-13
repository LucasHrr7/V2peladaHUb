import { useMemo, useState } from 'react'
import { ClipboardPaste } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/store/app'
import { extrairNomesDeLista, plural } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function DialogColarLista({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const [texto, setTexto] = useState('')
  const [presente, setPresente] = useState(true)
  const adicionarVarios = useApp((s) => s.adicionarVarios)
  const nomes = useMemo(() => extrairNomesDeLista(texto), [texto])

  const importar = () => {
    const n = adicionarVarios(nomes, presente)
    toast.success(n ? `${plural(n, 'jogador atualizado', 'jogadores atualizados')} na lista.` : 'Todos já estavam na lista.')
    setTexto('')
    onFechar()
  }

  const colarDaAreaDeTransferencia = async () => {
    try {
      setTexto(await navigator.clipboard.readText())
    } catch {
      toast.error('Não foi possível ler a área de transferência. Cole manualmente.')
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Colar lista</DialogTitle>
          <DialogDescription>Cole a lista do grupo (uma pessoa por linha). Números, traços e emojis são ignorados.</DialogDescription>
        </DialogHeader>
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={'1. João ✅\n2. Pedro\n3. Lucas Goleiro'} autoFocus />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={colarDaAreaDeTransferencia}>
            <ClipboardPaste /> Colar do celular
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={presente} onCheckedChange={setPresente} /> Marcar como presentes
          </label>
        </div>
        {nomes.length > 0 && (
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
            {nomes.map((n) => (
              <span key={n} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {n}
              </span>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button disabled={!nomes.length} className="w-full sm:w-auto" onClick={importar}>
            Importar {nomes.length > 0 && `(${nomes.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
