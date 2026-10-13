import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Configuracao, EstadoApp, Jogador, Posicao } from '@/lib/types'
import { encerrarPartida, iniciarRodada, resumirRodada } from '@/lib/rodada'
import { sortearTimes } from '@/lib/sorteio'
import { normalizar, uid } from '@/lib/utils'

export const CONFIG_PADRAO: Configuracao = {
  nomePelada: 'Pelada da semana',
  local: '',
  jogadoresPorTime: 6,
  duracaoMin: 10,
  golsParaVencer: 2,
  maxVitoriasSeguidas: 0,
  regraEmpate: 'ambos-saem',
  modoSorteio: 'equilibrado',
  permitirTimeIncompleto: false,
  separarGoleiros: true,
  somAoFimDoTempo: true,
}

export const estadoInicial = (): EstadoApp => ({
  versao: 2,
  atualizadoEm: 0,
  config: CONFIG_PADRAO,
  jogadores: [],
  rodada: null,
  cronometro: { rodando: false, iniciadoEm: null, acumulado: 0 },
  rodadasAnteriores: [],
})

export const segundosDecorridos = (c: EstadoApp['cronometro'], agora = Date.now()) =>
  c.acumulado + (c.rodando && c.iniciadoEm ? (agora - c.iniciadoEm) / 1000 : 0)

type NovoJogador = { nome: string; posicao?: Posicao; nivel?: number; presente?: boolean }

interface Acoes {
  adicionarJogador: (j: NovoJogador) => { ok: boolean; motivo?: string }
  adicionarVarios: (nomes: string[], presente: boolean) => number
  editarJogador: (id: string, patch: Partial<Omit<Jogador, 'id'>>) => void
  removerJogador: (id: string) => void
  alternarPresenca: (id: string) => void
  definirPresencaTodos: (presente: boolean) => void

  sortear: () => { ok: boolean; mensagem: string; deFora?: string[] }
  moverJogador: (jogadorId: string, paraTimeId: string | null) => void
  renomearTime: (timeId: string, nome: string) => void
  definirCapitao: (timeId: string, jogadorId: string) => void
  moverNaFila: (timeId: string, direcao: -1 | 1) => void

  marcarGol: (timeId: string, jogadorId: string | null) => void
  desfazerGol: () => void
  alternarCronometro: () => void
  zerarCronometro: () => void
  encerrarPartida: () => string
  finalizarRodada: () => void

  atualizarConfig: (patch: Partial<Configuracao>) => void
  substituirEstado: (estado: EstadoApp) => void
  apagarTudo: () => void
}

export type Store = EstadoApp & Acoes

const tocar = (): Pick<EstadoApp, 'atualizadoEm'> => ({ atualizadoEm: Date.now() })
const cronometroZerado = { rodando: false, iniciadoEm: null, acumulado: 0 }

export const useApp = create<Store>()(
  persist(
    (set, get) => ({
      ...estadoInicial(),

      adicionarJogador: ({ nome, posicao = 'MEI', nivel = 3, presente = true }) => {
        const limpo = nome.trim().replace(/\s+/g, ' ')
        if (!limpo) return { ok: false, motivo: 'Informe o nome.' }
        if (get().jogadores.some((j) => normalizar(j.nome) === normalizar(limpo)))
          return { ok: false, motivo: 'Já existe um jogador com esse nome.' }
        const agora = Date.now()
        set((s) => ({
          ...tocar(),
          jogadores: [
            ...s.jogadores,
            { id: uid(), nome: limpo, posicao, nivel, presente, chegadaEm: presente ? agora : null, criadoEm: agora },
          ],
        }))
        return { ok: true }
      },

      adicionarVarios: (nomes, presente) => {
        const existentes = new Map(get().jogadores.map((j) => [normalizar(j.nome), j]))
        const agora = Date.now()
        const novos: Jogador[] = []
        const marcar = new Set<string>()
        nomes.forEach((nome, i) => {
          const atual = existentes.get(normalizar(nome))
          if (atual) {
            if (presente && !atual.presente) marcar.add(atual.id)
            return
          }
          const j: Jogador = {
            id: uid(),
            nome,
            posicao: /\b(gol|goleiro)\b/i.test(nome) ? 'GOL' : 'MEI',
            nivel: 3,
            presente,
            chegadaEm: presente ? agora + i : null,
            criadoEm: agora + i,
          }
          existentes.set(normalizar(nome), j)
          novos.push(j)
        })
        set((s) => ({
          ...tocar(),
          jogadores: [
            ...s.jogadores.map((j, i) => (marcar.has(j.id) ? { ...j, presente: true, chegadaEm: agora + nomes.length + i } : j)),
            ...novos,
          ],
        }))
        return novos.length + marcar.size
      },

      editarJogador: (id, patch) =>
        set((s) => ({ ...tocar(), jogadores: s.jogadores.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),

      removerJogador: (id) =>
        set((s) => ({
          ...tocar(),
          jogadores: s.jogadores.filter((j) => j.id !== id),
          rodada: s.rodada && {
            ...s.rodada,
            times: s.rodada.times.map((t) => ({
              ...t,
              jogadores: t.jogadores.filter((x) => x !== id),
              capitaoId: t.capitaoId === id ? (t.jogadores.find((x) => x !== id) ?? null) : t.capitaoId,
            })),
          },
        })),

      alternarPresenca: (id) =>
        set((s) => ({
          ...tocar(),
          jogadores: s.jogadores.map((j) =>
            j.id === id ? { ...j, presente: !j.presente, chegadaEm: j.presente ? null : Date.now() } : j,
          ),
        })),

      definirPresencaTodos: (presente) => {
        const agora = Date.now()
        set((s) => ({
          ...tocar(),
          jogadores: s.jogadores.map((j, i) => ({
            ...j,
            presente,
            chegadaEm: presente ? (j.presente ? j.chegadaEm : agora + i) : null,
          })),
        }))
      },

      sortear: () => {
        const { jogadores, config, rodada } = get()
        try {
          const { times, deFora } = sortearTimes(
            jogadores.filter((j) => j.presente),
            config,
          )
          const anteriores =
            rodada && rodada.historico.length
              ? [resumirRodada(rodada, jogadores), ...get().rodadasAnteriores]
              : get().rodadasAnteriores
          set({ ...tocar(), rodada: iniciarRodada(times), cronometro: cronometroZerado, rodadasAnteriores: anteriores })
          return {
            ok: true,
            deFora,
            mensagem: `${times.length} times sorteados. ${times[0].nome} × ${times[1].nome} abrem a rodada!`,
          }
        } catch (e) {
          return { ok: false, mensagem: (e as Error).message }
        }
      },

      moverJogador: (jogadorId, paraTimeId) =>
        set((s) => {
          if (!s.rodada) return s
          return {
            ...tocar(),
            rodada: {
              ...s.rodada,
              times: s.rodada.times.map((t) => {
                const sem = t.jogadores.filter((x) => x !== jogadorId)
                const jogadoresT = t.id === paraTimeId ? [...sem, jogadorId] : sem
                const capitaoId =
                  t.capitaoId === jogadorId && t.id !== paraTimeId ? (sem[0] ?? null) : (t.capitaoId ?? jogadoresT[0] ?? null)
                return { ...t, jogadores: jogadoresT, capitaoId }
              }),
            },
          }
        }),

      renomearTime: (timeId, nome) =>
        set((s) =>
          s.rodada
            ? {
                ...tocar(),
                rodada: {
                  ...s.rodada,
                  times: s.rodada.times.map((t) => (t.id === timeId ? { ...t, nome: nome.trim() || t.nome } : t)),
                },
              }
            : s,
        ),

      definirCapitao: (timeId, jogadorId) =>
        set((s) =>
          s.rodada
            ? {
                ...tocar(),
                rodada: {
                  ...s.rodada,
                  times: s.rodada.times.map((t) => (t.id === timeId ? { ...t, capitaoId: jogadorId } : t)),
                },
              }
            : s,
        ),

      moverNaFila: (timeId, direcao) =>
        set((s) => {
          if (!s.rodada) return s
          const fila = [...s.rodada.fila]
          const i = fila.indexOf(timeId)
          const j = i + direcao
          if (i < 0 || j < 0 || j >= fila.length) return s
          ;[fila[i], fila[j]] = [fila[j], fila[i]]
          return { ...tocar(), rodada: { ...s.rodada, fila } }
        }),

      marcarGol: (timeId, jogadorId) =>
        set((s) => {
          const p = s.rodada?.partida
          if (!s.rodada || !p) return s
          const gol = { id: uid(), timeId, jogadorId, segundo: Math.floor(segundosDecorridos(s.cronometro)) }
          return { ...tocar(), rodada: { ...s.rodada, partida: { ...p, gols: [...p.gols, gol] } } }
        }),

      desfazerGol: () =>
        set((s) => {
          const p = s.rodada?.partida
          if (!s.rodada || !p || !p.gols.length) return s
          return { ...tocar(), rodada: { ...s.rodada, partida: { ...p, gols: p.gols.slice(0, -1) } } }
        }),

      alternarCronometro: () =>
        set((s) => {
          const c = s.cronometro
          const agora = Date.now()
          return {
            ...tocar(),
            cronometro: c.rodando
              ? { rodando: false, iniciadoEm: null, acumulado: segundosDecorridos(c, agora) }
              : { rodando: true, iniciadoEm: agora, acumulado: c.acumulado },
          }
        }),

      zerarCronometro: () => set({ ...tocar(), cronometro: cronometroZerado }),

      encerrarPartida: () => {
        const { rodada, config, cronometro } = get()
        if (!rodada?.partida) return ''
        const { rodada: nova, mensagem } = encerrarPartida(rodada, config, Math.round(segundosDecorridos(cronometro)))
        set({ ...tocar(), rodada: nova, cronometro: cronometroZerado })
        return mensagem
      },

      finalizarRodada: () => {
        const { rodada, jogadores, rodadasAnteriores } = get()
        if (!rodada) return
        // A partida em andamento só conta se já tiver gols.
        const historico =
          rodada.partida && rodada.partida.gols.length
            ? [...rodada.historico, { ...rodada.partida, encerradaEm: Date.now() }]
            : rodada.historico
        const fechada = { ...rodada, historico, partida: null }
        set({
          ...tocar(),
          rodada: null,
          cronometro: cronometroZerado,
          rodadasAnteriores: historico.length ? [resumirRodada(fechada, jogadores), ...rodadasAnteriores] : rodadasAnteriores,
        })
      },

      atualizarConfig: (patch) => set((s) => ({ ...tocar(), config: { ...s.config, ...patch } })),

      substituirEstado: (estado) => set({ ...estadoInicial(), ...estado, config: { ...CONFIG_PADRAO, ...estado.config } }),

      apagarTudo: () => set({ ...estadoInicial(), atualizadoEm: Date.now() }),
    }),
    {
      name: 'peladahub-v2',
      version: 2,
      partialize: (s) => extrairEstado(s),
      merge: (persistido, atual) => {
        const p = persistido as Partial<EstadoApp> | undefined
        return { ...atual, ...p, config: { ...CONFIG_PADRAO, ...(p?.config ?? {}) } }
      },
    },
  ),
)

export function extrairEstado(s: EstadoApp): EstadoApp {
  return {
    versao: 2,
    atualizadoEm: s.atualizadoEm,
    config: s.config,
    jogadores: s.jogadores,
    rodada: s.rodada,
    cronometro: s.cronometro,
    rodadasAnteriores: s.rodadasAnteriores,
  }
}
