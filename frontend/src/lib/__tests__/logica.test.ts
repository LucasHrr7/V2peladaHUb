import { describe, expect, it } from 'vitest'
import { sortearTimes, viabilidade } from '../sorteio'
import { encerrarPartida, iniciarRodada, tabelaTimes, artilharia } from '../rodada'
import { extrairNomesDeLista } from '../utils'
import type { Configuracao, Jogador, Rodada } from '../types'

const config: Configuracao = {
  nomePelada: 'Teste',
  local: '',
  jogadoresPorTime: 5,
  duracaoMin: 10,
  golsParaVencer: 2,
  maxVitoriasSeguidas: 0,
  regraEmpate: 'ambos-saem',
  modoSorteio: 'equilibrado',
  permitirTimeIncompleto: false,
  separarGoleiros: true,
  somAoFimDoTempo: false,
}

const jogador = (i: number, extra: Partial<Jogador> = {}): Jogador => ({
  id: `j${i}`,
  nome: `Jogador ${i}`,
  posicao: 'MEI',
  nivel: (i % 5) + 1,
  presente: true,
  chegadaEm: i,
  criadoEm: i,
  ...extra,
})

const rng = (() => {
  let s = 42
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
})

describe('sorteio', () => {
  it('exige ao menos dois times', () => {
    expect(viabilidade(9, config).ok).toBe(false)
    expect(viabilidade(10, config)).toMatchObject({ ok: true, numTimes: 2, sobra: 0 })
    expect(viabilidade(13, config)).toMatchObject({ ok: true, numTimes: 2, sobra: 3 })
    expect(viabilidade(13, { ...config, permitirTimeIncompleto: true })).toMatchObject({ ok: true, numTimes: 3, sobra: 0 })
  })

  it('deixa de fora os últimos a chegar', () => {
    const presentes = Array.from({ length: 12 }, (_, i) => jogador(i))
    const { times, deFora } = sortearTimes(presentes, config, rng())
    expect(times).toHaveLength(2)
    expect(deFora.sort()).toEqual(['j10', 'j11'])
    expect(times.every((t) => t.jogadores.length === 5)).toBe(true)
  })

  it('coloca um goleiro em cada time', () => {
    const presentes = Array.from({ length: 15 }, (_, i) => jogador(i, i < 3 ? { posicao: 'GOL' } : {}))
    const { times } = sortearTimes(presentes, config, rng())
    for (const t of times) expect(t.jogadores.filter((id) => Number(id.slice(1)) < 3)).toHaveLength(1)
  })

  it('equilibra o nível dos times', () => {
    const presentes = Array.from({ length: 20 }, (_, i) => jogador(i))
    const mapa = new Map(presentes.map((j) => [j.id, j]))
    const { times } = sortearTimes(presentes, { ...config, separarGoleiros: false }, rng())
    const somas = times.map((t) => t.jogadores.reduce((s, id) => s + mapa.get(id)!.nivel, 0))
    expect(Math.max(...somas) - Math.min(...somas)).toBeLessThanOrEqual(2)
  })

  it('forma time incompleto quando permitido', () => {
    const presentes = Array.from({ length: 13 }, (_, i) => jogador(i))
    const { times, deFora } = sortearTimes(presentes, { ...config, permitirTimeIncompleto: true }, rng())
    expect(times.map((t) => t.jogadores.length).sort()).toEqual([3, 5, 5])
    expect(deFora).toEqual([])
  })
})

function rodadaCom(n: number): Rodada {
  const times = Array.from({ length: n }, (_, i) => ({ id: `t${i}`, nome: `T${i}`, cor: 'azul' as const, jogadores: [], capitaoId: null }))
  return iniciarRodada(times, 0)
}

const comPlacar = (r: Rodada, a: number, b: number): Rodada => ({
  ...r,
  partida: {
    ...r.partida!,
    gols: [
      ...Array.from({ length: a }, (_, i) => ({ id: `a${i}`, timeId: r.partida!.timeA, jogadorId: 'j1', segundo: 0 })),
      ...Array.from({ length: b }, (_, i) => ({ id: `b${i}`, timeId: r.partida!.timeB, jogadorId: 'j2', segundo: 0 })),
    ],
  },
})

describe('rodada', () => {
  it('vencedor fica, perdedor vai para o fim da fila', () => {
    const { rodada } = encerrarPartida(comPlacar(rodadaCom(4), 2, 1), config, 600)
    expect(rodada.partida).toMatchObject({ timeA: 't0', timeB: 't2' })
    expect(rodada.fila).toEqual(['t3', 't1'])
    expect(rodada.sequencia).toEqual({ timeId: 't0', vitorias: 1 })
  })

  it('empate com "ambos saem" chama os dois próximos', () => {
    const { rodada } = encerrarPartida(comPlacar(rodadaCom(4), 1, 1), config, 600)
    expect(rodada.partida).toMatchObject({ timeA: 't2', timeB: 't3' })
    expect(rodada.fila).toEqual(['t0', 't1'])
  })

  it('empate com "sai quem entrou" mantém quem estava', () => {
    const { rodada } = encerrarPartida(comPlacar(rodadaCom(3), 0, 0), { ...config, regraEmpate: 'desafiante-sai' }, 600)
    expect(rodada.partida).toMatchObject({ timeA: 't0', timeB: 't2' })
  })

  it('limite de vitórias seguidas tira o vencedor', () => {
    const c = { ...config, maxVitoriasSeguidas: 2 }
    let r = encerrarPartida(comPlacar(rodadaCom(4), 2, 0), c, 1).rodada // t0 vence t1
    r = encerrarPartida(comPlacar(r, 2, 0), c, 1).rodada // t0 vence t2 (2ª seguida) e sai
    expect(r.partida).toMatchObject({ timeA: 't3', timeB: 't1' })
    expect(r.fila).toEqual(['t2', 't0'])
  })

  it('com dois times o perdedor volta logo', () => {
    const { rodada } = encerrarPartida(comPlacar(rodadaCom(2), 0, 2), config, 1)
    expect(rodada.partida).toMatchObject({ timeA: 't1', timeB: 't0' })
  })

  it('calcula tabela e artilharia', () => {
    const r = encerrarPartida(comPlacar(rodadaCom(3), 3, 1), config, 1).rodada
    expect(tabelaTimes(r)[0]).toMatchObject({ pontos: 3, vitorias: 1, golsPro: 3 })
    expect(artilharia(r.historico)).toEqual([
      { jogadorId: 'j1', gols: 3 },
      { jogadorId: 'j2', gols: 1 },
    ])
  })
})

describe('colar lista', () => {
  it('limpa números, emojis e duplicados', () => {
    expect(extrairNomesDeLista('Lista sábado ⚽\n1. João ✅\n2 - Pedro\n3)Ana Maria\n- João\n\n4.\n• Lucas')).toEqual([
      'João',
      'Pedro',
      'Ana Maria',
      'Lucas',
    ])
  })
})
