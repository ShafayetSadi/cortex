import { cn } from '../../lib/utils'

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full rounded-sm border border-border bg-card px-3 py-2 pr-8',
        'text-sm text-foreground placeholder:text-muted-foreground',
        'transition-colors duration-150',
        'focus:outline-2 focus:outline-ring focus:outline-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
