import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Play, Share2, Shuffle, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/store/app'
import { viabilidade } from '@/lib/sorteio'
import { textoTimes } from '@/lib/rodada'
import { compartilharTexto } from '@/lib/alerta'
import type { Time } from '@/lib/types'
import { plural } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Confirmar } from '@/components/ui/confirm'
import { Avatar, CabecalhoPagina } from '@/components/dominio'
import { OpcoesSorteio } from '@/features/times/opcoes-sorteio'
import { CardTime } from '@/features/times/card-time'
import { MenuMover } from '@/features/times/mover-jogador'
import { DialogRenomear } from '@/features/times/dialog-renomear'

export function PaginaTimes() {
  const rodada = useApp((s) => s.rodada)
  const jogadores = useApp((s) => s.jogadores)
  const config = useApp((s) => s.config)
  const sortear = useApp((s) => s.sortear)
  const navegar = useNavigate()
  const [renomeando, setRenomeando] = useState<Time | null>(null)

  const presentes = jogadores.filter((j) => j.presente)
  const v = viabilidade(presentes.length, config)

  const fazerSorteio = () => {
    const r = sortear()
    if (!r.ok) return toast.error(r.mensagem)
    toast.success(r.mensagem, {
      description: r.deFora?.length ? `${plural(r.deFora.length, 'jogador ficou', 'jogadores ficaram')} de fora por ordem de chegada.` : undefined,
    })
  }

  const compartilhar = async () => {
    if (!rodada) return
    const r = await compartilharTexto(textoTimes(rodada, jogadores, config))
    if (r === 'copiado') toast.success('Times copiados! É só colar no grupo.')
    else if (r === 'falhou') toast.error('Não foi possível compartilhar.')
  }

  if (!rodada) {
    return (
      <div>
        <CabecalhoPagina titulo="Sorteio de times" descricao={`${plural(presentes.length, 'jogador presente', 'jogadores presentes')}`} />
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <OpcoesSorteio />
          <Card className="flex flex-col gap-4 p-5">
            <div className="grid gap-1">
              <p className="font-display text-lg font-bold">{v.ok ? `${v.numTimes} times prontos para sair` : 'Ainda não dá para sortear'}</p>
              <p className="text-sm text-muted-foreground">
                {v.ok
                  ? v.sobra
                    ? `${plural(v.sobra, 'jogador fica', 'jogadores ficam')} de fora (os últimos a chegar).`
                    : 'Todo mundo joga.'
                  : v.motivo}
              </p>
            </div>
            <Button size="lg" onClick={fazerSorteio} disabled={!v.ok}>
              <Shuffle /> Sortear times
            </Button>
            <Button variant="outline" asChild>
              <Link to="/jogadores">
                <Users /> Marcar presença
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const mapaTimes = new Map(rodada.times.map((t) => [t.id, t]))
  const emCampo = rodada.partida ? [rodada.partida.timeA, rodada.partida.timeB] : []
  const naRodada = new Set(rodada.times.flatMap((t) => t.jogadores))
  const semTime = presentes.filter((j) => !naRodada.has(j.id))

  return (
    <div>
      <CabecalhoPagina
        titulo="Times da rodada"
        descricao={`${plural(rodada.times.length, 'time', 'times')} · ${config.modoSorteio === 'equilibrado' ? 'sorteio equilibrado' : 'sorteio aleatório'}`}
        acoes={
          <>
            <Button variant="outline" onClick={compartilhar}>
              <Share2 /> Compartilhar
            </Button>
            <Confirmar
              titulo="Sortear de novo?"
              descricao="Os times atuais serão desfeitos. Se já houve jogos, o resumo vai para o histórico."
              acao="Sortear"
              onConfirmar={fazerSorteio}
            >
              <Button variant="outline">
                <Shuffle /> Novo sorteio
              </Button>
            </Confirmar>
            {rodada.partida && (
              <Button onClick={() => navegar('/')}>
                <Play /> Ir para a partida
              </Button>
            )}
          </>
        }
      />

      {emCampo.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            <span className="size-2 animate-pulse rounded-full bg-red-500" /> Em campo
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {emCampo.map((id) => mapaTimes.get(id) && <CardTime key={id} time={mapaTimes.get(id)!} status="Em campo" onRenomear={setRenomeando} />)}
          </div>
        </section>
      )}

      {rodada.fila.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Fila de espera</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rodada.fila.map(
              (id, i) =>
                mapaTimes.get(id) && (
                  <CardTime
                    key={id}
                    time={mapaTimes.get(id)!}
                    status={i === 0 ? 'Próximo' : `${i + 1}º na fila`}
                    posicaoFila={{ i, total: rodada.fila.length }}
                    onRenomear={setRenomeando}
                  />
                ),
            )}
          </div>
        </section>
      )}

      {semTime.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Presentes sem time</h2>
          <Card className="divide-y">
            {semTime.map((j) => (
              <div key={j.id} className="flex items-center gap-3 p-3">
                <Avatar nome={j.nome} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{j.nome}</p>
                  <p className="text-xs text-muted-foreground">Chegou depois do sorteio ou ficou de fora</p>
                </div>
                <MenuMover jogadorId={j.id} timeAtual={null} rotulo="Colocar no time" />
              </div>
            ))}
          </Card>
        </section>
      )}

      <DialogRenomear time={renomeando} onFechar={() => setRenomeando(null)} />
    </div>
  )
}
