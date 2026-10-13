import type { CorTime } from './types'

/** Classes de cor de cada time (camisa, fundo suave e texto). */
export const ESTILO_COR: Record<CorTime, { camisa: string; suave: string; texto: string; borda: string }> = {
  verde: { camisa: 'bg-emerald-500 text-white', suave: 'bg-emerald-500/10', texto: 'text-emerald-600 dark:text-emerald-400', borda: 'border-emerald-500/40' },
  azul: { camisa: 'bg-blue-500 text-white', suave: 'bg-blue-500/10', texto: 'text-blue-600 dark:text-blue-400', borda: 'border-blue-500/40' },
  amarelo: { camisa: 'bg-yellow-400 text-neutral-900', suave: 'bg-yellow-400/15', texto: 'text-yellow-700 dark:text-yellow-300', borda: 'border-yellow-400/50' },
  vermelho: { camisa: 'bg-red-500 text-white', suave: 'bg-red-500/10', texto: 'text-red-600 dark:text-red-400', borda: 'border-red-500/40' },
  roxo: { camisa: 'bg-violet-500 text-white', suave: 'bg-violet-500/10', texto: 'text-violet-600 dark:text-violet-400', borda: 'border-violet-500/40' },
  laranja: { camisa: 'bg-orange-500 text-white', suave: 'bg-orange-500/10', texto: 'text-orange-600 dark:text-orange-400', borda: 'border-orange-500/40' },
  branco: { camisa: 'bg-white text-neutral-900 ring-1 ring-neutral-300', suave: 'bg-neutral-500/8', texto: 'text-neutral-600 dark:text-neutral-300', borda: 'border-neutral-300 dark:border-neutral-600' },
  preto: { camisa: 'bg-neutral-900 text-white ring-1 ring-neutral-700', suave: 'bg-neutral-900/8 dark:bg-white/8', texto: 'text-neutral-800 dark:text-neutral-200', borda: 'border-neutral-700/50' },
}
