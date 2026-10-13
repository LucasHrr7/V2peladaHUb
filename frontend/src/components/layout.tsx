import { BarChart3, Cloud, CloudOff, Home, KeyRound, LoaderCircle, Moon, Settings, Shuffle, Sun, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useApp } from '@/store/app'
import { useSync } from '@/store/sync'
import { temaEscuro, useTema } from '@/hooks/use-tema'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Logo } from './logo'

const NAV = [
  { to: '/', rotulo: 'Partida', icone: Home },
  { to: '/jogadores', rotulo: 'Jogadores', icone: Users },
  { to: '/times', rotulo: 'Times', icone: Shuffle },
  { to: '/estatisticas', rotulo: 'Stats', rotuloLongo: 'Estatísticas', icone: BarChart3 },
  { to: '/ajustes', rotulo: 'Ajustes', icone: Settings },
]

function StatusSync() {
  const status = useSync((s) => s.status)
  const mapa = {
    iniciando: { icone: LoaderCircle, texto: 'Conectando…', cls: 'animate-spin' },
    salvando: { icone: LoaderCircle, texto: 'Salvando…', cls: 'animate-spin' },
    salvo: { icone: Cloud, texto: 'Salvo no servidor', cls: '' },
    offline: { icone: CloudOff, texto: 'Salvo só neste aparelho', cls: '' },
    'sem-pin': { icone: KeyRound, texto: 'Conectar ao servidor', cls: '' },
  }[status]
  const Icone = mapa.icone
  const conteudo = (
    <>
      <Icone className={cn('size-3.5', mapa.cls, (status === 'offline' || status === 'sem-pin') && 'text-amber-500')} />
      <span className="hidden sm:inline">{mapa.texto}</span>
    </>
  )
  // Sem PIN, o indicador vira atalho para a tela onde o organizador informa o PIN.
  return status === 'sem-pin' ? (
    <Link to="/ajustes" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground" title={mapa.texto}>
      {conteudo}
    </Link>
  ) : (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground" title={mapa.texto}>
      {conteudo}
    </span>
  )
}

function BotaoTema() {
  const { tema, setTema } = useTema()
  const escuro = temaEscuro(tema)
  return (
    <Button variant="ghost" size="icon-sm" onClick={() => setTema(escuro ? 'claro' : 'escuro')} aria-label="Alternar tema">
      {escuro ? <Sun /> : <Moon />}
    </Button>
  )
}

/** true depois que a página rola um pouco: o topo ganha vidro e fica mais compacto. */
function useRolou(limite = 8) {
  const [rolou, setRolou] = useState(false)
  useEffect(() => {
    const ouvir = () => setRolou(window.scrollY > limite)
    ouvir()
    window.addEventListener('scroll', ouvir, { passive: true })
    return () => window.removeEventListener('scroll', ouvir)
  }, [limite])
  return rolou
}

function Indicador({ to, emJogo, presentes, compacto }: { to: string; emJogo: boolean; presentes: number; compacto?: boolean }) {
  if (to === '/' && emJogo)
    return (
      <span className={cn('relative flex size-2', compacto ? 'absolute -top-0.5 -right-1' : 'ml-auto')}>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-red-500" />
      </span>
    )
  if (to === '/jogadores' && presentes > 0 && !compacto)
    return <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 font-display text-xs text-primary tabular">{presentes}</span>
  return null
}

export function Layout() {
  const local = useLocation()
  const config = useApp((s) => s.config)
  const emJogo = useApp((s) => !!s.rodada?.partida)
  const presentes = useApp((s) => s.jogadores.filter((j) => j.presente).length)
  const rolou = useRolou()

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[272px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="vidro sticky top-0 hidden h-dvh flex-col gap-8 border-r p-5 lg:flex">
        <div className="px-2 pt-1">
          <Logo />
        </div>
        <nav className="grid gap-1" aria-label="Navegação principal">
          {NAV.map(({ to, rotulo, rotuloLongo, icone: Icone }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground',
                  isActive && 'text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-ativo"
                      className="absolute inset-0 rounded-xl border border-primary/25 bg-primary/10 shadow-[0_0_24px_-8px_var(--primary)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className="absolute inset-0 rounded-xl bg-foreground/0 transition group-hover:bg-foreground/[0.04]" />
                  <Icone className={cn('relative size-5 transition', isActive && 'text-primary')} />
                  <span className="relative">{rotuloLongo ?? rotulo}</span>
                  <span className="relative ml-auto flex">
                    <Indicador to={to} emJogo={emJogo} presentes={presentes} />
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sombra mt-auto grid gap-3 rounded-2xl border bg-card/70 p-4">
          <div className="grid gap-0.5">
            <p className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">Sua pelada</p>
            <p className="truncate font-display text-base font-semibold">{config.nomePelada}</p>
            {config.local && <p className="truncate text-xs text-muted-foreground">{config.local}</p>}
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <StatusSync />
            <BotaoTema />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Topo (mobile): ganha vidro e borda quando a página rola */}
        <header
          className={cn(
            'sticky top-0 z-30 flex items-center justify-between px-4 transition-all duration-300 lg:hidden',
            rolou ? 'vidro h-14 border-b shadow-sm' : 'h-16 border-b border-transparent',
          )}
        >
          <Logo compacto={rolou} />
          <div className="flex items-center gap-1">
            <StatusSync />
            <BotaoTema />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-32 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={local.pathname}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Dock flutuante (mobile) */}
        <nav
          className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 lg:hidden"
          aria-label="Navegação principal"
        >
          <div className="sombra mx-auto grid max-w-md grid-cols-5 rounded-2xl border bg-card/92 p-1.5 backdrop-blur-xl">
            {NAV.map(({ to, rotulo, icone: Icone }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10.5px] font-semibold text-muted-foreground transition-colors active:scale-95',
                    isActive && 'text-primary',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="dock-ativo"
                        className="absolute inset-0 rounded-xl bg-primary/12 ring-1 ring-primary/25"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      />
                    )}
                    <span className="relative">
                      <Icone className="size-5" strokeWidth={isActive ? 2.4 : 2} />
                      <Indicador to={to} emJogo={emJogo} presentes={presentes} compacto />
                    </span>
                    <span className="relative">{rotulo}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
