import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const iniciais = (nome: string) =>
  nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? nome

export const formatarTempo = (seg: number) => {
  const s = Math.max(0, Math.floor(seg))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

export const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/**
 * Extrai nomes de uma lista colada (ex.: lista do WhatsApp).
 * Aceita "1. João", "2 - Pedro ✅", "- Ana", linhas vazias e emojis.
 */
export function extrairNomesDeLista(texto: string): string[] {
  const vistos = new Set<string>()
  const nomes: string[] = []
  for (const linha of texto.split(/\r?\n/)) {
    const limpo = linha
      .replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '')
      .replace(/^\s*(\d+\s*[).:\-–]?|[-–•*])\s*/u, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!limpo || limpo.length > 40 || !/\p{L}/u.test(limpo) || /^lista\b/i.test(limpo)) continue
    const chave = normalizar(limpo)
    if (vistos.has(chave)) continue
    vistos.add(chave)
    nomes.push(limpo)
  }
  return nomes
}
