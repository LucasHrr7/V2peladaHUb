import { useEffect, useRef, useState } from 'react'
import { Download, MonitorSmartphone, Moon, Smartphone, Sun, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { extrairEstado, useApp } from '@/store/app'
import { useTema } from '@/hooks/use-tema'
import type { EstadoApp, RegraEmpate } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Segmented } from '@/components/ui/segmented'
import { Stepper } from '@/components/ui/stepper'
import { Confirmar } from '@/components/ui/confirm'
import { CabecalhoPagina } from '@/components/dominio'
import { OpcoesSorteio } from '@/features/times/opcoes-sorteio'
import { CardServidor } from '@/features/ajustes/servidor'

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
}

export function PaginaAjustes() {
  const config = useApp((s) => s.config)
  const { atualizarConfig, substituirEstado, apagarTudo } = useApp.getState()
  const { tema, setTema } = useTema()
  const arquivo = useRef<HTMLInputElement>(null)
  const [instalacao, setInstalacao] = useState<EventoInstalacao | null>(null)

  useEffect(() => {
    const ouvir = (e: Event) => {
      e.preventDefault()
      setInstalacao(e as EventoInstalacao)
    }
    window.addEventListener('beforeinstallprompt', ouvir)
    return () => window.removeEventListener('beforeinstallprompt', ouvir)
  }, [])

  const exportar = () => {
    const dados = JSON.stringify(extrairEstado(useApp.getState()), null, 2)
    const url = URL.createObjectURL(new Blob([dados], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `peladahub-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importar = async (file: File) => {
    try {
      const dados = JSON.parse(await file.text()) as EstadoApp
      if (dados.versao !== 2 || !Array.isArray(dados.jogadores)) throw new Error()
      substituirEstado({ ...dados, atualizadoEm: Date.now() })
      toast.success('Backup restaurado.')
    } catch {
      toast.error('Arquivo inválido.')
    }
  }

  return (
    <div className="grid gap-5">
      <CabecalhoPagina titulo="Ajustes" descricao="Regras da pelada, sorteio, aparência e dados." />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>A pelada</CardTitle>
              <CardDescription>Aparece no topo e no texto compartilhado.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Label>
              Nome
              <Input value={config.nomePelada} maxLength={40} onChange={(e) => atualizarConfig({ nomePelada: e.target.value })} />
            </Label>
            <Label>
              Local
              <Input value={config.local} maxLength={60} placeholder="Ex.: Society do Zé, quadra 2" onChange={(e) => atualizarConfig({ local: e.target.value })} />
            </Label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Regras da partida</CardTitle>
              <CardDescription>Valem a partir do próximo jogo.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Regra titulo="Duração" texto="0 = sem tempo, cronômetro corrido.">
              <Stepper aria-label="Duração" valor={config.duracaoMin} min={0} max={90} formatar={(v) => (v ? `${v} min` : 'Livre')} onChange={(duracaoMin) => atualizarConfig({ duracaoMin })} />
            </Regra>
            <Regra titulo="Gols para vencer" texto="Quem fizer primeiro ganha. 0 = sem limite.">
              <Stepper aria-label="Gols para vencer" valor={config.golsParaVencer} min={0} max={10} formatar={(v) => (v ? String(v) : 'Livre')} onChange={(golsParaVencer) => atualizarConfig({ golsParaVencer })} />
            </Regra>
            <Regra titulo="Vitórias seguidas" texto="Depois de X vitórias o time sai. 0 = fica até perder.">
              <Stepper aria-label="Máximo de vitórias seguidas" valor={config.maxVitoriasSeguidas} min={0} max={10} formatar={(v) => (v ? String(v) : 'Livre')} onChange={(maxVitoriasSeguidas) => atualizarConfig({ maxVitoriasSeguidas })} />
            </Regra>
            <div className="grid gap-2">
              <div>
                <p className="text-sm font-semibold">Em caso de empate</p>
                <p className="text-xs text-muted-foreground">Quem estava em campo é o time que venceu o jogo anterior.</p>
              </div>
              <Segmented<RegraEmpate>
                aria-label="Regra de empate"
                valor={config.regraEmpate}
                onChange={(regraEmpate) => atualizarConfig({ regraEmpate })}
                className="w-full"
                opcoes={[
                  { valor: 'ambos-saem', rotulo: 'Os dois saem' },
                  { valor: 'quem-estava-sai', rotulo: 'Sai quem estava' },
                  { valor: 'desafiante-sai', rotulo: 'Sai quem entrou' },
                ]}
              />
            </div>
            <Regra titulo="Apito no fim do tempo" texto="Som e vibração quando o tempo acabar.">
              <Switch checked={config.somAoFimDoTempo} onCheckedChange={(somAoFimDoTempo) => atualizarConfig({ somAoFimDoTempo })} />
            </Regra>
          </CardContent>
        </Card>

        <div className="grid content-start gap-3">
          <h2 className="font-display text-lg font-bold">Sorteio</h2>
          <OpcoesSorteio />
        </div>

        <div className="grid content-start gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
            </CardHeader>
            <CardContent>
              <Segmented
                aria-label="Tema"
                valor={tema}
                onChange={setTema}
                className="w-full"
                opcoes={[
                  { valor: 'claro', rotulo: <><Sun className="size-4" /> Claro</> },
                  { valor: 'escuro', rotulo: <><Moon className="size-4" /> Escuro</> },
                  { valor: 'sistema', rotulo: <><MonitorSmartphone className="size-4" /> Sistema</> },
                ]}
              />
            </CardContent>
          </Card>

          <CardServidor />

          {instalacao && (
            <Card className="flex items-center gap-4 p-5">
              <Smartphone className="size-8 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">Instalar o app</p>
                <p className="text-sm text-muted-foreground">Abra direto da tela inicial, mesmo sem internet.</p>
              </div>
              <Button
                onClick={async () => {
                  await instalacao.prompt()
                  setInstalacao(null)
                }}
              >
                Instalar
              </Button>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Dados</CardTitle>
                <CardDescription>Tudo fica salvo neste aparelho. Exporte um backup para guardar ou levar para outro lugar.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={exportar}>
                <Download /> Exportar backup
              </Button>
              <Button variant="outline" onClick={() => arquivo.current?.click()}>
                <Upload /> Importar backup
              </Button>
              <input
                ref={arquivo}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void importar(f)
                  e.target.value = ''
                }}
              />
              <Confirmar
                titulo="Apagar tudo?"
                descricao="Jogadores, rodada atual, histórico e ajustes serão apagados. Essa ação não pode ser desfeita."
                acao="Apagar tudo"
                destrutivo
                onConfirmar={() => {
                  apagarTudo()
                  toast('Tudo zerado. Começando do zero!')
                }}
              >
                <Button variant="outline" className="text-destructive hover:text-destructive sm:col-span-2">
                  <Trash2 /> Apagar todos os dados
                </Button>
              </Confirmar>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Regra({ titulo, texto, children }: { titulo: string; texto: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
        <p className="text-sm font-semibold">{titulo}</p>
        <p className="text-xs text-muted-foreground">{texto}</p>
      </div>
      {children}
    </div>
  )
}
