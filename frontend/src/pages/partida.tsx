import { useApp } from '@/store/app'
import { ComoComecar } from '@/features/partida/como-comecar'
import { RodadaSemPartida } from '@/features/partida/rodada-sem-partida'
import { PartidaAoVivo } from '@/features/partida/partida-ao-vivo'

export function PaginaPartida() {
  const rodada = useApp((s) => s.rodada)
  if (!rodada) return <ComoComecar />
  if (!rodada.partida) return <RodadaSemPartida />
  return <PartidaAoVivo />
}
