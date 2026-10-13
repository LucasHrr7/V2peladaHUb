import { useApp } from '@/store/app'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Segmented } from '@/components/ui/segmented'
import { Stepper } from '@/components/ui/stepper'

export function OpcoesSorteio() {
  const config = useApp((s) => s.config)
  const atualizar = useApp((s) => s.atualizarConfig)
  return (
    <Card className="grid gap-5 p-5">
      <Linha titulo="Modo do sorteio" texto="Equilibrado usa o nível dos jogadores para montar times parelhos.">
        <Segmented
          aria-label="Modo do sorteio"
          valor={config.modoSorteio}
          onChange={(modoSorteio) => atualizar({ modoSorteio })}
          opcoes={[
            { valor: 'equilibrado', rotulo: 'Equilibrado' },
            { valor: 'aleatorio', rotulo: 'Aleatório' },
          ]}
        />
      </Linha>
      <Linha titulo="Jogadores por time" texto="Contando o goleiro.">
        <Stepper aria-label="Jogadores por time" valor={config.jogadoresPorTime} min={2} max={11} onChange={(jogadoresPorTime) => atualizar({ jogadoresPorTime })} />
      </Linha>
      <Linha titulo="Um goleiro por time" texto="Distribui quem está como goleiro antes dos demais.">
        <Switch checked={config.separarGoleiros} onCheckedChange={(separarGoleiros) => atualizar({ separarGoleiros })} />
      </Linha>
      <Linha titulo="Time com quem sobrar" texto="Se a conta não fechar, forma um time incompleto em vez de deixar gente de fora.">
        <Switch checked={config.permitirTimeIncompleto} onCheckedChange={(permitirTimeIncompleto) => atualizar({ permitirTimeIncompleto })} />
      </Linha>
    </Card>
  )
}

export function Linha({ titulo, texto, children }: { titulo: string; texto: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="grid min-w-0 flex-1 basis-56 gap-0.5">
        <p className="text-sm font-semibold">{titulo}</p>
        <p className="text-xs text-muted-foreground">{texto}</p>
      </div>
      {children}
    </div>
  )
}
