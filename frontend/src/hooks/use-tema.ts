import { create } from 'zustand'

export type Tema = 'claro' | 'escuro' | 'sistema'
const CHAVE = 'peladahub-tema'
const mq = () => matchMedia('(prefers-color-scheme: dark)')

export const temaEscuro = (tema: Tema) => tema === 'escuro' || (tema === 'sistema' && mq().matches)

function aplicar(tema: Tema) {
  const escuro = temaEscuro(tema)
  document.documentElement.classList.toggle('dark', escuro)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', escuro ? '#0b1210' : '#059669')
}

function lerTema(): Tema {
  try {
    return (localStorage.getItem(CHAVE) as Tema) || 'sistema'
  } catch {
    return 'sistema'
  }
}

export const useTema = create<{ tema: Tema; setTema: (t: Tema) => void }>((set) => ({
  tema: lerTema(),
  setTema: (tema) => {
    try {
      localStorage.setItem(CHAVE, tema)
    } catch {
      /* sem storage */
    }
    aplicar(tema)
    set({ tema })
  },
}))

mq().addEventListener('change', () => {
  const { tema } = useTema.getState()
  if (tema === 'sistema') {
    aplicar(tema)
    useTema.setState({ tema })
  }
})
