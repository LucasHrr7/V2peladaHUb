import { createHashRouter, RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { Layout } from '@/components/layout'
import { PaginaPartida } from '@/pages/partida'
import { PaginaJogadores } from '@/pages/jogadores'
import { PaginaTimes } from '@/pages/times'
import { PaginaEstatisticas } from '@/pages/estatisticas'
import { PaginaAjustes } from '@/pages/ajustes'
import { temaEscuro, useTema } from '@/hooks/use-tema'

// Hash router: o WebServer Java só serve arquivos estáticos, então não há fallback de rotas no servidor.
const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <PaginaPartida /> },
      { path: 'jogadores', element: <PaginaJogadores /> },
      { path: 'times', element: <PaginaTimes /> },
      { path: 'estatisticas', element: <PaginaEstatisticas /> },
      { path: 'ajustes', element: <PaginaAjustes /> },
      { path: '*', element: <PaginaPartida /> },
    ],
  },
])

export function App() {
  const tema = useTema((s) => s.tema)
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-center" theme={temaEscuro(tema) ? 'dark' : 'light'} closeButton />
    </>
  )
}
