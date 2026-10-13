import { ToggleGroup } from 'radix-ui'
import { cn } from '@/lib/utils'

interface Opcao<T extends string> {
  valor: T
  rotulo: React.ReactNode
}

/** Controle segmentado (estilo iOS) para escolhas curtas. */
export function Segmented<T extends string>({
  valor,
  onChange,
  opcoes,
  className,
  'aria-label': ariaLabel,
}: {
  valor: T
  onChange: (v: T) => void
  opcoes: Opcao<T>[]
  className?: string
  'aria-label'?: string
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={valor}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={ariaLabel}
      className={cn('inline-grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted p-1', className)}
    >
      {opcoes.map((o) => (
        <ToggleGroup.Item
          key={o.valor}
          value={o.valor}
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        >
          {o.rotulo}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
