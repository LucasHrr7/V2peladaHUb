import type { Configuracao, CorTime, Jogador, Time } from './types'
import { uid } from './utils'

export const CORES: CorTime[] = ['verde', 'azul', 'amarelo', 'vermelho', 'roxo', 'laranja', 'branco', 'preto']

export const NOME_COR: Record<CorTime, string> = {
  verde: 'Verde',
  azul: 'Azul',
  amarelo: 'Amarelo',
  vermelho: 'Vermelho',
  roxo: 'Roxo',
  laranja: 'Laranja',
  branco: 'Branco',
  preto: 'Preto',
}

type Rng = () => number

function embaralhar<T>(lista: T[], rng: Rng): T[] {
  const a = [...lista]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface ResultadoSorteio {
  times: Time[]
  /** Jogadores presentes que ficaram de fora (chegaram por último e não fecham um time). */
  deFora: string[]
}

export interface Viabilidade {
  ok: boolean
  numTimes: number
  sobra: number
  motivo?: string
}

export function viabilidade(presentes: number, config: Configuracao): Viabilidade {
  const tamanho = config.jogadoresPorTime
  const completos = Math.floor(presentes / tamanho)
  const sobra = presentes % tamanho
  const numTimes = completos + (config.permitirTimeIncompleto && sobra > 0 ? 1 : 0)
  if (numTimes < 2) {
    const faltam = Math.max(0, (config.permitirTimeIncompleto ? tamanho + 1 : tamanho * 2) - presentes)
    return {
      ok: false,
      numTimes,
      sobra,
      motivo: `Faltam ${faltam} ${faltam === 1 ? 'jogador' : 'jogadores'} para formar 2 times de ${tamanho}.`,
    }
  }
  return { ok: true, numTimes, sobra: config.permitirTimeIncompleto ? 0 : sobra }
}

const forca = (ids: string[], mapa: Map<string, Jogador>) =>
  ids.reduce((soma, id) => soma + (mapa.get(id)?.nivel ?? 3), 0)

export function mediaNivel(time: Time, mapa: Map<string, Jogador>) {
  return time.jogadores.length ? forca(time.jogadores, mapa) / time.jogadores.length : 0
}

/**
 * Sorteia os times a partir dos jogadores presentes.
 * - Ordem de chegada define quem fica de fora quando a conta não fecha.
 * - Goleiros (se separados) vão um para cada time.
 * - No modo equilibrado, cada jogador vai para o time com menor força que ainda tem vaga.
 */
export function sortearTimes(presentes: Jogador[], config: Configuracao, rng: Rng = Math.random): ResultadoSorteio {
  const v = viabilidade(presentes.length, config)
  if (!v.ok) throw new Error(v.motivo)

  const porChegada = [...presentes].sort((a, b) => (a.chegadaEm ?? a.criadoEm) - (b.chegadaEm ?? b.criadoEm))
  const jogam = porChegada.slice(0, presentes.length - v.sobra)
  const deFora = porChegada.slice(presentes.length - v.sobra).map((j) => j.id)

  const tamanho = config.jogadoresPorTime
  const capacidades = Array.from({ length: v.numTimes }, (_, i) =>
    i < Math.floor(jogam.length / tamanho) ? tamanho : jogam.length % tamanho,
  )
  const mapa = new Map(jogam.map((j) => [j.id, j]))
  const slots: string[][] = capacidades.map(() => [])

  let restantes = embaralhar(jogam, rng)

  if (config.separarGoleiros) {
    const goleiros = restantes.filter((j) => j.posicao === 'GOL').sort((a, b) => b.nivel - a.nivel)
    const usados = new Set<string>()
    // Distribui um goleiro por time, priorizando os times completos.
    for (let t = 0; t < slots.length && t < goleiros.length; t++) {
      slots[t].push(goleiros[t].id)
      usados.add(goleiros[t].id)
    }
    restantes = restantes.filter((j) => !usados.has(j.id))
  }

  if (config.modoSorteio === 'equilibrado') {
    // Ordena por nível (embaralhamento prévio desempata) e aloca no time mais fraco com vaga.
    restantes.sort((a, b) => b.nivel - a.nivel)
    for (const jogador of restantes) {
      let melhor = -1
      for (let t = 0; t < slots.length; t++) {
        if (slots[t].length >= capacidades[t]) continue
        if (melhor === -1) {
          melhor = t
          continue
        }
        const mediaT = forca(slots[t], mapa) / capacidades[t]
        const mediaM = forca(slots[melhor], mapa) / capacidades[melhor]
        if (mediaT < mediaM || (mediaT === mediaM && slots[t].length < slots[melhor].length)) melhor = t
      }
      slots[melhor].push(jogador.id)
    }
  } else {
    let t = 0
    for (const jogador of restantes) {
      while (slots[t].length >= capacidades[t]) t = (t + 1) % slots.length
      slots[t].push(jogador.id)
      t = (t + 1) % slots.length
    }
  }

  const cores = embaralhar(CORES, rng)
  const times: Time[] = slots.map((ids, i) => {
    const capitao = [...ids].sort((a, b) => (mapa.get(b)?.nivel ?? 0) - (mapa.get(a)?.nivel ?? 0))[0] ?? null
    const cor = cores[i % cores.length]
    return { id: uid(), nome: `Time ${NOME_COR[cor]}`, cor, jogadores: ids, capitaoId: capitao }
  })

  return { times, deFora }
}
