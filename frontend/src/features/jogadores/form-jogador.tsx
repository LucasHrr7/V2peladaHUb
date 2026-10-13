import { useState } from 'react'
import { toast } from 'sonner'
import { useApp } from '@/store/app'
import type { Jogador, Posicao } from '@/lib/types'
import { normalizar } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Segmented } from '@/components/ui/segmented'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Estrelas, NOME_POSICAO } from '@/components/dominio'

export const POSICOES: Posicao[] = ['GOL', 'DEF', 'MEI', 'ATA']

export function DialogJogador({ jogador, onFechar }: { jogador: Jogador | 'novo' | null; onFechar: () => void }) {
  return (
    <Dialog open={!!jogador} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent>
        {jogador && <FormJogador key={jogador === 'novo' ? 'novo' : jogador.id} jogador={jogador === 'novo' ? null : jogador} onFechar={onFechar} />}
      </DialogContent>
    </Dialog>
  )
}

export function FormJogador({ jogador, onFechar }: { jogador: Jogador | null; onFechar: () => void }) {
  const { adicionarJogador, editarJogador, jogadores } = useApp.getState()
  const [nome, setNome] = useState(jogador?.nome ?? '')
  const [posicao, setPosicao] = useState<Posicao>(jogador?.posicao ?? 'MEI')
  const [nivel, setNivel] = useState(jogador?.nivel ?? 3)
  const [presente, setPresente] = useState(jogador?.presente ?? true)
  const [erro, setErro] = useState('')
  const [continuar, setContinuar] = useState(false)

  const salvar = (e: React.FormEvent) => {
    e.preventDefault()
    if (jogador) {
      const limpo = nome.trim()
      if (!limpo) return setErro('Informe o nome.')
      if (jogadores.some((x) => x.id !== jogador.id && normalizar(x.nome) === normalizar(limpo))) return setErro('Já existe um jogador com esse nome.')
      editarJogador(jogador.id, {
        nome: limpo,
        posicao,
        nivel,
        presente,
        chegadaEm: presente ? (jogador.chegadaEm ?? Date.now()) : null,
      })
      toast.success('Jogador atualizado.')
      return onFechar()
    }
    const r = adicionarJogador({ nome, posicao, nivel, presente })
    if (!r.ok) return setErro(r.motivo ?? 'Erro ao salvar.')
    toast.success(`${nome.trim()} entrou na lista!`)
    if (continuar) {
      setNome('')
      setErro('')
    } else onFechar()
  }

  return (
    <form onSubmit={salvar} className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{jogador ? 'Editar jogador' : 'Novo jogador'}</DialogTitle>
        <DialogDescription>Posição e nível ajudam a equilibrar o sorteio.</DialogDescription>
      </DialogHeader>
      <Label>
        Nome
        <Input
          autoFocus
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            setErro('')
          }}
          maxLength={40}
          placeholder="Ex.: Leonardo Santos"
          aria-invalid={!!erro}
        />
        {erro && <span className="text-xs text-destructive">{erro}</span>}
      </Label>
      <div className="grid gap-1.5 text-sm font-medium">
        Posição
        <Segmented
          aria-label="Posição"
          valor={posicao}
          onChange={setPosicao}
          className="w-full"
          opcoes={POSICOES.map((p) => ({ valor: p, rotulo: NOME_POSICAO[p] }))}
        />
      </div>
      <div className="grid gap-1.5 text-sm font-medium">
        Nível
        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-2 py-1">
          <Estrelas nivel={nivel} onChange={setNivel} tamanho="lg" />
          <span className="pr-2 text-xs text-muted-foreground">{['', 'Iniciante', 'Regular', 'Bom', 'Muito bom', 'Craque'][nivel]}</span>
        </div>
      </div>
      <label className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium">
        Presente hoje
        <Switch checked={presente} onCheckedChange={setPresente} />
      </label>
      <DialogFooter className="items-center">
        {!jogador && (
          <label className="mr-auto flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={continuar} onChange={(e) => setContinuar(e.target.checked)} />
            Adicionar outro em seguida
          </label>
        )}
        <Button type="submit" className="w-full sm:w-auto">
          {jogador ? 'Salvar' : 'Adicionar'}
        </Button>
      </DialogFooter>
    </form>
  )
}
