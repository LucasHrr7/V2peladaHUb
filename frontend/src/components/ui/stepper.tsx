import { Minus, Plus } from 'lucide-react'
import { Button } from './button'

/** Campo numérico com botões grandes, confortável para o celular. */
export function Stepper({
  valor,
  onChange,
  min,
  max,
  formatar = String,
  'aria-label': ariaLabel,
}: {
  valor: number
  onChange: (v: number) => void
  min: number
  max: number
  formatar?: (v: number) => string
  'aria-label'?: string
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-muted p-1" role="group" aria-label={ariaLabel}>
      <Button variant="ghost" size="icon-sm" onClick={() => onChange(Math.max(min, valor - 1))} disabled={valor <= min} aria-label="Diminuir">
        <Minus />
      </Button>
      <span className="tabular min-w-12 text-center text-sm font-semibold">{formatar(valor)}</span>
      <Button variant="ghost" size="icon-sm" onClick={() => onChange(Math.min(max, valor + 1))} disabled={valor >= max} aria-label="Aumentar">
        <Plus />
      </Button>
    </div>
  )
}
