export type Posicao = 'GOL' | 'DEF' | 'MEI' | 'ATA'

export interface Jogador {
  id: string
  nome: string
  posicao: Posicao
  /** Nível técnico de 1 a 5, usado no sorteio equilibrado. */
  nivel: number
  presente: boolean
  /** Ordem de chegada (timestamp) para a lista de presença. */
  chegadaEm: number | null
  criadoEm: number
}

export type CorTime = 'verde' | 'azul' | 'amarelo' | 'vermelho' | 'roxo' | 'laranja' | 'branco' | 'preto'

export interface Time {
  id: string
  nome: string
  cor: CorTime
  jogadores: string[]
  capitaoId: string | null
}

export interface Gol {
  id: string
  timeId: string
  /** null = gol sem autor definido / gol contra. */
  jogadorId: string | null
  /** Segundo do cronômetro em que o gol saiu. */
  segundo: number
}

export interface Partida {
  id: string
  timeA: string
  timeB: string
  gols: Gol[]
  iniciadaEm: number
  encerradaEm: number | null
  duracaoSeg: number
  vencedor: string | null
}

export interface Cronometro {
  rodando: boolean
  /** Timestamp do último "play"; null quando pausado. */
  iniciadoEm: number | null
  /** Segundos acumulados antes do último "play". */
  acumulado: number
}

export type RegraEmpate = 'ambos-saem' | 'desafiante-sai' | 'quem-estava-sai'
export type ModoSorteio = 'equilibrado' | 'aleatorio'

export interface Configuracao {
  nomePelada: string
  local: string
  jogadoresPorTime: number
  duracaoMin: number
  /** 0 = sem limite de gols. */
  golsParaVencer: number
  /** 0 = sem limite de vitórias seguidas. */
  maxVitoriasSeguidas: number
  regraEmpate: RegraEmpate
  modoSorteio: ModoSorteio
  permitirTimeIncompleto: boolean
  separarGoleiros: boolean
  somAoFimDoTempo: boolean
}

export interface Rodada {
  id: string
  iniciadaEm: number
  times: Time[]
  fila: string[]
  partida: Partida | null
  historico: Partida[]
  /** Vitórias seguidas do time que está em campo. */
  sequencia: { timeId: string; vitorias: number } | null
}

export interface ResumoRodada {
  id: string
  data: number
  partidas: number
  gols: number
  artilheiro: { nome: string; gols: number } | null
  campeao: { nome: string; vitorias: number } | null
}

export interface EstadoApp {
  versao: 2
  atualizadoEm: number
  config: Configuracao
  jogadores: Jogador[]
  rodada: Rodada | null
  cronometro: Cronometro
  rodadasAnteriores: ResumoRodada[]
}
