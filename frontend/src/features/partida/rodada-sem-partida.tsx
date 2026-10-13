import { Link } from 'react-router'
import { Trophy } from 'lucide-react'
import { useApp } from '@/store/app'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function RodadaSemPartida() {
  const finalizar = useApp((s) => s.finalizarRodada)
  return (
    <div className="grid gap-4">
      <Card className="p-8 text-center">
        <Trophy className="mx-auto mb-3 size-10 text-amber-500" />
        <h2 className="text-2xl font-bold">Rodada sem próxima partida</h2>
        <p className="mt-1 text-muted-foreground">Não há times suficientes na fila. Finalize a rodada ou sorteie de novo.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/times">Ver times</Link>
          </Button>
          <Button onClick={finalizar}>Finalizar rodada</Button>
        </div>
      </Card>
    </div>
  )
}
