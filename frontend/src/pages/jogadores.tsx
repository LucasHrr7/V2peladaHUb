import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCheck, ClipboardPaste, Search, Shuffle, UserPlus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/store/app'
import { viabilidade } from '@/lib/sorteio'
import type { Jogador } from '@/lib/types'
import { normalizar, plural } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CabecalhoPagina, Vazio } from '@/components/dominio'
import { LinhaJogador } from '@/features/jogadores/linha-jogador'
import { DialogJogador } from '@/features/jogadores/form-jogador'
import { DialogColarLista } from '@/features/jogadores/dialog-colar-lista'

type Filtro = 'todos' | 'presentes' | 'ausentes'

export function PaginaJogadores() {
  const jogadores = useApp((s) => s.jogadores)
  const config = useApp((s) => s.config)
  const temRodada = useApp((s) => !!s.rodada)
  const { alternarPresenca, definirPresencaTodos, sortear } = useApp.getState()
  const navegar = useNavigate()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [editando, setEditando] = useState<Jogador | 'novo' | null>(null)
  const [colando, setColando] = useState(false)

  const presentes = useMemo(
    () => jogadores.filter((j) => j.presente).sort((a, b) => (a.chegadaEm ?? 0) - (b.chegadaEm ?? 0)),
    [jogadores],
  )
  const ordemChegada = useMemo(() => new Map(presentes.map((j, i) => [j.id, i + 1])), [presentes])
  const v = viabilidade(presentes.length, config)

  const lista = useMemo(() => {
    const q = normalizar(busca)
    return jogadores
      .filter((j) => (filtro === 'presentes' ? j.presente : filtro === 'ausentes' ? !j.presente : true))
      .filter((j) => !q || normalizar(j.nome).includes(q))
      .sort((a, b) => Number(b.presente) - Number(a.presente) || a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [jogadores, filtro, busca])

  const iniciarSorteio = () => {
    const r = sortear()
    if (!r.ok) return toast.error(r.mensagem)
    toast.success(r.mensagem)
    navegar('/times')
  }

  return (
    <div>
      <CabecalhoPagina
        titulo="Jogadores"
        descricao={`${plural(jogadores.length, 'cadastrado', 'cadastrados')} · ${plural(presentes.length, 'presente', 'presentes')}`}
        acoes={
          <>
            <Button variant="outline" onClick={() => setColando(true)}>
              <ClipboardPaste /> Colar lista
            </Button>
            <Button onClick={() => setEditando('novo')}>
              <UserPlus /> Novo jogador
            </Button>
          </>
        }
      />

      {jogadores.length > 0 && (
        <Card className="mb-5 flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold">
                {presentes.length} {presentes.length === 1 ? 'presente' : 'presentes'}
              </span>
              <span className="text-muted-foreground">
                {v.ok
                  ? `${v.numTimes} times de ${config.jogadoresPorTime}${v.sobra ? ` · ${v.sobra} de fora` : ''}`
                  : v.motivo}
              </span>
            </div>
            <div className="flex h-2 gap-1">
              {Array.from({ length: Math.max(2, v.numTimes + (v.ok ? 0 : 1)) }).map((_, i) => {
                const cheio = Math.min(config.jogadoresPorTime, Math.max(0, presentes.length - i * config.jogadoresPorTime))
                return (
                  <div key={i} className="flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(cheio / config.jogadoresPorTime) * 100}%` }} />
                  </div>
                )
              })}
            </div>
          </div>
          <Button onClick={iniciarSorteio} disabled={!v.ok} className="sm:w-auto">
            <Shuffle /> {temRodada ? 'Sortear de novo' : 'Sortear times'}
          </Button>
        </Card>
      )}

      {jogadores.length === 0 ? (
        <Vazio icone={<Users />} titulo="Nenhum jogador ainda" descricao="Cadastre a galera da pelada. Dica: cole a lista do grupo do WhatsApp de uma vez só.">
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setColando(true)}>
              <ClipboardPaste /> Colar lista
            </Button>
            <Button onClick={() => setEditando('novo')}>
              <UserPlus /> Novo jogador
            </Button>
          </div>
        </Vazio>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar jogador" className="pl-9" aria-label="Buscar jogador" />
              {busca && (
                <button className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted" onClick={() => setBusca('')} aria-label="Limpar busca">
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Segmented
                aria-label="Filtrar jogadores"
                valor={filtro}
                onChange={setFiltro}
                className="flex-1 sm:flex-none"
                opcoes={[
                  { valor: 'todos', rotulo: 'Todos' },
                  { valor: 'presentes', rotulo: 'Presentes' },
                  { valor: 'ausentes', rotulo: 'Ausentes' },
                ]}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Ações de presença">
                    <CheckCheck />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => definirPresencaTodos(true)}>
                    <CheckCheck /> Marcar todos presentes
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => definirPresencaTodos(false)}>
                    <X /> Limpar presença
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {lista.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhum jogador encontrado.</p>
          ) : (
            <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false}>
                {lista.map((j) => (
                  <motion.li key={j.id} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                    <LinhaJogador
                      jogador={j}
                      ordem={ordemChegada.get(j.id)}
                      onPresenca={() => alternarPresenca(j.id)}
                      onEditar={() => setEditando(j)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </>
      )}

      <DialogJogador jogador={editando} onFechar={() => setEditando(null)} />
      <DialogColarLista aberto={colando} onFechar={() => setColando(false)} />
    </div>
  )
}
