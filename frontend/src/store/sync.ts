import { create } from 'zustand'
import type { EstadoApp } from '@/lib/types'
import { extrairNomesDeLista } from '@/lib/utils'
import { extrairEstado, useApp } from './app'

export type StatusSync = 'iniciando' | 'salvando' | 'salvo' | 'offline' | 'sem-pin'
export type ResultadoConexao = 'ok' | 'pin-invalido' | 'bloqueado' | 'offline'

const CHAVE_PIN = 'peladahub-pin'

function lerPin() {
  try {
    return localStorage.getItem(CHAVE_PIN) ?? ''
  } catch {
    return ''
  }
}

export const useSync = create<{ status: StatusSync; ultimoSalvo: number | null }>(() => ({
  status: 'iniciando',
  ultimoSalvo: null,
}))

const ENDPOINT = '/api/state'
let pin = lerPin()
let timer: ReturnType<typeof setTimeout> | undefined
let ultimoEnviado = 0

const cabecalhos = (extra: Record<string, string> = {}) => ({ ...extra, 'X-PeladaHub-Pin': pin })

class ErroHttp extends Error {
  constructor(readonly status: number) {
    super(String(status))
  }
}

function tratarErro(e: unknown): ResultadoConexao {
  if (e instanceof ErroHttp && e.status === 401) {
    useSync.setState({ status: 'sem-pin' })
    return 'pin-invalido'
  }
  if (e instanceof ErroHttp && e.status === 429) {
    useSync.setState({ status: 'sem-pin' })
    return 'bloqueado'
  }
  useSync.setState({ status: 'offline' })
  return 'offline'
}

async function enviar() {
  if (!pin) return
  const estado = extrairEstado(useApp.getState())
  if (estado.atualizadoEm <= ultimoEnviado) return
  useSync.setState({ status: 'salvando' })
  try {
    const r = await fetch(ENDPOINT, {
      method: 'PUT',
      headers: cabecalhos({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(estado),
    })
    if (!r.ok) throw new ErroHttp(r.status)
    ultimoEnviado = estado.atualizadoEm
    useSync.setState({ status: 'salvo', ultimoSalvo: Date.now() })
  } catch (e) {
    tratarErro(e)
  }
}

function ehEstadoValido(x: unknown): x is EstadoApp {
  return !!x && typeof x === 'object' && (x as EstadoApp).versao === 2 && Array.isArray((x as EstadoApp).jogadores)
}

/** Busca o estado do servidor; usa o remoto se for mais recente que o local. */
async function puxar(): Promise<ResultadoConexao> {
  if (!pin) {
    useSync.setState({ status: 'sem-pin' })
    return 'pin-invalido'
  }
  try {
    const r = await fetch(ENDPOINT, { headers: cabecalhos({ Accept: 'application/json' }) })
    if (!r.ok) throw new ErroHttp(r.status)
    const remoto: unknown = await r.json()
    if (ehEstadoValido(remoto) && remoto.atualizadoEm > useApp.getState().atualizadoEm) {
      useApp.getState().substituirEstado(remoto)
    }
    ultimoEnviado = Math.max(ultimoEnviado, ehEstadoValido(remoto) ? remoto.atualizadoEm : 0)
    useSync.setState({ status: 'salvo', ultimoSalvo: Date.now() })
    void enviar()
    return 'ok'
  } catch (e) {
    return tratarErro(e)
  }
}

/** Salva o PIN do organizador e tenta sincronizar com o servidor. */
export async function conectarComPin(novoPin: string): Promise<ResultadoConexao> {
  pin = novoPin.trim()
  const resultado = await puxar()
  try {
    if (resultado === 'ok') localStorage.setItem(CHAVE_PIN, pin)
    else if (resultado === 'pin-invalido') localStorage.removeItem(CHAVE_PIN)
  } catch {
    /* sem storage */
  }
  return resultado
}

export function desconectar() {
  pin = ''
  try {
    localStorage.removeItem(CHAVE_PIN)
  } catch {
    /* sem storage */
  }
  useSync.setState({ status: 'sem-pin' })
}

/** Importa a lista de jogadores salva pela versão antiga do front (somente nomes). */
function migrarVersaoAntiga() {
  try {
    const antigo = localStorage.getItem('peladahub_state')
    if (!antigo || useApp.getState().jogadores.length) return
    const dados = JSON.parse(antigo) as { jogadores?: unknown }
    if (Array.isArray(dados.jogadores)) {
      const nomes = extrairNomesDeLista(dados.jogadores.filter((x) => typeof x === 'string').join('\n'))
      if (nomes.length) useApp.getState().adicionarVarios(nomes, true)
    }
    localStorage.removeItem('peladahub_state')
  } catch {
    /* estado antigo inválido: ignora */
  }
}

/**
 * Sincroniza o estado com o backend Java (`/api/state`), protegido pelo PIN do organizador.
 * O app funciona 100% offline com localStorage; o servidor guarda a cópia mais recente.
 */
export async function iniciarSincronizacao() {
  migrarVersaoAntiga()
  await puxar()

  useApp.subscribe((s, anterior) => {
    if (s.atualizadoEm === anterior.atualizadoEm) return
    clearTimeout(timer)
    timer = setTimeout(enviar, 600)
  })
  window.addEventListener('online', () => void enviar())
}
