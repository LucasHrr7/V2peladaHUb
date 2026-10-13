import { useState } from 'react'
import { KeyRound, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { conectarComPin, desconectar, useSync } from '@/store/sync'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const MENSAGENS = {
  'pin-invalido': 'PIN incorreto.',
  bloqueado: 'Muitas tentativas erradas. Aguarde alguns minutos.',
  offline: 'Servidor indisponível. Os dados continuam salvos neste aparelho.',
} as const

/** Conexão com o servidor: só quem tem o PIN do organizador lê e grava a rodada. */
export function CardServidor() {
  const status = useSync((s) => s.status)
  const [pin, setPin] = useState('')
  const [enviando, setEnviando] = useState(false)
  const conectado = status === 'salvo' || status === 'salvando'

  const conectar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    const r = await conectarComPin(pin)
    setEnviando(false)
    if (r === 'ok') {
      setPin('')
      toast.success('Conectado! A rodada agora é salva no servidor.')
    } else toast.error(MENSAGENS[r])
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Servidor</CardTitle>
          <CardDescription>
            {conectado
              ? 'Conectado como organizador. Tudo é salvo no servidor automaticamente.'
              : 'Informe o PIN do organizador (variável PELADAHUB_PIN do servidor) para salvar e abrir a rodada em outros aparelhos.'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {conectado ? (
          <Button variant="outline" onClick={desconectar}>
            <LogOut /> Desconectar deste aparelho
          </Button>
        ) : (
          <form onSubmit={conectar} className="flex gap-2">
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN do organizador"
              aria-label="PIN do organizador"
            />
            <Button type="submit" disabled={!pin.trim() || enviando}>
              <KeyRound /> Conectar
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
