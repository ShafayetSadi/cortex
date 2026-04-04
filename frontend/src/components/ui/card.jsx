import { cn } from '../../lib/utils'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-sm border border-border bg-card shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn('px-6 pt-6 pb-3', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        'font-heading text-xl font-semibold leading-snug text-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }) {
  return (
    <div
      className={cn('px-6 pb-6 pt-2', className)}
      {...props}
    />
  )
}
