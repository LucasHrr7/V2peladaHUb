import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { iniciarSincronizacao } from './store/sync'
import './index.css'

void iniciarSincronizacao()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
