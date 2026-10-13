import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', {
  variants: {
    variant: {
      default: 'bg-primary/12 text-primary',
      secondary: 'bg-muted text-muted-foreground',
      outline: 'border text-foreground',
      live: 'bg-red-500 text-white',
      lime: 'bg-lime text-neutral-900',
      warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Badge({ className, variant, ...props }: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
