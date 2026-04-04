import { cn } from '../../lib/utils'

export function Badge({ className, variant = 'default', ...props }) {
  const variants = {
    default: 'bg-muted text-muted-foreground border-border',
    primary: 'bg-primary/10 text-primary border-primary/20',
    accent:  'bg-accent/10 text-accent border-accent/20',
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2.5 py-0.5 font-mono text-xs tracking-wide rounded-sm',
        variants[variant] ?? variants.default,
        className,
      )}
      {...props}
    />
  )
}
