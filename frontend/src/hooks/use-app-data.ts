import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp, segundosDecorridos } from '@/store/app'
import type { Jogador, Time } from '@/lib/types'

export function useMapaJogadores() {
  const jogadores = useApp((s) => s.jogadores)
  return useMemo(() => new Map<string, Jogador>(jogadores.map((j) => [j.id, j])), [jogadores])
}

export function useMapaTimes() {
  const times = useApp((s) => s.rodada?.times)
  return useMemo(() => new Map<string, Time>((times ?? []).map((t) => [t.id, t])), [times])
}

/** Segundos do cronômetro, atualizados enquanto ele está rodando. */
export function useTempoDecorrido() {
  const cronometro = useApp((s) => s.cronometro)
  const [, forcar] = useState(0)
  useEffect(() => {
    if (!cronometro.rodando) return
    const id = setInterval(() => forcar((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [cronometro.rodando])
  return segundosDecorridos(cronometro)
}

/** Dispara `aoAcabar` uma vez quando o tempo regulamentar termina. */
export function useFimDeTempo(decorrido: number, limiteSeg: number, ativo: boolean, aoAcabar: () => void) {
  const disparou = useRef(false)
  useEffect(() => {
    if (decorrido < limiteSeg) disparou.current = false
    else if (ativo && !disparou.current && limiteSeg > 0) {
      disparou.current = true
      aoAcabar()
    }
  }, [decorrido, limiteSeg, ativo, aoAcabar])
}
