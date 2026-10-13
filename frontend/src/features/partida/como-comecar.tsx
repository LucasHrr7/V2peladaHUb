import { Link } from 'react-router'
import { ArrowRight, Check, Goal, Shuffle, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/store/app'
import { viabilidade } from '@/lib/sorteio'
import { cn, plural } from '@/lib/utils'
import { LogoMarca } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ComoComecar() {
  const jogadores = useApp((s) => s.jogadores)
  const config = useApp((s) => s.config)
  const anteriores = useApp((s) => s.rodadasAnteriores)
  const sortear = useApp((s) => s.sortear)
  const presentes = jogadores.filter((j) => j.presente).length
  const v = viabilidade(presentes, config)

  const passos = [
    {
      feito: jogadores.length > 0,
      titulo: 'Cadastre a galera',
      texto: jogadores.length ? `${plural(jogadores.length, 'jogador cadastrado', 'jogadores cadastrados')}` : 'Adicione um por um ou cole a lista do WhatsApp.',
      link: '/jogadores',
      acao: 'Jogadores',
    },
    {
      feito: v.ok,
      titulo: 'Marque quem chegou',
      texto: v.ok ? `${presentes} presentes · ${v.numTimes} times de ${config.jogadoresPorTime}` : (v.motivo ?? ''),
      link: '/jogadores',
      acao: 'Presença',
    },
    {
      feito: false,
      titulo: 'Sorteie e bola rolando',
      texto: config.modoSorteio === 'equilibrado' ? 'Sorteio equilibrado pelo nível de cada jogador.' : 'Sorteio 100% aleatório.',
      link: '/times',
      acao: 'Times',
    },
  ]

  const iniciar = () => {
    const r = sortear()
    if (r.ok) toast.success(r.mensagem)
    else toast.error(r.mensagem)
  }

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl placar p-6 text-white sm:p-10">
        <div className="pitch-pattern pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-10 grid max-w-xl gap-4">
          <Badge variant="lime" className="w-fit">
            {config.nomePelada}
          </Badge>
          <h1 className="text-3xl font-bold sm:text-5xl">Bora organizar a pelada?</h1>
          <p className="text-white/80 sm:text-lg">
            Lista de presença, sorteio equilibrado, placar com cronômetro, fila de times e artilharia. Tudo no celular, à beira do campo.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="lime" size="lg" onClick={iniciar} disabled={!v.ok}>
              <Shuffle /> Sortear times
            </Button>
            <Button variant="glass" size="lg" asChild>
              <Link to="/jogadores">
                <Users /> Jogadores
              </Link>
            </Button>
          </div>
        </div>
        <LogoMarca className="pointer-events-none absolute -right-10 -bottom-12 size-56 rotate-12 opacity-20 sm:size-80" />
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {passos.map((p, i) => (
          <Link key={p.titulo} to={p.link} className="group">
            <Card className="flex h-full items-start gap-4 p-5 transition group-hover:border-primary/40 group-hover:shadow-md">
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold',
                  p.feito ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {p.feito ? <Check className="size-4" /> : i + 1}
              </span>
              <div className="grid min-w-0 gap-1">
                <p className="font-semibold">{p.titulo}</p>
                <p className="text-sm text-muted-foreground">{p.texto}</p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Card>
          </Link>
        ))}
      </div>

      {anteriores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rodadas anteriores</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/estatisticas">
                Ver tudo <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-2">
            {anteriores.slice(0, 3).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-muted/50 px-4 py-3 text-sm">
                <span className="font-semibold">{new Date(r.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                <span className="text-muted-foreground">
                  {plural(r.partidas, 'jogo', 'jogos')} · {plural(r.gols, 'gol', 'gols')}
                </span>
                {r.artilheiro && (
                  <span className="ml-auto flex items-center gap-1">
                    <Goal className="size-3.5 text-primary" /> {r.artilheiro.nome} ({r.artilheiro.gols})
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
