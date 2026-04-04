import { cn } from '../../lib/utils'

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-sm border border-border bg-card px-3 py-2',
        'text-sm text-foreground placeholder:text-muted-foreground',
        'resize-y transition-colors duration-150',
        'focus:outline-2 focus:outline-ring focus:outline-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
