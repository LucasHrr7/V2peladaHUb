import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Flag, Goal, Pause, Play, RotateCcw, Timer, Trophy, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/store/app'
import { useFimDeTempo, useMapaJogadores, useMapaTimes, useTempoDecorrido } from '@/hooks/use-app-data'
import { placar } from '@/lib/rodada'
import { apitar } from '@/lib/alerta'
import { cn, formatarTempo, plural } from '@/lib/utils'
import type { Time } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Confirmar } from '@/components/ui/confirm'
import { Camisa } from '@/components/dominio'
import { nomeCurto, Numero, LadoTime } from '@/features/partida/placar'
import { DialogGol } from '@/features/partida/dialog-gol'

export function PartidaAoVivo() {
  const rodada = useApp((s) => s.rodada)!
  const config = useApp((s) => s.config)
  const cronometro = useApp((s) => s.cronometro)
  const { alternarCronometro, zerarCronometro, desfazerGol, encerrarPartida, finalizarRodada } = useApp.getState()
  const times = useMapaTimes()
  const jogadores = useMapaJogadores()
  const decorrido = useTempoDecorrido()
  const [golPara, setGolPara] = useState<Time | null>(null)

  const p = rodada.partida!
  const timeA = times.get(p.timeA)!
  const timeB = times.get(p.timeB)!
  const { a, b } = placar(p)
  const limite = config.duracaoMin * 60
  const restante = limite - decorrido
  const acrescimo = limite > 0 && restante < 0
  const progresso = limite > 0 ? Math.min(1, decorrido / limite) : 0
  const atingiuGols = config.golsParaVencer > 0 && (a >= config.golsParaVencer || b >= config.golsParaVencer)
  const proximo = rodada.fila[0] ? times.get(rodada.fila[0]) : undefined

  const aoAcabarTempo = useCallback(() => {
    if (config.somAoFimDoTempo) apitar()
    toast.warning('Fim do tempo regulamentar!', { description: 'Encerre a partida quando a bola sair.' })
  }, [config.somAoFimDoTempo])
  useFimDeTempo(decorrido, limite, cronometro.rodando, aoAcabarTempo)

  const previa = useMemo(() => {
    if (a === b) {
      return config.regraEmpate === 'ambos-saem'
        ? 'Empate: os dois times vão para o fim da fila.'
        : config.regraEmpate === 'desafiante-sai'
          ? `Empate: ${timeB.nome} sai e ${timeA.nome} continua.`
          : `Empate: ${timeA.nome} sai e ${timeB.nome} continua.`
    }
    const venc = a > b ? timeA : timeB
    return `${venc.nome} vence e continua em campo.`
  }, [a, b, config.regraEmpate, timeA, timeB])

  const encerrar = () => {
    const msg = encerrarPartida()
    if (msg) toast.success(msg)
  }

  const ultimosGols = [...p.gols].reverse()
  const sequencia = rodada.sequencia?.timeId === p.timeA ? rodada.sequencia.vitorias : 0

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid content-start gap-5">
        {/* Placar */}
        <section className="relative overflow-hidden rounded-3xl placar p-5 text-white sm:p-7">
          <div className="pitch-pattern pointer-events-none absolute inset-0" aria-hidden />
          <div className="flex items-center justify-between gap-2">
            <Badge variant="live" className="gap-1.5">
              <span className={cn('size-1.5 rounded-full bg-white', cronometro.rodando && 'animate-pulse')} />
              {cronometro.rodando ? 'AO VIVO' : 'PAUSADO'}
            </Badge>
            <span className="text-xs font-medium text-white/70">
              Jogo {rodada.historico.length + 1}
              {config.golsParaVencer > 0 && ` · ${config.golsParaVencer} gols vence`}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
            <LadoTime time={timeA} extra={sequencia > 0 ? `${sequencia} ${sequencia === 1 ? 'vitória' : 'vitórias'} seguida${sequencia > 1 ? 's' : ''}` : 'Em campo'} />
            <div className="text-center">
              <div className="led flex items-center gap-2 text-6xl font-bold sm:text-7xl">
                <Numero valor={a} />
                <span className="text-3xl text-white/40">:</span>
                <Numero valor={b} />
              </div>
            </div>
            <LadoTime time={timeB} extra="Desafiante" />
          </div>

          {/* Cronômetro */}
          <div className="mt-6 grid gap-3 rounded-2xl bg-black/20 p-3 backdrop-blur-sm sm:p-4">
            <div className="flex items-center gap-3">
              <Button
                variant={cronometro.rodando ? 'glass' : 'lime'}
                size="icon"
                className="size-12 rounded-full"
                onClick={alternarCronometro}
                aria-label={cronometro.rodando ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
              >
                {cronometro.rodando ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
              </Button>
              <div className="min-w-0 flex-1">
                <div className={cn('led text-3xl font-bold', acrescimo && 'text-lime')}>
                  {limite > 0 ? (acrescimo ? `+${formatarTempo(-restante)}` : formatarTempo(restante)) : formatarTempo(decorrido)}
                </div>
                <p className="text-xs text-white/60">
                  {limite > 0 ? (acrescimo ? 'Acréscimo' : `de ${config.duracaoMin} min`) : 'Tempo corrido'}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" className="text-white/70 hover:bg-white/10 hover:text-white" onClick={zerarCronometro} aria-label="Zerar cronômetro">
                <RotateCcw />
              </Button>
            </div>
            {limite > 0 && (
              <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                <motion.div className={cn('h-full rounded-full', acrescimo ? 'bg-lime' : 'bg-white')} animate={{ width: `${progresso * 100}%` }} transition={{ ease: 'linear', duration: 0.25 }} />
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
            <Button variant="glass" size="lg" className="h-14 text-base" onClick={() => setGolPara(timeA)}>
              <Goal /> <span className="truncate">Gol {nomeCurto(timeA.nome)}</span>
            </Button>
            <Button variant="glass" size="lg" className="h-14 text-base" onClick={() => setGolPara(timeB)}>
              <Goal /> <span className="truncate">Gol {nomeCurto(timeB.nome)}</span>
            </Button>
          </div>

          <AnimatePresence>
            {atingiuGols && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-lime px-4 py-3 text-sm font-medium text-neutral-900">
                  <Flag className="size-4 shrink-0" />
                  <span className="flex-1">{a > b ? timeA.nome : timeB.nome} chegou a {config.golsParaVencer} gols.</span>
                  <Button size="sm" className="bg-neutral-900 text-white hover:bg-neutral-800" onClick={encerrar}>
                    Encerrar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Confirmar titulo="Encerrar partida?" descricao={`${timeA.nome} ${a} × ${b} ${timeB.nome}. ${previa}`} acao="Encerrar partida" onConfirmar={encerrar}>
            <Button variant="lime" size="lg" className="mt-3 w-full">
              <Flag /> Encerrar partida
            </Button>
          </Confirmar>
        </section>

        {/* Gols da partida */}
        <Card>
          <CardHeader>
            <CardTitle>Lances da partida</CardTitle>
            <Button variant="ghost" size="sm" onClick={desfazerGol} disabled={!p.gols.length}>
              <Undo2 /> Desfazer gol
            </Button>
          </CardHeader>
          <CardContent>
            {ultimosGols.length === 0 ? (
              <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">Nenhum gol ainda. Toque em “Gol” para registrar o autor.</p>
            ) : (
              <ul className="grid gap-2">
                <AnimatePresence initial={false}>
                  {ultimosGols.map((g) => {
                    const t = times.get(g.timeId)
                    const j = g.jogadorId ? jogadores.get(g.jogadorId) : undefined
                    return (
                      <motion.li
                        key={g.id}
                        layout
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5"
                      >
                        {t && <Camisa cor={t.cor} className="size-8 rounded-lg" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{j?.nome ?? 'Gol sem autor'}</p>
                          <p className="text-xs text-muted-foreground">{t?.nome}</p>
                        </div>
                        <span className="tabular text-xs font-semibold text-muted-foreground">{Math.floor(g.segundo / 60)}'</span>
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="grid content-start gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Próximo da fila</CardTitle>
            <Badge variant="secondary">{plural(rodada.fila.length, 'time', 'times')}</Badge>
          </CardHeader>
          <CardContent>
            {proximo ? (
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Camisa cor={proximo.cor} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{proximo.nome}</p>
                    <p className="text-xs text-muted-foreground">Entra contra o vencedor</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {proximo.jogadores.map((id) => (
                    <span key={id} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                      {jogadores.get(id)?.nome}
                    </span>
                  ))}
                </div>
                {rodada.fila.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Depois: {rodada.fila.slice(1).map((id) => times.get(id)?.nome).join(' → ')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Só há dois times: o perdedor volta logo em seguida.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo da rodada</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-center">
            {[
              { rotulo: 'Jogos', valor: rodada.historico.length },
              { rotulo: 'Gols', valor: rodada.historico.reduce((s, x) => s + x.gols.length, 0) + p.gols.length },
              { rotulo: 'Times', valor: rodada.times.length },
            ].map((x) => (
              <div key={x.rotulo} className="rounded-xl bg-muted/50 py-3">
                <p className="font-display text-2xl font-bold tabular">{x.valor}</p>
                <p className="text-xs text-muted-foreground">{x.rotulo}</p>
              </div>
            ))}
          </CardContent>
          <CardContent className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/estatisticas">
                <Trophy /> Ranking
              </Link>
            </Button>
            <Confirmar
              titulo="Finalizar a rodada?"
              descricao="O resumo vai para o histórico e os times são desfeitos. A lista de jogadores continua salva."
              acao="Finalizar"
              onConfirmar={() => {
                finalizarRodada()
                toast.success('Rodada finalizada. Valeu, boleiros!')
              }}
            >
              <Button variant="outline" className="flex-1">
                <Timer /> Finalizar
              </Button>
            </Confirmar>
          </CardContent>
        </Card>
      </aside>

      <DialogGol time={golPara} onFechar={() => setGolPara(null)} />
    </div>
  )
}
