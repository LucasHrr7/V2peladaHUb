import type { Configuracao, Jogador, Partida, Rodada, ResumoRodada, Time } from './types'
import { uid } from './utils'

export function novaPartida(timeA: string, timeB: string, agora = Date.now()): Partida {
  return { id: uid(), timeA, timeB, gols: [], iniciadaEm: agora, encerradaEm: null, duracaoSeg: 0, vencedor: null }
}

export function iniciarRodada(times: Time[], agora = Date.now()): Rodada {
  return {
    id: uid(),
    iniciadaEm: agora,
    times,
    fila: times.slice(2).map((t) => t.id),
    partida: times.length >= 2 ? novaPartida(times[0].id, times[1].id, agora) : null,
    historico: [],
    sequencia: null,
  }
}

export const placar = (p: Partida) => ({
  a: p.gols.filter((g) => g.timeId === p.timeA).length,
  b: p.gols.filter((g) => g.timeId === p.timeB).length,
})

export interface DesfechoPartida {
  rodada: Rodada
  mensagem: string
}

/**
 * Encerra a partida atual aplicando as regras da pelada:
 * - vitória: vencedor fica (até o limite de vitórias seguidas), perdedor vai para o fim da fila;
 * - empate: conforme a regra configurada.
 */
export function encerrarPartida(rodada: Rodada, config: Configuracao, duracaoSeg: number, agora = Date.now()): DesfechoPartida {
  const p = rodada.partida
  if (!p) return { rodada, mensagem: '' }
  const nome = (id: string) => rodada.times.find((t) => t.id === id)?.nome ?? 'Time'
  const { a, b } = placar(p)
  const vencedor = a === b ? null : a > b ? p.timeA : p.timeB
  const encerrada: Partida = { ...p, encerradaEm: agora, duracaoSeg, vencedor }
  const fila = [...rodada.fila]
  let sequencia = rodada.sequencia
  let emCampo: string | null = null
  let mensagem: string

  if (vencedor) {
    const perdedor = vencedor === p.timeA ? p.timeB : p.timeA
    const vitorias = sequencia?.timeId === vencedor ? sequencia.vitorias + 1 : 1
    fila.push(perdedor)
    if (config.maxVitoriasSeguidas > 0 && vitorias >= config.maxVitoriasSeguidas && fila.length > 1) {
      fila.push(vencedor)
      sequencia = null
      mensagem = `${nome(vencedor)} atingiu ${vitorias} vitórias seguidas e saiu para descansar.`
    } else {
      emCampo = vencedor
      sequencia = { timeId: vencedor, vitorias }
      mensagem = `${nome(vencedor)} venceu e continua em campo!`
    }
  } else if (config.regraEmpate === 'ambos-saem') {
    fila.push(p.timeA, p.timeB)
    sequencia = null
    mensagem = 'Empate: os dois times foram para o fim da fila.'
  } else {
    // Por convenção o time A é quem já estava em campo.
    const sai = config.regraEmpate === 'quem-estava-sai' ? p.timeA : p.timeB
    emCampo = sai === p.timeA ? p.timeB : p.timeA
    fila.push(sai)
    const vit = sequencia?.timeId === emCampo ? sequencia.vitorias : 0
    sequencia = vit ? { timeId: emCampo, vitorias: vit } : null
    mensagem = `Empate: ${nome(sai)} saiu e ${nome(emCampo)} continua.`
  }

  const timeA = emCampo ?? fila.shift() ?? null
  const timeB = fila.shift() ?? null
  return {
    mensagem,
    rodada: {
      ...rodada,
      fila,
      sequencia,
      historico: [...rodada.historico, encerrada],
      partida: timeA && timeB ? novaPartida(timeA, timeB, agora) : null,
    },
  }
}

export interface LinhaTabela {
  time: Time
  jogos: number
  vitorias: number
  empates: number
  derrotas: number
  golsPro: number
  golsContra: number
  pontos: number
}

export function tabelaTimes(rodada: Rodada): LinhaTabela[] {
  const linhas = new Map<string, LinhaTabela>(
    rodada.times.map((time) => [
      time.id,
      { time, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, golsPro: 0, golsContra: 0, pontos: 0 },
    ]),
  )
  for (const p of rodada.historico) {
    const { a, b } = placar(p)
    const la = linhas.get(p.timeA)
    const lb = linhas.get(p.timeB)
    if (!la || !lb) continue
    la.jogos++
    lb.jogos++
    la.golsPro += a
    la.golsContra += b
    lb.golsPro += b
    lb.golsContra += a
    if (a === b) {
      la.empates++
      lb.empates++
    } else if (a > b) {
      la.vitorias++
      lb.derrotas++
    } else {
      lb.vitorias++
      la.derrotas++
    }
  }
  return [...linhas.values()]
    .map((l) => ({ ...l, pontos: l.vitorias * 3 + l.empates }))
    .sort(
      (x, y) =>
        y.pontos - x.pontos ||
        y.vitorias - x.vitorias ||
        y.golsPro - y.golsContra - (x.golsPro - x.golsContra) ||
        y.golsPro - x.golsPro,
    )
}

export interface LinhaArtilharia {
  jogadorId: string
  gols: number
}

export function artilharia(partidas: Partida[]): LinhaArtilharia[] {
  const contagem = new Map<string, number>()
  for (const p of partidas)
    for (const g of p.gols) if (g.jogadorId) contagem.set(g.jogadorId, (contagem.get(g.jogadorId) ?? 0) + 1)
  return [...contagem.entries()].map(([jogadorId, gols]) => ({ jogadorId, gols })).sort((a, b) => b.gols - a.gols)
}

export function partidasDaRodada(rodada: Rodada | null): Partida[] {
  if (!rodada) return []
  return rodada.partida ? [...rodada.historico, rodada.partida] : rodada.historico
}

export function resumirRodada(rodada: Rodada, jogadores: Jogador[]): ResumoRodada {
  const art = artilharia(rodada.historico)[0]
  const top = tabelaTimes(rodada)[0]
  const jogador = art && jogadores.find((j) => j.id === art.jogadorId)
  return {
    id: rodada.id,
    data: rodada.iniciadaEm,
    partidas: rodada.historico.length,
    gols: rodada.historico.reduce((s, p) => s + p.gols.length, 0),
    artilheiro: jogador ? { nome: jogador.nome, gols: art.gols } : null,
    campeao: top && top.vitorias > 0 ? { nome: top.time.nome, vitorias: top.vitorias } : null,
  }
}

/** Texto pronto para compartilhar os times no WhatsApp. */
export function textoTimes(rodada: Rodada, jogadores: Jogador[], config: Configuracao): string {
  const nome = (id: string) => jogadores.find((j) => j.id === id)?.nome ?? '?'
  const cabecalho = [`⚽ *${config.nomePelada || 'Pelada'}*`, config.local && `📍 ${config.local}`].filter(Boolean).join('\n')
  const ordem = rodada.partida ? [rodada.partida.timeA, rodada.partida.timeB, ...rodada.fila] : rodada.fila
  const blocos = ordem
    .map((id, i) => rodada.times.find((t) => t.id === id) && { time: rodada.times.find((t) => t.id === id)!, i })
    .filter(Boolean)
    .map((x) => {
      const { time, i } = x as { time: Time; i: number }
      const lista = time.jogadores
        .map((id) => `• ${nome(id)}${id === time.capitaoId ? ' (C)' : ''}${jogadores.find((j) => j.id === id)?.posicao === 'GOL' ? ' 🧤' : ''}`)
        .join('\n')
      return `*${i + 1}. ${time.nome}*${i < 2 && rodada.partida ? ' — em campo' : ''}\n${lista}`
    })
  return `${cabecalho}\n\n${blocos.join('\n\n')}\n\n_Sorteado no PeladaHub_`
}
