import { cn } from '../../lib/utils'

export function Spinner({ className }) {
  return (
    <span
      className={cn(
        'inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin',
        className,
      )}
      aria-label="Loading"
    />
  )
}
