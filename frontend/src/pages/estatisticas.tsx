import { useMemo, useState } from 'react'
import { BarChart3, CalendarDays, Crown, Goal, History, Medal, Trophy } from 'lucide-react'
import { useApp } from '@/store/app'
import { useMapaJogadores } from '@/hooks/use-app-data'
import { artilharia, partidasDaRodada, placar, tabelaTimes } from '@/lib/rodada'
import { cn, formatarTempo, plural } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import { Avatar, CabecalhoPagina, Camisa, Vazio } from '@/components/dominio'

export function PaginaEstatisticas() {
  const [aba, setAba] = useState<'rodada' | 'historico'>('rodada')
  return (
    <div>
      <CabecalhoPagina
        titulo="Estatísticas"
        descricao="Artilharia, classificação e resultados."
        acoes={
          <Segmented
            aria-label="Período"
            valor={aba}
            onChange={setAba}
            opcoes={[
              { valor: 'rodada', rotulo: 'Rodada atual' },
              { valor: 'historico', rotulo: 'Histórico' },
            ]}
          />
        }
      />
      {aba === 'rodada' ? <RodadaAtual /> : <Historico />}
    </div>
  )
}

function RodadaAtual() {
  const rodada = useApp((s) => s.rodada)
  const jogadores = useMapaJogadores()
  const partidas = useMemo(() => partidasDaRodada(rodada), [rodada])
  const gols = useMemo(() => artilharia(partidas), [partidas])
  const tabela = useMemo(() => (rodada ? tabelaTimes(rodada) : []), [rodada])

  if (!rodada) {
    return <Vazio icone={<BarChart3 />} titulo="Nenhuma rodada em andamento" descricao="Sorteie os times e registre os gols para ver a artilharia e a classificação aqui." />
  }

  const totalGols = partidas.reduce((s, p) => s + p.gols.length, 0)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="grid grid-cols-3 gap-3 lg:col-span-2">
        {[
          { rotulo: 'Jogos', valor: rodada.historico.length, icone: CalendarDays },
          { rotulo: 'Gols', valor: totalGols, icone: Goal },
          { rotulo: 'Média por jogo', valor: rodada.historico.length ? (rodada.historico.reduce((s, p) => s + p.gols.length, 0) / rodada.historico.length).toFixed(1) : '–', icone: BarChart3 },
        ].map(({ rotulo, valor, icone: Icone }) => (
          <Card key={rotulo} className="p-4">
            <Icone className="mb-2 size-5 text-primary" />
            <p className="font-display text-2xl font-bold tabular sm:text-3xl">{valor}</p>
            <p className="text-xs text-muted-foreground">{rotulo}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Goal className="size-5 text-primary" /> Artilharia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gols.length === 0 ? (
            <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">Ninguém marcou ainda.</p>
          ) : (
            <ol className="grid gap-1.5">
              {gols.map((g, i) => {
                const j = jogadores.get(g.jogadorId)
                const max = gols[0].gols
                return (
                  <li key={g.jogadorId} className="relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2">
                    <div className="absolute inset-y-0 left-0 rounded-xl bg-primary/8" style={{ width: `${(g.gols / max) * 100}%` }} />
                    <span className={cn('relative w-5 text-center text-sm font-bold tabular', i < 3 ? 'text-primary' : 'text-muted-foreground')}>{i + 1}</span>
                    <Avatar nome={j?.nome ?? '?'} className="relative size-8 text-[10px]" />
                    <span className="relative min-w-0 flex-1 truncate text-sm font-medium">{j?.nome ?? 'Jogador removido'}</span>
                    {i === 0 && <Crown className="relative size-4 text-amber-500" />}
                    <span className="relative font-display text-lg font-bold tabular">{g.gols}</span>
                  </li>
                )
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" /> Classificação
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="py-2 text-left font-medium">Time</th>
                {['P', 'J', 'V', 'E', 'D', 'SG'].map((h) => (
                  <th key={h} className="w-9 py-2 text-center font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabela.map((l, i) => (
                <tr key={l.time.id} className="border-t">
                  <td className="py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="w-4 text-xs text-muted-foreground tabular">{i + 1}</span>
                      <Camisa cor={l.time.cor} className="size-7 rounded-lg" />
                      <span className="truncate font-medium">{l.time.nome}</span>
                    </span>
                  </td>
                  <td className="text-center font-bold tabular">{l.pontos}</td>
                  <td className="text-center tabular">{l.jogos}</td>
                  <td className="text-center tabular">{l.vitorias}</td>
                  <td className="text-center tabular">{l.empates}</td>
                  <td className="text-center tabular">{l.derrotas}</td>
                  <td className="text-center tabular">{l.golsPro - l.golsContra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-5 text-primary" /> Resultados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rodada.historico.length === 0 ? (
            <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">Os resultados aparecem aqui quando uma partida termina.</p>
          ) : (
            <ul className="grid gap-2 md:grid-cols-2">
              {[...rodada.historico].reverse().map((p, i) => {
                const a = rodada.times.find((t) => t.id === p.timeA)
                const b = rodada.times.find((t) => t.id === p.timeB)
                const s = placar(p)
                return (
                  <li key={p.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-muted/50 px-3 py-3">
                    <span className={cn('flex min-w-0 items-center gap-2', p.vencedor && p.vencedor !== p.timeA && 'opacity-60')}>
                      {a && <Camisa cor={a.cor} className="size-7 rounded-lg" />}
                      <span className="truncate text-sm font-medium">{a?.nome}</span>
                    </span>
                    <span className="text-center">
                      <span className="block font-display text-lg font-bold tabular">
                        {s.a} × {s.b}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        Jogo {rodada.historico.length - i}
                        {p.duracaoSeg > 0 && ` · ${formatarTempo(p.duracaoSeg)}`}
                      </span>
                    </span>
                    <span className={cn('flex min-w-0 items-center justify-end gap-2', p.vencedor && p.vencedor !== p.timeB && 'opacity-60')}>
                      <span className="truncate text-right text-sm font-medium">{b?.nome}</span>
                      {b && <Camisa cor={b.cor} className="size-7 rounded-lg" />}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Historico() {
  const anteriores = useApp((s) => s.rodadasAnteriores)
  const ranking = useMemo(() => {
    const m = new Map<string, { gols: number; rodadas: number }>()
    for (const r of anteriores) {
      if (!r.artilheiro) continue
      const x = m.get(r.artilheiro.nome) ?? { gols: 0, rodadas: 0 }
      m.set(r.artilheiro.nome, { gols: x.gols + r.artilheiro.gols, rodadas: x.rodadas + 1 })
    }
    return [...m.entries()].sort((a, b) => b[1].rodadas - a[1].rodadas || b[1].gols - a[1].gols).slice(0, 5)
  }, [anteriores])

  if (!anteriores.length) {
    return <Vazio icone={<History />} titulo="Sem rodadas finalizadas" descricao="Quando você finalizar uma rodada, o resumo dela fica guardado aqui." />
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader>
          <CardTitle>{plural(anteriores.length, 'rodada', 'rodadas')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {anteriores.map((r) => (
            <div key={r.id} className="grid gap-2 rounded-xl bg-muted/50 p-4 sm:grid-cols-[120px_1fr_1fr] sm:items-center">
              <div>
                <p className="font-semibold">{new Date(r.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <p className="text-xs text-muted-foreground">
                  {plural(r.partidas, 'jogo', 'jogos')} · {plural(r.gols, 'gol', 'gols')}
                </p>
              </div>
              <p className="flex items-center gap-2 text-sm">
                <Trophy className="size-4 shrink-0 text-amber-500" />
                {r.campeao ? `${r.campeao.nome} (${plural(r.campeao.vitorias, 'vitória', 'vitórias')})` : '—'}
              </p>
              <p className="flex items-center gap-2 text-sm">
                <Goal className="size-4 shrink-0 text-primary" />
                {r.artilheiro ? `${r.artilheiro.nome} (${plural(r.artilheiro.gols, 'gol', 'gols')})` : '—'}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="size-5 text-amber-500" /> Mais vezes artilheiro
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {ranking.length === 0 && <p className="text-sm text-muted-foreground">Sem gols registrados.</p>}
          {ranking.map(([nome, x], i) => (
            <div key={nome} className="flex items-center gap-3">
              <span className="w-4 text-sm font-bold text-muted-foreground tabular">{i + 1}</span>
              <Avatar nome={nome} className="size-8 text-[10px]" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{nome}</span>
              <span className="text-xs text-muted-foreground">
                {x.rodadas}× · {plural(x.gols, 'gol', 'gols')}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
