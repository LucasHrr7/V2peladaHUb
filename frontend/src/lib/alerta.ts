/** Apito curto via Web Audio + vibração, para avisar o fim do tempo. */
export function apitar() {
  try {
    navigator.vibrate?.([300, 120, 300, 120, 600])
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const tocar = (inicio: number, duracao: number) => {
      const osc = ctx.createOscillator()
      const ganho = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = 2800
      ganho.gain.setValueAtTime(0.0001, ctx.currentTime + inicio)
      ganho.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + inicio + 0.02)
      ganho.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + inicio + duracao)
      osc.connect(ganho).connect(ctx.destination)
      osc.start(ctx.currentTime + inicio)
      osc.stop(ctx.currentTime + inicio + duracao + 0.05)
    }
    tocar(0, 0.25)
    tocar(0.35, 0.25)
    tocar(0.7, 0.8)
    setTimeout(() => void ctx.close(), 2000)
  } catch {
    /* navegador sem áudio */
  }
}

/** Compartilha texto pelo menu nativo (celular) ou copia para a área de transferência. */
export async function compartilharTexto(texto: string): Promise<'compartilhado' | 'copiado' | 'falhou'> {
  try {
    if (navigator.share) {
      await navigator.share({ text: texto })
      return 'compartilhado'
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return 'falhou'
  }
  try {
    await navigator.clipboard.writeText(texto)
    return 'copiado'
  } catch {
    return 'falhou'
  }
}
