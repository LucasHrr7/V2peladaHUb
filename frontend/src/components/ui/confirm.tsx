import { AlertDialog } from 'radix-ui'
import type { ReactNode } from 'react'
import { Button } from './button'

/** Diálogo de confirmação acessível, no lugar do window.confirm. */
export function Confirmar({
  titulo,
  descricao,
  acao,
  destrutivo,
  onConfirmar,
  children,
}: {
  titulo: string
  descricao?: ReactNode
  acao: string
  destrutivo?: boolean
  onConfirmar: () => void
  children: ReactNode
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{children}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border bg-card p-6 shadow-2xl data-[state=open]:animate-[pop-in_160ms_ease-out]">
          <div className="grid gap-1.5">
            <AlertDialog.Title className="font-display text-lg font-bold">{titulo}</AlertDialog.Title>
            {descricao && (
              <AlertDialog.Description className="text-sm text-muted-foreground">{descricao}</AlertDialog.Description>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Cancelar</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant={destrutivo ? 'destructive' : 'default'} onClick={onConfirmar}>
                {acao}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
